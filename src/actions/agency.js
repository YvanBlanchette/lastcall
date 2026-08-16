"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAgency } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";
import { normalizePublicIdentifier } from "@/lib/utils";
import { PUBLIC_IDENTIFIER_REGEX } from "@/lib/validators";

const agencySchema = z.object({
	name: z.string().trim().min(2, "Indiquez le nom de l'agence."),
	publicIdentifier: z.string().trim().regex(PUBLIC_IDENTIFIER_REGEX, "L'identifiant agence doit contenir 3 à 32 caractères (a-z, 0-9, _ ou -)."),
	logoUrl: z.string().trim().url("Le logo doit être une URL valide.").optional().or(z.literal("")),
	description: z.string().trim().max(2000, "La description ne peut pas dépasser 2000 caractères.").optional().or(z.literal("")),
	contactEmail: z.string().trim().email("Courriel de contact invalide.").optional().or(z.literal("")),
	contactPhone: z.string().trim().max(30, "Téléphone trop long.").optional().or(z.literal("")),
	agencyIdCategory: z.enum(["iata", "clia", "tids"]).optional().or(z.literal("")),
	agencyId: z.string().trim().min(1, "Indiquez l'identifiant d'agence."),
	licenseNumber: z.string().trim().optional().or(z.literal("")),
	consortium: z.string().trim().optional().or(z.literal("")),
	website: z.string().trim().url("Le site web doit être une URL valide (https://...).").optional().or(z.literal("")),
	city: z.string().trim().optional().or(z.literal("")),
	province: z.string().trim().optional().or(z.literal("")),
	country: z.string().trim().length(2, "Le pays doit contenir 2 lettres.").optional().or(z.literal("")),
});

const addMemberSchema = z.object({
	email: z.string().trim().email("Adresse courriel invalide."),
	role: z.enum(["ADVISOR", "AGENCY_ADMIN"]).default("ADVISOR"),
});

function errorsFromZod(error) {
	const out = {};
	for (const issue of error.issues) {
		const key = issue.path[0] ?? "_";
		if (!out[key]) out[key] = issue.message;
	}
	return out;
}

async function requireAgencyAdmin() {
	const user = await requireAgency();
	if (user.agencyRole !== "AGENCY_ADMIN") {
		return { error: "Seul un administrateur d'agence peut effectuer cette action." };
	}
	return { user };
}

export async function uploadAgencyLogoAction(formData) {
	const auth = await requireAgencyAdmin();
	if (auth.error) return { error: auth.error };

	const file = formData.get("file");
	if (!file || typeof file === "string") {
		return { error: "Aucun fichier reçu." };
	}

	try {
		const image = await uploadImage(file, "lastcall/agencies");
		return { image };
	} catch (e) {
		return { error: e.message ?? "Impossible d'envoyer le logo." };
	}
}

export async function updateAgencyAction(_prev, formData) {
	const auth = await requireAgencyAdmin();
	if (auth.error) return { errors: { _: auth.error } };

	const raw = Object.fromEntries(formData);
	raw.publicIdentifier = normalizePublicIdentifier(raw.publicIdentifier);

	const parsed = agencySchema.safeParse(raw);
	if (!parsed.success) return { errors: errorsFromZod(parsed.error) };

	const { user } = auth;
	const d = parsed.data;
	const normalizedAgencyIdCategory = d.agencyIdCategory ? d.agencyIdCategory.toUpperCase() : null;

	if (d.publicIdentifier !== user.agency?.publicIdentifier) {
		const existingAgencyIdentifier = await prisma.agency.findUnique({
			where: { publicIdentifier: d.publicIdentifier },
			select: { id: true },
		});
		if (existingAgencyIdentifier && existingAgencyIdentifier.id !== user.agencyId) {
			return { errors: { publicIdentifier: "Cet identifiant agence est déjà pris." } };
		}

		const existingUserIdentifier = await prisma.user.findUnique({
			where: { publicIdentifier: d.publicIdentifier },
			select: { id: true },
		});
		if (existingUserIdentifier) {
			return { errors: { publicIdentifier: "Cet identifiant est déjà utilisé par un agent." } };
		}
	}

	await prisma.agency.update({
		where: { id: user.agencyId },
		data: {
			name: d.name,
			publicIdentifier: d.publicIdentifier,
			logoUrl: d.logoUrl || null,
			description: d.description || null,
			contactEmail: d.contactEmail || null,
			contactPhone: d.contactPhone || null,
			agencyIdCategory: normalizedAgencyIdCategory,
			agencyId: d.agencyId,
			licenseNumber: d.licenseNumber || null,
			consortium: d.consortium || null,
			website: d.website || null,
			city: d.city || null,
			province: d.province || null,
			country: (d.country || "CA").toUpperCase(),
		},
	});

	await prisma.auditLog.create({
		data: {
			userId: user.id,
			action: "AGENCY_UPDATED",
			entityType: "Agency",
			entityId: user.agencyId,
		},
	});

	revalidatePath("/agence");
	revalidatePath("/profil");
	revalidatePath("/accueil");
	return { ok: true, message: "Informations de l'agence mises à jour." };
}

