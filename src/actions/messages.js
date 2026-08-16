"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAgency } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";

function toChannelSlug(value) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 40);
}

function channelKind(agencyId, slug) {
	return `AGENCY_CHANNEL:${agencyId}:${slug}`;
}

export async function createAgencyChannelAction(_prev, formData) {
	const resolvedFormData = formData instanceof FormData ? formData : _prev instanceof FormData ? _prev : null;
	if (!resolvedFormData) return { errors: { _: "Formulaire invalide." } };

	const user = await requireAgency();
	const canCreate = user.role === "PLATFORM_ADMIN" || user.agencyRole === "AGENCY_ADMIN";
	if (!canCreate) {
		return { errors: { _: "Seuls les administrateurs de l'agence peuvent créer des canaux." } };
	}

	const rawName = String(resolvedFormData.get("name") || "").trim();
	if (!rawName) return { errors: { name: "Donnez un nom au canal." } };

	const slug = toChannelSlug(rawName);
	if (!slug) return { errors: { name: "Le nom du canal n'est pas valide." } };

	const kind = channelKind(user.agencyId, slug);
	const existing = await prisma.conversation.findFirst({
		where: { kind },
		select: { id: true },
	});

	if (existing) {
		revalidatePath("/messagerie");
		redirect(`/messagerie?c=${existing.id}`);
	}

	const members = await prisma.agencyMember.findMany({
		where: { agencyId: user.agencyId },
		select: { userId: true },
	});
	const memberIds = [...new Set(members.map((member) => member.userId).filter(Boolean))];
	if (!memberIds.length) {
		return { errors: { _: "Aucun membre d'agence trouvé pour ce canal." } };
	}

	const conversation = await prisma.conversation.create({
		data: {
			kind,
			participants: {
				createMany: {
					data: memberIds.map((userId) => ({ userId })),
					skipDuplicates: true,
				},
			},
		},
		select: { id: true },
	});

	revalidatePath("/messagerie");
	redirect(`/messagerie?c=${conversation.id}`);
}

export async function sendMessageAction(_prev, formData) {
	const resolvedFormData = formData instanceof FormData ? formData : _prev instanceof FormData ? _prev : null;
	if (!resolvedFormData) return { errors: { _: "Formulaire invalide." } };

	const user = await requireAgency();
	const conversationId = String(resolvedFormData.get("conversationId") || "").trim();
	const body = String(resolvedFormData.get("body") || "").trim();
	const imageUrl = String(resolvedFormData.get("imageUrl") || "").trim();
	const imagePublicId = String(resolvedFormData.get("imagePublicId") || "").trim();

	if (!conversationId) return { errors: { _: "Conversation introuvable." } };
	if (!body && !imageUrl) return { errors: { body: "Écrivez un message ou ajoutez une image." } };

	const participant = await prisma.conversationParticipant.findUnique({
		where: { conversationId_userId: { conversationId, userId: user.id } },
	});
	if (!participant) return { errors: { _: "Action non autorisée." } };

	await prisma.$transaction(async (tx) => {
		await tx.conversationParticipant.updateMany({
			where: { conversationId, lastReadAt: null },
			data: { lastReadAt: new Date(0) },
		});

		await tx.conversationMessage.create({
			data: {
				conversationId,
				senderId: user.id,
				body,
				imageUrl: imageUrl || null,
				imagePublicId: imagePublicId || null,
			},
		});

		await tx.conversationParticipant.update({
			where: { conversationId_userId: { conversationId, userId: user.id } },
			data: { lastReadAt: new Date() },
		});

		await tx.conversation.update({
			where: { id: conversationId },
			data: { updatedAt: new Date() },
		});
	});

	revalidatePath("/messagerie");
	return { ok: true };
}

export async function uploadMessageImageAction(formData) {
	await requireAgency();

	const file = formData.get("file");
	if (!file || typeof file === "string") {
		return { error: "Aucun fichier reçu." };
	}

	try {
		const image = await uploadImage(file, "lastcall/messages");
		return { image };
	} catch (e) {
		return { error: e.message ?? "Impossible d'envoyer l'image." };
	}
}

export async function markConversationReadAction(conversationId) {
	const user = await requireAgency();

	await prisma.conversationParticipant.updateMany({
		where: { conversationId, userId: user.id },
		data: { lastReadAt: new Date() },
	});

	revalidatePath("/messagerie");
	return { ok: true };
}
