import { z } from "zod";

export const TRAVEL_TYPES = ["CRUISE", "ESCORTED_TOUR", "PACKAGE", "OTHER"];
export const INVENTORY_TYPES = ["CABINS", "SEATS"];
export const VISIBILITIES = ["B2B_ONLY", "MEMBERS_ONLY", "PUBLIC"];
export const CURRENCIES = ["CAD", "USD", "EUR"];

export const TRAVEL_TYPE_LABELS = {
	CRUISE: "Croisière",
	ESCORTED_TOUR: "Circuit accompagné",
	PACKAGE: "Séjour / forfait",
	OTHER: "Autre",
};

export const VISIBILITY_LABELS = {
	B2B_ONLY: "Professionnels vérifiés",
	MEMBERS_ONLY: "Membres connectés",
	PUBLIC: "Public",
};

export const STATUS_LABELS = {
	DRAFT: "Brouillon",
	ACTIVE: "Active",
	PAUSED: "En pause",
	SOLD_OUT: "Complet",
	RELEASED: "Relâchée",
	EXPIRED: "Expirée",
	ARCHIVED: "Archivée",
};

export const REQUEST_STATUS_LABELS = {
	NEW: "Nouvelle",
	VIEWED: "Vue",
	RESPONDED: "Répondue",
	CONNECTED: "En relation",
	CLOSED: "Fermée",
	DECLINED: "Refusée",
};

/**
 * Un champ vide d'un formulaire HTML arrive comme "" et non undefined.
 * Sans cette normalisation, z.coerce.date("") produit une date invalide
 * et z.coerce.number("") produit NaN — deux faux négatifs classiques.
 */
const emptyToNull = (v) => (v === "" || v === undefined ? null : v);

const dateString = z.coerce.date({ invalid_type_error: "Cette date n'est pas valide." });
const optionalDate = z.preprocess(emptyToNull, dateString.nullable().optional());
const optionalNumber = z.preprocess(emptyToNull, z.coerce.number().positive().nullable().optional());
const optionalInt = z.preprocess(emptyToNull, z.coerce.number().int().min(1).nullable().optional());

export const listingSchema = z
	.object({
		externalId: z.string().trim().max(64).optional().or(z.literal("")),
		title: z.string().trim().min(4, "Donnez un titre d'au moins 4 caractères."),
		travelType: z.enum(TRAVEL_TYPES, { errorMap: () => ({ message: "Choisissez un type de voyage." }) }),
		supplierId: z.string().optional().or(z.literal("")),
		shipName: z.string().trim().optional().or(z.literal("")),
		destination: z.string().trim().min(2, "Indiquez la destination."),
		departureCity: z.string().trim().min(2, "Indiquez la ville de départ."),
		departureDate: dateString,
		returnDate: optionalDate,
		language: z.enum(["fr", "en", "bilingue"]).default("fr"),

		inventoryType: z.enum(INVENTORY_TYPES),
		inventoryLeft: z.coerce.number().int().min(1, "Il doit rester au moins 1 place ou cabine."),
		inventoryTotal: optionalInt,
		cabinCategory: z.string().trim().optional().or(z.literal("")),
		soloAvailable: z.coerce.boolean().default(false),
		guaranteed: z.coerce.boolean().default(false),

		price: z.coerce.number().positive("Le prix doit être supérieur à 0."),
		currency: z.enum(CURRENCIES).default("CAD"),
		priceHidden: z.coerce.boolean().default(false),

		releaseDate: dateString,
		groupBenefits: z.string().trim().max(2000).optional().or(z.literal("")),
		conditions: z.string().trim().max(2000).optional().or(z.literal("")),
		commissionSplit: z.string().trim().max(200).optional().or(z.literal("")),
		notes: z.string().trim().max(2000).optional().or(z.literal("")),
		visibility: z.enum(VISIBILITIES).default("B2B_ONLY"),
		images: z
			.array(z.object({ publicId: z.string(), url: z.string().url(), width: z.number().optional(), height: z.number().optional() }))
			.max(6)
			.optional()
			.default([]),
	})
	.refine((d) => !d.returnDate || d.returnDate >= d.departureDate, {
		path: ["returnDate"],
		message: "Le retour ne peut pas précéder le départ.",
	})
	.refine((d) => d.releaseDate <= d.departureDate, {
		path: ["releaseDate"],
		message: "La date de relâche doit précéder le départ.",
	})
	.refine((d) => !d.inventoryTotal || d.inventoryLeft <= d.inventoryTotal, {
		path: ["inventoryLeft"],
		message: "Le restant ne peut pas dépasser l'inventaire total.",
	});

export const interestRequestSchema = z.object({
	listingId: z.string().min(1),
	numberOfTravelers: z.coerce.number().int().min(1).max(200),
	message: z.string().trim().max(1500).optional().or(z.literal("")),
});

export const savedSearchSchema = z.object({
	name: z.string().trim().min(2, "Donnez un nom à cette recherche."),
	destination: z.string().trim().optional().or(z.literal("")),
	travelType: z.enum(TRAVEL_TYPES).optional().or(z.literal("")),
	language: z.string().optional().or(z.literal("")),
	departureCity: z.string().trim().optional().or(z.literal("")),
	supplierId: z.string().optional().or(z.literal("")),
	dateFrom: optionalDate,
	dateTo: optionalDate,
	priceMax: optionalNumber,
	soloOnly: z.coerce.boolean().default(false),
	guaranteedOnly: z.coerce.boolean().default(false),
	alertsEnabled: z.coerce.boolean().default(true),
});

export const registerSchema = z.object({
	firstName: z.string().trim().min(2, "Indiquez votre prénom."),
	lastName: z.string().trim().min(2, "Indiquez votre nom."),
	email: z.string().trim().email("Cette adresse courriel n'est pas valide."),
	phone: z.string().trim().optional().or(z.literal("")),
	password: z.string().min(10, "Le mot de passe doit contenir au moins 10 caractères."),
	agencyName: z.string().trim().min(2, "Indiquez le nom de votre agence."),
	agencyIdCategory: z.enum(["iata", "clia", "tids"]).optional().or(z.literal("")),
	agencyId: z.string().trim().min(1, "Le numéro IATA est requis."),
	licenseNumber: z.string().trim().optional().or(z.literal("")),
	consortium: z.string().trim().optional().or(z.literal("")),
});

export const loginSchema = z.object({
	email: z.string().trim().email("Cette adresse courriel n'est pas valide."),
	password: z.string().min(1, "Entrez votre mot de passe."),
});

/** Transforme une ZodError en objet { champ: message } consommable par un formulaire. */
export function fieldErrors(error) {
	const out = {};
	for (const issue of error.issues) {
		const key = issue.path[0] ?? "_";
		if (!out[key]) out[key] = issue.message;
	}
	return out;
}
