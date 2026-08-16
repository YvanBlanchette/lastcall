"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/auth";
import { listingOwnerData, ownsListing } from "@/lib/org";
import { listingSchema, fieldErrors } from "@/lib/validators";
import { computeScore } from "@/lib/score";
import { findMatchingSavedSearches } from "@/lib/matching";
import { mail } from "@/lib/mail";
import { uploadImage } from "@/lib/cloudinary";
import { slugify } from "@/lib/utils";

/** Crée le fournisseur s'il n'existe pas — évite de bloquer un import sur un nom inconnu. */
async function resolveSupplier(tx, { supplierId, supplierName }) {
	if (supplierId) return supplierId;
	if (!supplierName) return null;
	const slug = slugify(supplierName);
	const supplier = await tx.supplier.upsert({
		where: { slug },
		update: {},
		create: { name: supplierName, slug },
	});
	return supplier.id;
}

async function resolveShip(tx, supplierId, shipName) {
	if (!supplierId || !shipName) return null;
	const ship = await tx.ship.upsert({
		where: { supplierId_name: { supplierId, name: shipName } },
		update: {},
		create: { supplierId, name: shipName },
	});
	return ship.id;
}

/**
 * Notifie les recherches sauvegardées correspondantes.
 * Appelé après publication, jamais pendant la transaction : un échec d'envoi
 * ne doit pas annuler la création de l'annonce.
 */
export async function notifyMatches(listingId) {
	const listing = await prisma.listing.findUnique({
		where: { id: listingId },
		include: { agency: true, ownerSupplier: true },
	});
	if (!listing || listing.status !== "ACTIVE") return 0;

	const matches = await findMatchingSavedSearches(listing);

	await prisma.$transaction([
		prisma.notification.createMany({
			data: matches.map((m) => ({
				userId: m.userId,
				type: "NEW_MATCH",
				title: `Un espace correspond à « ${m.name} »`,
				body: `${listing.title} — ${listing.destination}`,
				entityId: listing.id,
			})),
		}),
		prisma.savedSearch.updateMany({
			where: { id: { in: matches.map((m) => m.id) } },
			data: { lastMatchedAt: new Date(), matchCount: { increment: 1 } },
		}),
	]);

	await Promise.allSettled(matches.filter((m) => m.alertChannel !== "IN_APP").map((m) => mail.savedSearchMatch(m.user, m, listing)));

	// Le score dépend de la demande latente : on le recalcule une fois connue.
	await prisma.listing.update({
		where: { id: listing.id },
		data: {
			score: computeScore(listing, { matchingSavedSearches: matches.length }),
			scoredAt: new Date(),
		},
	});

	return matches.length;
}

