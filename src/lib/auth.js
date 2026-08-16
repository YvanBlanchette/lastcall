import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const COOKIE = "lastcall_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

function secret() {
	const s = process.env.AUTH_SECRET;
	if (!s) throw new Error("AUTH_SECRET manquant. Copiez .env.example vers .env.");
	return new TextEncoder().encode(s);
}

async function createAvailablePublicIdentifier() {
	for (let i = 0; i < 5; i += 1) {
		const candidate = randomUUID();
		const [userTaken, agencyTaken, supplierTaken] = await Promise.all([
			prisma.user.findUnique({ where: { publicIdentifier: candidate }, select: { id: true } }),
			prisma.agency.findUnique({ where: { publicIdentifier: candidate }, select: { id: true } }),
			prisma.supplier.findUnique({ where: { publicIdentifier: candidate }, select: { id: true } }),
		]);
		if (!userTaken && !agencyTaken && !supplierTaken) return candidate;
	}

	return randomUUID();
}

export async function hashPassword(plain) {
	return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain, hash) {
	if (!hash) return false;
	return bcrypt.compare(plain, hash);
}

export async function createSession(user) {
	const token = await new SignJWT({
		sub: user.id,
		email: user.email,
		role: user.role,
	})
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(`${MAX_AGE}s`)
		.sign(secret());

	cookies().set(COOKIE, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: MAX_AGE,
	});
}

export function destroySession() {
	cookies().delete(COOKIE);
}

/** Décode le jeton. Compatible runtime edge (middleware). */
export async function readToken(token) {
	if (!token) return null;
	try {
		const { payload } = await jwtVerify(token, secret());
		return payload;
	} catch {
		return null;
	}
}

/** Session légère (jeton seulement) — pas d'appel base de données. */
export async function getSession() {
	return readToken(cookies().get(COOKIE)?.value);
}

/**
 * Utilisateur complet + agence active.
 * À utiliser dans les pages et server actions qui écrivent des données.
 */
export async function getCurrentUser() {
	const session = await getSession();
	if (!session?.sub) return null;

	const user = await prisma.user.findUnique({
		where: { id: session.sub },
		include: {
			memberships: { include: { agency: true }, orderBy: { isPrimary: "desc" } },
			supplierMemberships: { include: { supplier: true }, orderBy: { isPrimary: "desc" } },
		},
	});
	if (!user) return null;

	const membership = user.memberships[0] ?? null;
	const supplierMembership = user.supplierMemberships[0] ?? null;
	const needsUserIdentifier = !user.publicIdentifier;
	const needsAgencyIdentifier = !membership?.agency?.publicIdentifier;
	const needsSupplierIdentifier = !supplierMembership?.supplier?.publicIdentifier;

	if (needsUserIdentifier || (membership?.agencyId && needsAgencyIdentifier) || (supplierMembership?.supplierId && needsSupplierIdentifier)) {
		const updates = [];
		if (needsUserIdentifier) {
			const nextUserIdentifier = await createAvailablePublicIdentifier();
			updates.push(
				prisma.user.update({
					where: { id: user.id },
					data: { publicIdentifier: nextUserIdentifier },
				}),
			);
			user.publicIdentifier = nextUserIdentifier;
		}

		if (membership?.agencyId && needsAgencyIdentifier) {
			const nextAgencyIdentifier = await createAvailablePublicIdentifier();
			updates.push(
				prisma.agency.update({
					where: { id: membership.agencyId },
					data: { publicIdentifier: nextAgencyIdentifier },
				}),
			);
			if (membership.agency) membership.agency.publicIdentifier = nextAgencyIdentifier;
		}

		if (supplierMembership?.supplierId && needsSupplierIdentifier) {
			const nextSupplierIdentifier = await createAvailablePublicIdentifier();
			updates.push(
				prisma.supplier.update({
					where: { id: supplierMembership.supplierId },
					data: { publicIdentifier: nextSupplierIdentifier },
				}),
			);
			if (supplierMembership.supplier) supplierMembership.supplier.publicIdentifier = nextSupplierIdentifier;
		}

		if (updates.length) await prisma.$transaction(updates);
	}

	const supplier = supplierMembership?.supplier ?? null;
	const agency = membership?.agency ?? null;

	return {
		...user,
		agency,
		agencyId: membership?.agencyId ?? null,
		agencyRole: membership?.role ?? user.role,
		supplier,
		supplierId: supplierMembership?.supplierId ?? null,
		isSupplierAccount: Boolean(supplierMembership),
		org: supplier
			? { kind: "SUPPLIER", id: supplier.id, name: supplier.name, publicIdentifier: supplier.publicIdentifier, status: supplier.status }
			: agency
				? { kind: "AGENCY", id: agency.id, name: agency.name, publicIdentifier: agency.publicIdentifier, status: agency.status }
				: null,
	};
}

export async function requireUser() {
	const user = await getCurrentUser();
	if (!user) redirect("/login");
	return user;
}

export async function requireAgency() {
	const user = await requireUser();
	if (user.supplierId) redirect("/mes-annonces");
	if (!user.agencyId) redirect("/profil?setup=agency");
	return user;
}

/** Agence ou fournisseur : tout compte rattaché à une organisation vendeuse. */
export async function requireOrg() {
	const user = await requireUser();
	if (!user.agencyId && !user.supplierId) redirect("/profil?setup=agency");
	return user;
}

export async function requireSupplier() {
	const user = await requireUser();
	if (!user.supplierId) redirect("/accueil");
	return user;
}

export async function requireAdmin() {
	const user = await requireUser();
	if (user.role !== "PLATFORM_ADMIN") redirect("/accueil");
	return user;
}

/** Un professionnel vérifié voit les tarifs et les annonces B2B_ONLY. */
export function visibilityScopeFor(user) {
	if (!user) return ["PUBLIC"];
	if (user.status === "VERIFIED") return ["PUBLIC", "MEMBERS_ONLY", "B2B_ONLY"];
	return ["PUBLIC", "MEMBERS_ONLY"];
}

export function canSeePrice(listing, user) {
	if (!listing.priceHidden) return true;
	return user?.status === "VERIFIED";
}
