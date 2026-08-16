/**
 * Une annonce appartient soit à une agence, soit à un fournisseur.
 * Ces helpers évitent de disperser la condition dans chaque page.
 */

export const ORG_KIND_LABELS = {
	AGENCY: "Agence",
	SUPPLIER: "Fournisseur",
};

export function isSupplierUser(user) {
	return Boolean(user?.supplierId);
}

/** Filtre Prisma des annonces détenues par l'organisation de l'utilisateur. */
export function listingOwnerWhere(user) {
	return user?.supplierId ? { ownerSupplierId: user.supplierId } : { agencyId: user?.agencyId ?? "" };
}

/** Données d'appartenance à écrire sur une nouvelle annonce. */
export function listingOwnerData(user) {
	return user?.supplierId ? { ownerSupplierId: user.supplierId, agencyId: null } : { agencyId: user?.agencyId ?? null, ownerSupplierId: null };
}

export function ownsListing(listing, user) {
	if (!listing || !user) return false;
	if (user.supplierId) return listing.ownerSupplierId === user.supplierId;
	return Boolean(user.agencyId) && listing.agencyId === user.agencyId;
}

/** Nom + lien public du vendeur, quelle que soit la nature de l'organisation. */
export function listingOwnerProfile(listing) {
	const owner = listing?.ownerSupplier ?? listing?.agency ?? null;
	if (!owner) return null;

	return {
		kind: listing.ownerSupplierId ? "SUPPLIER" : "AGENCY",
		id: owner.id,
		name: owner.name,
		status: owner.status,
		href: owner.publicIdentifier ? `/@${owner.publicIdentifier}` : `/profil-public/${owner.id}`,
	};
}
