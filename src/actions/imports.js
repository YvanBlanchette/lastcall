"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/auth";
import { listingOwnerData } from "@/lib/org";
import { parseWorkbook } from "@/lib/excel";
import { computeScore } from "@/lib/score";
import { notifyMatches } from "@/actions/listings";
import { slugify } from "@/lib/utils";

function batchBelongsTo(batch, user) {
	return user.supplierId ? batch.supplierId === user.supplierId : Boolean(user.agencyId) && batch.agencyId === user.agencyId;
}

/** Étape 1 : lire le fichier, produire un lot en attente de validation. */
export async function uploadImportAction(_prev, formData) {
	const user = await requireOrg();
	const file = formData.get("file");
	if (!file || typeof file === "string" || file.size === 0) {
		return { errors: { file: "Choisissez un fichier Excel (.xlsx) à importer." } };
	}
	if (file.size > 10 * 1024 * 1024) {
		return { errors: { file: "Le fichier ne doit pas dépasser 10 Mo." } };
	}

	const suppliers = await prisma.supplier.findMany({ select: { id: true, name: true } });
	const buffer = Buffer.from(await file.arrayBuffer());
	const { rows, fatal } = parseWorkbook(buffer, { suppliers });

	if (fatal) return { errors: { file: fatal } };

	const batch = await prisma.importBatch.create({
		data: {
			agencyId: user.agencyId ?? null,
			supplierId: user.supplierId ?? null,
			userId: user.id,
			fileName: file.name,
			source: "EXCEL",
			status: rows.every((r) => r.ok) ? "COMPLETED" : "NEEDS_REVIEW",
			rowCount: rows.length,
			successCount: rows.filter((r) => r.ok).length,
			errorCount: rows.filter((r) => !r.ok).length,
			rows: {
				create: rows.map((r) => ({
					rowNumber: r.rowNumber,
					raw: r.raw,
					parsed: JSON.parse(JSON.stringify(r.parsed)),
					errors: r.errors,
				})),
			},
		},
	});

	revalidatePath("/imports");
	return { ok: true, batchId: batch.id };
}

/** Étape 2 : publier les lignes validées. Idempotent via externalId. */
export async function commitImportAction(batchId) {
	const user = await requireOrg();

	const batch = await prisma.importBatch.findUnique({
		where: { id: batchId },
		include: { rows: true },
	});
	if (!batch || !batchBelongsTo(batch, user)) {
		return { error: "Ce lot d'import n'appartient pas à votre organisation." };
	}

	const publishable = batch.rows.filter((r) => r.errors.length === 0 && !r.listingId);
	const createdIds = [];

	for (const row of publishable) {
		const p = row.parsed;

		const supplierId = p.supplierId
			? p.supplierId
			: p.supplierName
				? (
						await prisma.supplier.upsert({
							where: { slug: slugify(p.supplierName) },
							update: {},
							create: { name: p.supplierName, slug: slugify(p.supplierName) },
						})
					).id
				: null;

		const shipId =
			supplierId && p.shipName
				? (
						await prisma.ship.upsert({
							where: { supplierId_name: { supplierId, name: p.shipName } },
							update: {},
							create: { supplierId, name: p.shipName },
						})
					).id
				: null;

		const data = {
			...listingOwnerData(user),
			authorId: user.id,
			supplierId,
			shipId,
			externalId: p.externalId,
			title: p.title,
			travelType: p.travelType,
			destination: p.destination,
			departureCity: p.departureCity,
			departureDate: new Date(p.departureDate),
			returnDate: p.returnDate ? new Date(p.returnDate) : null,
			language: p.language,
			inventoryType: p.inventoryType,
			inventoryLeft: p.inventoryLeft,
			cabinCategory: p.cabinCategory,
			soloAvailable: p.soloAvailable,
			guaranteed: p.guaranteed,
			price: p.price,
			currency: p.currency,
			releaseDate: new Date(p.releaseDate),
			expiresAt: new Date(p.releaseDate),
			groupBenefits: p.groupBenefits,
			commissionSplit: p.commissionSplit,
			notes: p.notes,
			visibility: p.visibility,
			status: "ACTIVE",
			publishedAt: new Date(),
			importBatchId: batch.id,
		};

		// Réimport du même fichier : on met à jour au lieu de dupliquer.
		const listing = p.externalId
			? await prisma.listing.upsert({
					where: user.supplierId
						? { ownerSupplierId_externalId: { ownerSupplierId: user.supplierId, externalId: p.externalId } }
						: { agencyId_externalId: { agencyId: user.agencyId, externalId: p.externalId } },
					update: {
						inventoryLeft: data.inventoryLeft,
						price: data.price,
						releaseDate: data.releaseDate,
						expiresAt: data.expiresAt,
						status: data.inventoryLeft > 0 ? "ACTIVE" : "SOLD_OUT",
					},
					create: data,
				})
			: await prisma.listing.create({ data });

		await prisma.listing.update({
			where: { id: listing.id },
			data: { score: computeScore(listing), scoredAt: new Date() },
		});
		await prisma.importRow.update({ where: { id: row.id }, data: { listingId: listing.id } });
		createdIds.push(listing.id);
	}

	await prisma.importBatch.update({
		where: { id: batch.id },
		data: { status: "COMPLETED", completedAt: new Date() },
	});

	// Alertes après coup : un envoi lent ne doit pas retenir l'import.
	await Promise.allSettled(createdIds.map((id) => notifyMatches(id)));

	revalidatePath("/imports");
	revalidatePath("/marketplace");
	revalidatePath("/mes-annonces");
	return { ok: true, published: createdIds.length };
}

export async function fixImportRowAction(rowId, patch) {
	const user = await requireOrg();
	const row = await prisma.importRow.findUnique({
		where: { id: rowId },
		include: { batch: true },
	});
	if (!row || !batchBelongsTo(row.batch, user)) return { error: "Action non autorisée." };

	const parsed = { ...row.parsed, ...patch };
	const errors = [];
	if (!parsed.title) errors.push("Le titre du groupe est manquant.");
	if (!parsed.releaseDate) errors.push("La date de relâche est manquante.");
	if (!parsed.departureDate) errors.push("La date de départ est manquante.");
	if (!parsed.price) errors.push("Le prix par personne est manquant.");
	if (!parsed.inventoryLeft) errors.push("Indiquez au moins 1 place ou cabine disponible.");

	await prisma.importRow.update({ where: { id: rowId }, data: { parsed, errors } });
	revalidatePath("/imports");
	return { ok: true, errors };
}
