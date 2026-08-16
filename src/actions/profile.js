"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/auth";
import { fieldErrors, profileSchema, supplierProfileSchema } from "@/lib/validators";
import { uploadImage } from "@/lib/cloudinary";
import { normalizePublicIdentifier } from "@/lib/utils";

export async function uploadProfilePhotoAction(formData) {
	await requireOrg();

	const file = formData.get("file");
	if (!file || typeof file === "string") {
		return { error: "Aucun fichier reçu." };
	}

	try {
		const image = await uploadImage(file, "lastcall/avatars");
		return { image };
	} catch (e) {
		return { error: e.message ?? "Impossible d'envoyer l'image." };
	}
}

/** Identifiant public unique, tous types d'organisation confondus. */
async function identifierTakenBy(identifier) {
	const [user, agency, supplier] = await Promise.all([
		prisma.user.findUnique({ where: { publicIdentifier: identifier }, select: { id: true } }),
		prisma.agency.findUnique({ where: { publicIdentifier: identifier }, select: { id: true } }),
		prisma.supplier.findUnique({ where: { publicIdentifier: identifier }, select: { id: true } }),
	]);
	return { user, agency, supplier };
}

async function updateSupplierProfile(user, raw) {
	const parsed = supplierProfileSchema.safeParse(raw);
	if (!parsed.success) return { errors: fieldErrors(parsed.error) };
	const d = parsed.data;

	const targetEmail = d.email.toLowerCase();
	if (targetEmail !== user.email.toLowerCase()) {
		const existing = await prisma.user.findUnique({ where: { email: targetEmail }, select: { id: true } });
		if (existing && existing.id !== user.id) {
			return { errors: { email: "Cette adresse courriel est déjà utilisée." } };
		}
	}

	if (d.userPublicIdentifier !== user.publicIdentifier) {
		const taken = await identifierTakenBy(d.userPublicIdentifier);
		if ((taken.user && taken.user.id !== user.id) || taken.agency || taken.supplier) {
			return { errors: { userPublicIdentifier: "Cet identifiant est déjà pris." } };
		}
	}

	if (d.agencyPublicIdentifier !== user.supplier?.publicIdentifier) {
		const taken = await identifierTakenBy(d.agencyPublicIdentifier);
		if (taken.user || taken.agency || (taken.supplier && taken.supplier.id !== user.supplierId)) {
			return { errors: { agencyPublicIdentifier: "Cet identifiant est déjà pris." } };
		}
	}

	await prisma.$transaction([
		prisma.user.update({
			where: { id: user.id },
			data: {
				firstName: d.firstName,
				lastName: d.lastName,
				email: targetEmail,
				publicIdentifier: d.userPublicIdentifier,
				phone: d.phone || null,
				bio: d.bio || null,
				avatarUrl: d.avatarUrl || null,
			},
		}),
		prisma.supplier.update({
			where: { id: user.supplierId },
			data: {
				name: d.agencyName,
				publicIdentifier: d.agencyPublicIdentifier,
				website: d.website || null,
				city: d.city || null,
				province: d.province || null,
			},
		}),
	]);

	revalidatePath("/profil");
	revalidatePath("/accueil");
	return { ok: true, message: "Profil mis à jour." };
}

export async function updateProfileAction(_prev, formData) {
	const user = await requireOrg();

	const raw = Object.fromEntries(formData);
	raw.userPublicIdentifier = normalizePublicIdentifier(raw.userPublicIdentifier);
	raw.agencyPublicIdentifier = normalizePublicIdentifier(raw.agencyPublicIdentifier);

	if (user.supplierId) return updateSupplierProfile(user, raw);

	const parsed = profileSchema.safeParse(raw);
	if (!parsed.success) return { errors: fieldErrors(parsed.error) };
	const d = parsed.data;

	const targetEmail = d.email.toLowerCase();
	if (targetEmail !== user.email.toLowerCase()) {
		const existing = await prisma.user.findUnique({ where: { email: targetEmail }, select: { id: true } });
		if (existing && existing.id !== user.id) {
			return { errors: { email: "Cette adresse courriel est déjà utilisée." } };
		}
	}

	if (d.userPublicIdentifier !== user.publicIdentifier) {
		const existingUserIdentifier = await prisma.user.findUnique({
			where: { publicIdentifier: d.userPublicIdentifier },
			select: { id: true },
		});
		if (existingUserIdentifier && existingUserIdentifier.id !== user.id) {
			return { errors: { userPublicIdentifier: "Cet identifiant agent est déjà pris." } };
		}

		const existingAgencyIdentifier = await prisma.agency.findUnique({
			where: { publicIdentifier: d.userPublicIdentifier },
			select: { id: true },
		});
		if (existingAgencyIdentifier) {
			return { errors: { userPublicIdentifier: "Cet identifiant est déjà utilisé par une agence." } };
		}
	}

	if (d.agencyPublicIdentifier !== user.agency?.publicIdentifier) {
		const existingAgencyIdentifier = await prisma.agency.findUnique({
			where: { publicIdentifier: d.agencyPublicIdentifier },
			select: { id: true },
		});
		if (existingAgencyIdentifier && existingAgencyIdentifier.id !== user.agencyId) {
			return { errors: { agencyPublicIdentifier: "Cet identifiant agence est déjà pris." } };
		}

		const existingUserIdentifier = await prisma.user.findUnique({
			where: { publicIdentifier: d.agencyPublicIdentifier },
			select: { id: true },
		});
		if (existingUserIdentifier) {
			return { errors: { agencyPublicIdentifier: "Cet identifiant est déjà utilisé par un agent." } };
		}
	}

	const normalizedAgencyIdCategory = d.agencyIdCategory ? d.agencyIdCategory.toUpperCase() : null;

	await prisma.$transaction([
		prisma.user.update({
			where: { id: user.id },
			data: {
				firstName: d.firstName,
				lastName: d.lastName,
				email: targetEmail,
				publicIdentifier: d.userPublicIdentifier,
				phone: d.phone || null,
				bio: d.bio || null,
				avatarUrl: d.avatarUrl || null,
			},
		}),
		prisma.agency.update({
			where: { id: user.agencyId },
			data: {
				name: d.agencyName,
				publicIdentifier: d.agencyPublicIdentifier,
				agencyIdCategory: normalizedAgencyIdCategory,
				agencyId: d.agencyId,
				licenseNumber: d.licenseNumber || null,
				consortium: d.consortium || null,
				website: d.website || null,
				city: d.city || null,
				province: d.province || null,
			},
		}),
	]);

	revalidatePath("/profil");
	revalidatePath("/agence");
	revalidatePath("/accueil");
	return { ok: true, message: "Profil mis à jour." };
}