export async function createListingAction(_prev, formData) {
	const user = await requireOrg();

	const payload = Object.fromEntries(formData);
	payload.images = formData.get("images") ? JSON.parse(formData.get("images")) : [];
	payload.soloAvailable = formData.get("soloAvailable") === "on" || formData.get("soloAvailable") === "true";
	payload.guaranteed = formData.get("guaranteed") === "on" || formData.get("guaranteed") === "true";
	payload.priceHidden = formData.get("priceHidden") === "on" || formData.get("priceHidden") === "true";

	const parsed = listingSchema.safeParse(payload);
	if (!parsed.success) return { errors: fieldErrors(parsed.error) };
	const d = parsed.data;

	const publish = formData.get("intent") !== "draft";

	const listing = await prisma.$transaction(async (tx) => {
		// Un fournisseur est toujours le fournisseur de ses propres départs.
		const supplierId = user.supplierId
			? user.supplierId
			: await resolveSupplier(tx, {
					supplierId: d.supplierId || null,
					supplierName: formData.get("supplierName") || null,
				});
		const shipId = await resolveShip(tx, supplierId, d.shipName);

		const created = await tx.listing.create({
			data: {
				externalId: d.externalId || null,
				...listingOwnerData(user),
				authorId: user.id,
				supplierId,
				shipId,
				title: d.title,
				travelType: d.travelType,
				destination: d.destination,
				departureCity: d.departureCity,
				departureDate: d.departureDate,
				returnDate: d.returnDate ?? null,
				nights: d.returnDate ? Math.round((d.returnDate - d.departureDate) / 86_400_000) : null,
				language: d.language,
				inventoryType: d.inventoryType,
				inventoryTotal: d.inventoryTotal ?? null,
				inventoryLeft: d.inventoryLeft,
				cabinCategory: d.cabinCategory || null,
				soloAvailable: d.soloAvailable,
				guaranteed: d.guaranteed,
				price: d.price,
				currency: d.currency,
				priceHidden: d.priceHidden,
				releaseDate: d.releaseDate,
				expiresAt: d.releaseDate,
				groupBenefits: d.groupBenefits || null,
				conditions: d.conditions || null,
				commissionSplit: d.commissionSplit || null,
				notes: d.notes || null,
				visibility: d.visibility,
				status: publish ? "ACTIVE" : "DRAFT",
				publishedAt: publish ? new Date() : null,
				images: {
					create: d.images.map((img, i) => ({
						publicId: img.publicId,
						url: img.url,
						width: img.width,
						height: img.height,
						position: i,
						isCover: i === 0,
					})),
				},
			},
			include: { images: true, agency: true, ownerSupplier: true },
		});

		await tx.listing.update({
			where: { id: created.id },
			data: { score: computeScore(created), scoredAt: new Date() },
		});

		await tx.auditLog.create({
			data: {
				userId: user.id,
				action: publish ? "LISTING_PUBLISHED" : "LISTING_DRAFTED",
				entityType: "Listing",
				entityId: created.id,
			},
		});

		return created;
	});

	if (publish) await notifyMatches(listing.id);

	revalidatePath("/marketplace");
	revalidatePath("/mes-annonces");
	redirect(`/listing/${listing.id}?publiee=1`);
}

export async function updateListingAction(_prev, formData) {
	const user = await requireOrg();
	const listingId = String(formData.get("listingId") || "").trim();
	if (!listingId) return { errors: { _: "Annonce introuvable." } };

	const existing = await prisma.listing.findUnique({ where: { id: listingId } });
	if (!existing || !ownsListing(existing, user)) {
		return { errors: { _: "Action non autorisée." } };
	}

	const payload = Object.fromEntries(formData);
	payload.images = formData.get("images") ? JSON.parse(formData.get("images")) : [];
	payload.soloAvailable = formData.get("soloAvailable") === "on" || formData.get("soloAvailable") === "true";
	payload.guaranteed = formData.get("guaranteed") === "on" || formData.get("guaranteed") === "true";
	payload.priceHidden = formData.get("priceHidden") === "on" || formData.get("priceHidden") === "true";

	const parsed = listingSchema.safeParse(payload);
	if (!parsed.success) return { errors: fieldErrors(parsed.error) };
	const d = parsed.data;

	const publish = formData.get("intent") !== "draft";

	const listing = await prisma.$transaction(async (tx) => {
		const supplierId = user.supplierId
			? user.supplierId
			: await resolveSupplier(tx, {
					supplierId: d.supplierId || null,
					supplierName: formData.get("supplierName") || null,
				});
		const shipId = await resolveShip(tx, supplierId, d.shipName);

		const updated = await tx.listing.update({
			where: { id: listingId },
			data: {
				externalId: d.externalId || null,
				supplierId,
				shipId,
				title: d.title,
				travelType: d.travelType,
				destination: d.destination,
				departureCity: d.departureCity,
				departureDate: d.departureDate,
				returnDate: d.returnDate ?? null,
				nights: d.returnDate ? Math.round((d.returnDate - d.departureDate) / 86_400_000) : null,
				language: d.language,
				inventoryType: d.inventoryType,
				inventoryTotal: d.inventoryTotal ?? null,
				inventoryLeft: d.inventoryLeft,
				cabinCategory: d.cabinCategory || null,
				soloAvailable: d.soloAvailable,
				guaranteed: d.guaranteed,
				price: d.price,
				currency: d.currency,
				priceHidden: d.priceHidden,
				releaseDate: d.releaseDate,
				expiresAt: d.releaseDate,
				groupBenefits: d.groupBenefits || null,
				conditions: d.conditions || null,
				commissionSplit: d.commissionSplit || null,
				notes: d.notes || null,
				visibility: d.visibility,
				status: publish ? (d.inventoryLeft === 0 ? "SOLD_OUT" : "ACTIVE") : "DRAFT",
				publishedAt: publish ? (existing.publishedAt ?? new Date()) : null,
				images: {
					deleteMany: {},
					create: d.images.map((img, i) => ({
						publicId: img.publicId,
						url: img.url,
						width: img.width,
						height: img.height,
						position: i,
						isCover: i === 0,
					})),
				},
			},
			include: { images: true, agency: true, ownerSupplier: true },
		});

		await tx.listing.update({
			where: { id: updated.id },
			data: { score: computeScore(updated), scoredAt: new Date() },
		});

		await tx.auditLog.create({
			data: {
				userId: user.id,
				action: publish ? "LISTING_UPDATED_ACTIVE" : "LISTING_UPDATED_DRAFT",
				entityType: "Listing",
				entityId: updated.id,
			},
		});

		return updated;
	});

	if (publish && existing.status !== "ACTIVE" && listing.status === "ACTIVE") {
		await notifyMatches(listing.id);
	}

	revalidatePath("/marketplace");
	revalidatePath("/mes-annonces");
	revalidatePath(`/listing/${listing.id}`);
	redirect(`/listing/${listing.id}?modifiee=1`);
}

