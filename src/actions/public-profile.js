"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAgency, requireUser } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";

function revalidateProfile(publicIdentifier) {
	if (!publicIdentifier) return;
	revalidatePath(`/profil-public/${publicIdentifier}`);
}

function toPositionY(raw) {
	const value = Number(raw);
	if (!Number.isFinite(value)) return 50;
	return Math.max(0, Math.min(100, Math.round(value)));
}

export async function uploadUserAvatarQuickAction(formData) {
	const user = await requireUser();
	const file = formData.get("file");
	if (!file || typeof file === "string") return { error: "Aucun fichier reçu." };

	try {
		const image = await uploadImage(file, "lastcall/avatars");
		await prisma.user.update({
			where: { id: user.id },
			data: { avatarUrl: image.url },
		});
		revalidateProfile(user.publicIdentifier);
		revalidatePath("/profil");
		return { ok: true, image };
	} catch (e) {
		return { error: e.message ?? "Impossible de mettre à jour la photo." };
	}
}

export async function uploadUserCoverQuickAction(formData) {
	const user = await requireUser();
	const file = formData.get("file");
	if (!file || typeof file === "string") return { error: "Aucun fichier reçu." };

	try {
		const image = await uploadImage(file, "lastcall/covers/users");
		await prisma.user.update({
			where: { id: user.id },
			data: { coverUrl: image.url, coverPositionY: 50 },
		});
		revalidateProfile(user.publicIdentifier);
		return { ok: true, image };
	} catch (e) {
		return { error: e.message ?? "Impossible de mettre à jour la couverture." };
	}
}

export async function updateUserCoverPositionQuickAction(formData) {
	const user = await requireUser();
	const coverPositionY = toPositionY(formData.get("coverPositionY"));

	try {
		await prisma.user.update({
			where: { id: user.id },
			data: { coverPositionY },
		});
		revalidateProfile(user.publicIdentifier);
		return { ok: true, coverPositionY };
	} catch (e) {
		return { error: e.message ?? "Impossible de repositionner la couverture." };
	}
}

export async function uploadAgencyLogoQuickAction(formData) {
	const user = await requireAgency();
	if (user.agencyRole !== "AGENCY_ADMIN") {
		return { error: "Seul un administrateur d'agence peut modifier le logo." };
	}

	const file = formData.get("file");
	if (!file || typeof file === "string") return { error: "Aucun fichier reçu." };

	try {
		const image = await uploadImage(file, "lastcall/agencies");
		const agency = await prisma.agency.update({
			where: { id: user.agencyId },
			data: { logoUrl: image.url },
			select: { publicIdentifier: true },
		});
		revalidateProfile(agency.publicIdentifier);
		revalidatePath("/agence");
		return { ok: true, image };
	} catch (e) {
		return { error: e.message ?? "Impossible de mettre à jour le logo." };
	}
}

export async function uploadAgencyCoverQuickAction(formData) {
	const user = await requireAgency();
	if (user.agencyRole !== "AGENCY_ADMIN") {
		return { error: "Seul un administrateur d'agence peut modifier la couverture." };
	}

	const file = formData.get("file");
	if (!file || typeof file === "string") return { error: "Aucun fichier reçu." };

	try {
		const image = await uploadImage(file, "lastcall/covers/agencies");
		const agency = await prisma.agency.update({
			where: { id: user.agencyId },
			data: { coverUrl: image.url, coverPositionY: 50 },
			select: { publicIdentifier: true },
		});
		revalidateProfile(agency.publicIdentifier);
		return { ok: true, image };
	} catch (e) {
		return { error: e.message ?? "Impossible de mettre à jour la couverture." };
	}
}

export async function updateAgencyCoverPositionQuickAction(formData) {
	const user = await requireAgency();
	if (user.agencyRole !== "AGENCY_ADMIN") {
		return { error: "Seul un administrateur d'agence peut modifier la couverture." };
	}

	const coverPositionY = toPositionY(formData.get("coverPositionY"));

	try {
		const agency = await prisma.agency.update({
			where: { id: user.agencyId },
			data: { coverPositionY },
			select: { publicIdentifier: true },
		});
		revalidateProfile(agency.publicIdentifier);
		return { ok: true, coverPositionY };
	} catch (e) {
		return { error: e.message ?? "Impossible de repositionner la couverture." };
	}
}
