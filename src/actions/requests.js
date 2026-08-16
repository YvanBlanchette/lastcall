"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAgency, requireOrg } from "@/lib/auth";
import { ownsListing } from "@/lib/org";
import { interestRequestSchema, fieldErrors } from "@/lib/validators";
import { mail } from "@/lib/mail";
import { ensureRelationConversationFromRequest } from "@/lib/relations";

export async function createInterestRequestAction(_prev, formData) {
	const user = await requireOrg();
	if (!user.agencyId) {
		return { errors: { _: "Les comptes fournisseurs ne peuvent pas envoyer de demandes." } };
	}
	const parsed = interestRequestSchema.safeParse(Object.fromEntries(formData));
	if (!parsed.success) return { errors: fieldErrors(parsed.error) };
	const d = parsed.data;

	const listing = await prisma.listing.findUnique({
		where: { id: d.listingId },
		include: { author: true, agency: true, ownerSupplier: true },
	});
	if (!listing || listing.status !== "ACTIVE") {
		return { errors: { _: "Cet espace n'est plus disponible." } };
	}
	if (ownsListing(listing, user)) {
		return { errors: { _: "Cette annonce appartient à votre organisation." } };
	}

	const existing = await prisma.interestRequest.findFirst({
		where: { listingId: listing.id, buyerUserId: user.id, status: { notIn: ["CLOSED", "DECLINED"] } },
	});
	if (existing) {
		return { errors: { _: "Vous avez déjà une demande en cours pour cet espace." } };
	}

	const request = await prisma.$transaction(async (tx) => {
		const created = await tx.interestRequest.create({
			data: {
				listingId: listing.id,
				buyerUserId: user.id,
				sellerUserId: listing.authorId,
				buyerAgencyId: user.agencyId,
				message: d.message || null,
				numberOfTravelers: d.numberOfTravelers,
			},
			include: { buyerAgency: true },
		});

		await tx.listing.update({
			where: { id: listing.id },
			data: { requestCount: { increment: 1 } },
		});

		await tx.notification.create({
			data: {
				userId: listing.authorId,
				type: "REQUEST_RECEIVED",
				title: `Un conseiller a un client pour ${listing.title}`,
				body: `${created.buyerAgency.name} · ${d.numberOfTravelers} voyageur(s)`,
				entityId: created.id,
			},
		});

		return created;
	});

	await mail.requestReceived(listing.author, request, listing);

	revalidatePath("/demandes");
	revalidatePath(`/listing/${listing.id}`);
	return { ok: true };
}

export async function respondToRequestAction(requestId, status, note) {
	const user = await requireOrg();

	const request = await prisma.interestRequest.findUnique({
		where: { id: requestId },
		include: { listing: true, buyer: true },
	});
	if (!request || request.sellerUserId !== user.id) {
		return { error: "Cette demande ne vous est pas adressée." };
	}

	await prisma.$transaction(async (tx) => {
		await tx.interestRequest.update({
			where: { id: requestId },
			data: {
				status,
				outcomeNote: note || undefined,
				respondedAt: request.respondedAt ?? new Date(),
				connectedAt: status === "CONNECTED" ? new Date() : request.connectedAt,
			},
		});

		if (status === "CONNECTED") {
			await ensureRelationConversationFromRequest(tx, request);
		}
	});

	await prisma.notification.create({
		data: {
			userId: request.buyerUserId,
			type: "REQUEST_ANSWERED",
			title: `Réponse à votre demande — ${request.listing.title}`,
			entityId: request.id,
		},
	});

	await mail.requestAnswered(request.buyer, request.listing, status);

	revalidatePath("/demandes");
	return { ok: true };
}

export async function markRequestViewedAction(requestId) {
	const user = await requireOrg();
	await prisma.interestRequest.updateMany({
		where: { id: requestId, sellerUserId: user.id, status: "NEW" },
		data: { status: "VIEWED" },
	});
	revalidatePath("/demandes");
}

/**
 * Résultat déclaré par le vendeur.
 *
 * LastCall ne tient pas la transaction : c'est la seule trace possible d'une
 * réservation réellement conclue. Sans elle, aucune preuve de valeur à
 * présenter aux fournisseurs — voir README, section « Mesurer ce qui compte ».
 */
export async function declareOutcomeAction(requestId, booked, note) {
	const user = await requireOrg();
	const request = await prisma.interestRequest.findUnique({ where: { id: requestId } });
	if (!request || request.sellerUserId !== user.id) {
		return { error: "Action non autorisée." };
	}

	await prisma.interestRequest.update({
		where: { id: requestId },
		data: {
			outcomeBooked: Boolean(booked),
			outcomeNote: note || null,
			status: booked ? "CLOSED" : request.status,
		},
	});

	await prisma.auditLog.create({
		data: {
			userId: user.id,
			action: booked ? "REQUEST_BOOKED" : "REQUEST_NOT_BOOKED",
			entityType: "InterestRequest",
			entityId: requestId,
		},
	});

	revalidatePath("/demandes");
	return { ok: true };
}