export async function addAgencyAgentAction(_prev, formData) {
	const auth = await requireAgencyAdmin();
	if (auth.error) return { errors: { _: auth.error } };

	const parsed = addMemberSchema.safeParse(Object.fromEntries(formData));
	if (!parsed.success) return { errors: errorsFromZod(parsed.error) };

	const { user } = auth;
	const { email, role } = parsed.data;
	const normalizedEmail = email.toLowerCase();

	const targetUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
	if (!targetUser) {
		return { errors: { email: "Aucun utilisateur avec ce courriel. Demandez-lui de créer un compte d'abord." } };
	}

	const existingMembership = await prisma.agencyMember.findFirst({
		where: { userId: targetUser.id, agencyId: user.agencyId },
	});
	if (existingMembership) {
		return { errors: { email: "Cet utilisateur fait déjà partie de votre agence." } };
	}

	await prisma.$transaction(async (tx) => {
		await tx.agencyMember.create({
			data: {
				agencyId: user.agencyId,
				userId: targetUser.id,
				role,
				isPrimary: false,
			},
		});

		const agency = await tx.agency.findUnique({ where: { id: user.agencyId }, select: { status: true } });
		if (agency) {
			await tx.user.update({
				where: { id: targetUser.id },
				data: {
					role: role === "AGENCY_ADMIN" && targetUser.role === "ADVISOR" ? "AGENCY_ADMIN" : targetUser.role,
					status: agency.status,
				},
			});
		}

		await tx.auditLog.create({
			data: {
				userId: user.id,
				action: "AGENCY_MEMBER_ADDED",
				entityType: "User",
				entityId: targetUser.id,
			},
		});
	});

	revalidatePath("/agence");
	return { ok: true, message: "Agent ajouté à l'agence." };
}

export async function removeAgencyAgentAction(memberId) {
	const auth = await requireAgencyAdmin();
	if (auth.error) return { error: auth.error };

	const { user } = auth;

	const member = await prisma.agencyMember.findUnique({ where: { id: memberId } });
	if (!member || member.agencyId !== user.agencyId) {
		return { error: "Membre introuvable." };
	}

	if (member.userId === user.id) {
		return { error: "Vous ne pouvez pas vous retirer vous-même de l'agence." };
	}

	if (member.isPrimary) {
		return { error: "Le membre principal de l'agence ne peut pas être retiré." };
	}

	if (member.role === "AGENCY_ADMIN") {
		const adminCount = await prisma.agencyMember.count({
			where: { agencyId: user.agencyId, role: "AGENCY_ADMIN" },
		});
		if (adminCount <= 1) {
			return { error: "Il doit rester au moins un administrateur d'agence." };
		}
	}

	await prisma.$transaction(async (tx) => {
		await tx.agencyMember.delete({ where: { id: memberId } });

		const remainingMemberships = await tx.agencyMember.count({ where: { userId: member.userId } });
		if (remainingMemberships === 0) {
			await tx.user.update({ where: { id: member.userId }, data: { role: "ADVISOR" } });
		}

		await tx.auditLog.create({
			data: {
				userId: user.id,
				action: "AGENCY_MEMBER_REMOVED",
				entityType: "User",
				entityId: member.userId,
			},
		});
	});

	revalidatePath("/agence");
	return { ok: true };
}
