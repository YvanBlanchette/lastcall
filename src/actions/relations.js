"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAgency } from "@/lib/auth";
import { ensureConversationForRelation } from "@/lib/relations";

async function sendRelationRequestCore(user, targetUserId, requestMessage = "") {
	if (!targetUserId) return { errors: { targetUserId: "Agent introuvable." } };

	const target = await prisma.user.findUnique({ where: { id: targetUserId } });
	if (!target) return { errors: { targetUserId: "Agent introuvable." } };
	if (target.id === user.id) return { errors: { targetUserId: "Vous ne pouvez pas vous ajouter vous-meme." } };

	const relation = await prisma.agentRelation.findFirst({
		where: {
			OR: [
				{ requesterId: user.id, addresseeId: target.id },
				{ requesterId: target.id, addresseeId: user.id },
			],
		},
	});

	if (relation?.status === "ACCEPTED") {
		return { errors: { targetUserId: "Vous etes deja en relation avec cet agent." } };
	}
	if (relation?.status === "PENDING") {
		return { errors: { targetUserId: "Une demande est deja en attente entre vous." } };
	}

	if (relation) {
		await prisma.agentRelation.update({
			where: { id: relation.id },
			data: {
				requesterId: user.id,
				addresseeId: target.id,
				status: "PENDING",
				respondedAt: null,
				requestMessage,
			},
		});
	} else {
		await prisma.agentRelation.create({
			data: {
				requesterId: user.id,
				addresseeId: target.id,
				status: "PENDING",
				requestMessage,
			},
		});
	}

	await prisma.notification.create({
		data: {
			userId: target.id,
			type: "RELATION_REQUEST",
			title: `${user.firstName} ${user.lastName} souhaite vous ajouter dans ses relations`,
			body: requestMessage ? `MESSAGE:${requestMessage}` : user.agency?.name || null,
			entityId: user.id,
		},
	});

	revalidatePath("/relations");
	return { ok: true, message: "Demande de relation envoyee." };
}

export async function sendRelationRequestAction(_prev, formData) {
	const user = await requireAgency();
	const email = String(formData.get("email") || "")
		.trim()
		.toLowerCase();
	const requestMessage = String(formData.get("message") || "")
		.trim()
		.slice(0, 500);

	if (!email) return { errors: { email: "Entrez un courriel." } };

	const target = await prisma.user.findUnique({ where: { email } });
	if (!target) return { errors: { email: "Aucun agent trouvé avec ce courriel." } };
	const result = await sendRelationRequestCore(user, target.id, requestMessage);
	if (result.errors?.targetUserId) {
		return { errors: { email: result.errors.targetUserId } };
	}
	return result;
}

export async function sendRelationRequestToUserAction(_prev, formData) {
	const user = await requireAgency();
	const targetUserId = String(formData.get("targetUserId") || "").trim();
	const requestMessage = String(formData.get("message") || "")
		.trim()
		.slice(0, 500);

	if (!targetUserId) return { errors: { targetUserId: "Agent introuvable." } };
	return sendRelationRequestCore(user, targetUserId, requestMessage);
}

export async function respondRelationRequestAction(relationId, decision) {
	const user = await requireAgency();
	if (!["accept", "decline"].includes(decision)) {
		return { error: "Action invalide." };
	}

	const relation = await prisma.agentRelation.findUnique({ where: { id: relationId } });
	if (!relation || relation.addresseeId !== user.id || relation.status !== "PENDING") {
		return { error: "Demande introuvable." };
	}

	if (decision === "decline") {
		await prisma.agentRelation.update({
			where: { id: relationId },
			data: { status: "DECLINED", respondedAt: new Date() },
		});
		revalidatePath("/relations");
		return { ok: true };
	}

	await prisma.$transaction(async (tx) => {
		const updated = await tx.agentRelation.update({
			where: { id: relationId },
			data: { status: "ACCEPTED", respondedAt: new Date() },
		});

		await ensureConversationForRelation(tx, updated.id);

		await tx.notification.create({
			data: {
				userId: updated.requesterId,
				type: "RELATION_ACCEPTED",
				title: "Votre demande de relation a été acceptée",
				entityId: updated.id,
			},
		});
	});

	revalidatePath("/relations");
	revalidatePath("/messagerie");
	return { ok: true };
}

export async function removeRelationAction(relationId) {
	const user = await requireAgency();

	const relation = await prisma.agentRelation.findUnique({ where: { id: relationId } });
	if (!relation) return { error: "Relation introuvable." };
	if (relation.requesterId !== user.id && relation.addresseeId !== user.id) {
		return { error: "Action non autorisée." };
	}

	await prisma.agentRelation.update({
		where: { id: relationId },
		data: { status: "DECLINED", respondedAt: new Date() },
	});

	revalidatePath("/relations");
	return { ok: true };
}
