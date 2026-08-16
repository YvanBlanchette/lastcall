import { daysUntil } from "@/lib/utils";

/**
 * Score de priorisation d'une annonce.
 * Utilisé pour l'ordre du marketplace, l'infolettre et les mises en vedette.
 *
 * Le poids dominant est l'urgence : une annonce dont la relâche approche a
 * plus de valeur pour tout le monde qu'une annonce parfaite à 8 mois d'avis.
 */
export function computeScore(listing, { matchingSavedSearches = 0 } = {}) {
	let score = 0;

	// Urgence — jusqu'à 40 points
	const days = daysUntil(listing.releaseDate);
	if (days !== null) {
		if (days <= 0) score += 0;
		else if (days <= 7) score += 40;
		else if (days <= 14) score += 32;
		else if (days <= 30) score += 24;
		else if (days <= 60) score += 12;
		else score += 4;
	}

	// Fraîcheur — jusqu'à 20 points
	const ageDays = (Date.now() - new Date(listing.publishedAt ?? listing.createdAt).getTime()) / 86_400_000;
	if (ageDays <= 2) score += 20;
	else if (ageDays <= 7) score += 12;
	else if (ageDays <= 21) score += 6;

	// Rareté — jusqu'à 12 points
	if (listing.inventoryLeft <= 2) score += 12;
	else if (listing.inventoryLeft <= 5) score += 7;
	else score += 3;

	// Demande latente déjà exprimée par le réseau — jusqu'à 20 points
	score += Math.min(matchingSavedSearches * 4, 20);

	// Qualité et confiance
	if (listing.guaranteed) score += 6;
	if (listing.images?.length) score += 5;
	if (listing.groupBenefits) score += 3;
	if (listing.agency?.status === "VERIFIED" || listing.ownerSupplier?.status === "VERIFIED") score += 6;
	if (listing.supplierId) score += 2;

	// Engagement observé
	score += Math.min((listing.requestCount ?? 0) * 3, 12);
	score += Math.min((listing.viewCount ?? 0) * 0.2, 8);

	return Math.round(score * 100) / 100;
}
