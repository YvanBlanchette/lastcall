"use server";

import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { registerSchema, loginSchema, fieldErrors } from "@/lib/validators";
import { slugify } from "@/lib/utils";
import { mail } from "@/lib/mail";

async function createAvailablePublicIdentifier(tx) {
	for (let i = 0; i < 5; i += 1) {
		const candidate = randomUUID();
		const [userTaken, agencyTaken, supplierTaken] = await Promise.all([
			tx.user.findUnique({ where: { publicIdentifier: candidate }, select: { id: true } }),
			tx.agency.findUnique({ where: { publicIdentifier: candidate }, select: { id: true } }),
			tx.supplier.findUnique({ where: { publicIdentifier: candidate }, select: { id: true } }),
		]);
		if (!userTaken && !agencyTaken && !supplierTaken) return candidate;
	}

	return randomUUID();
}

async function availableSlug(model, base) {
	let slug = slugify(base);
	const taken = await model.findUnique({ where: { slug } });
	if (taken) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
	return slug;
}

async function registerSupplier(d) {
	const slug = await availableSlug(prisma.supplier, d.supplierName);

	const user = await prisma.$transaction(async (tx) => {
		const supplierPublicIdentifier = await createAvailablePublicIdentifier(tx);
		const userPublicIdentifier = await createAvailablePublicIdentifier(tx);

		const supplier = await tx.supplier.create({
			data: {
				name: d.supplierName,
				slug,
				publicIdentifier: supplierPublicIdentifier,
				category: d.supplierCategory || null,
				website: d.supplierWebsite || null,
				contactEmail: d.email.toLowerCase(),
				contactPhone: d.phone || null,
				status: "PENDING",
			},
		});

		const created = await tx.user.create({
			data: {
				email: d.email.toLowerCase(),
				publicIdentifier: userPublicIdentifier,
				passwordHash: await hashPassword(d.password),
				firstName: d.firstName,
				lastName: d.lastName,
				phone: d.phone || null,
				role: "SUPPLIER",
				status: "PENDING",
				supplierMemberships: {
					create: { supplierId: supplier.id, role: "SUPPLIER", isPrimary: true },
				},
			},
		});

		await tx.auditLog.create({
			data: { userId: created.id, action: "SUPPLIER_REGISTERED", entityType: "Supplier", entityId: supplier.id },
		});

		return created;
	});

	await createSession(user);
	await mail.welcome(user);
	redirect("/accueil");
}

export async function registerAction(_prev, formData) {
	const parsed = registerSchema.safeParse(Object.fromEntries(formData));
	if (!parsed.success) return { errors: fieldErrors(parsed.error) };
	const d = parsed.data;

	const existing = await prisma.user.findUnique({ where: { email: d.email.toLowerCase() } });
	if (existing) {
		return { errors: { email: "Un compte existe déjà avec cette adresse." } };
	}

	if (d.accountType === "supplier") return registerSupplier(d);

	const normalizedAgencyIdCategory = d.agencyIdCategory ? d.agencyIdCategory.toUpperCase() : null;
	const normalizedAgencyId = d.agencyId || null;
	const normalizedLicenseNumber = d.licenseNumber || null;
	const normalizedLicenseRegion = d.licenseNumber ? "QC" : null;

	const slug = await availableSlug(prisma.agency, d.agencyName);

	const user = await prisma.$transaction(async (tx) => {
		const agencyPublicIdentifier = await createAvailablePublicIdentifier(tx);
		const userPublicIdentifier = await createAvailablePublicIdentifier(tx);

		const agency = await tx.agency.create({
			data: {
				name: d.agencyName,
				slug,
				publicIdentifier: agencyPublicIdentifier,
				agencyIdCategory: normalizedAgencyIdCategory,
				agencyId: normalizedAgencyId,
				licenseNumber: normalizedLicenseNumber,
				licenseRegion: normalizedLicenseRegion,
				consortium: d.consortium || null,
				status: "PENDING",
			},
		});

		const created = await tx.user.create({
			data: {
				email: d.email.toLowerCase(),
				publicIdentifier: userPublicIdentifier,
				passwordHash: await hashPassword(d.password),
				firstName: d.firstName,
				lastName: d.lastName,
				phone: d.phone || null,
				role: "AGENCY_ADMIN",
				status: "PENDING",
				memberships: {
					create: { agencyId: agency.id, role: "AGENCY_ADMIN", isPrimary: true },
				},
			},
		});

		await tx.auditLog.create({
			data: { userId: created.id, action: "AGENCY_REGISTERED", entityType: "Agency", entityId: agency.id },
		});

		return created;
	});

	await createSession(user);
	await mail.welcome(user);
	redirect("/accueil");
}

export async function loginAction(_prev, formData) {
	const parsed = loginSchema.safeParse(Object.fromEntries(formData));
	if (!parsed.success) return { errors: fieldErrors(parsed.error) };

	const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
	const ok = user && (await verifyPassword(parsed.data.password, user.passwordHash));

	// Message unique : ne pas révéler quelles adresses existent.
	if (!ok) return { errors: { _: "Courriel ou mot de passe incorrect." } };
	if (user.status === "SUSPENDED") {
		return { errors: { _: "Ce compte est suspendu. Écrivez-nous pour le réactiver." } };
	}

	await prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } });
	await createSession(user);

	const next = formData.get("suivant");
	redirect(typeof next === "string" && next.startsWith("/") ? next : "/accueil");
}

export async function logoutAction() {
	destroySession();
	redirect("/login");
}