export async function updateInventoryAction(listingId, inventoryLeft) {
	const user = await requireOrg();
	const listing = await prisma.listing.findUnique({ where: { id: listingId } });
	if (!listing || !ownsListing(listing, user)) {
		return { error: "Cette annonce n'appartient pas à votre organisation." };
	}

	const left = Math.max(0, Number(inventoryLeft));
	await prisma.listing.update({
		where: { id: listingId },
		data: {
			inventoryLeft: left,
			status: left === 0 ? "SOLD_OUT" : listing.status === "SOLD_OUT" ? "ACTIVE" : listing.status,
		},
	});

	revalidatePath("/mes-annonces");
	revalidatePath(`/listing/${listingId}`);
	return { ok: true };
}

export async function setListingStatusAction(listingId, status) {
	const user = await requireOrg();
	const listing = await prisma.listing.findUnique({ where: { id: listingId } });
	if (!listing || (!ownsListing(listing, user) && user.role !== "PLATFORM_ADMIN")) {
		return { error: "Action non autorisée." };
	}

	await prisma.listing.update({ where: { id: listingId }, data: { status } });
	await prisma.auditLog.create({
		data: { userId: user.id, action: `LISTING_${status}`, entityType: "Listing", entityId: listingId },
	});

	revalidatePath("/mes-annonces");
	revalidatePath("/marketplace");
	return { ok: true };
}

export async function uploadListingImageAction(formData) {
	await requireOrg();
	const file = formData.get("file");
	if (!file || typeof file === "string") return { error: "Aucun fichier reçu." };
	try {
		const image = await uploadImage(file);
		return { image };
	} catch (e) {
		return { error: e.message };
	}
}

/** Vue enregistrée de façon non bloquante : la page ne doit pas attendre. */
export async function trackListingView(listingId, userId, source = "MARKETPLACE") {
	try {
		await prisma.$transaction([
			prisma.listingView.create({ data: { listingId, userId: userId ?? null, source } }),
			prisma.listing.update({ where: { id: listingId }, data: { viewCount: { increment: 1 } } }),
		]);
	} catch {
		/* la télémétrie ne doit jamais casser une page */
	}
}
