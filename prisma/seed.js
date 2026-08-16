/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const slug = (v) =>
	v
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");

const inDays = (n) => new Date(Date.now() + n * 86_400_000);

function assertMapValue(map, key, label) {
	const value = map[key];
	if (!value) {
		throw new Error(`[seed] ${label} introuvable: "${key}"`);
	}
	return value;
}

const SUPPLIERS = [
	{ name: "Royal Caribbean", category: "Croisiériste", ships: ["Wonder of the Seas"] },
	{ name: "Holland America", category: "Croisiériste", ships: ["Koningsdam"] },
	{ name: "MSC Croisières", category: "Croisiériste", ships: ["MSC Seaview"] },
	{ name: "Norwegian", category: "Croisiériste", ships: ["Norwegian Encore"] },
	{ name: "Voyages Culturels", category: "Tour opérateur", ships: [] },
	{ name: "Sunwing", category: "Tour opérateur", ships: [] },
	{ name: "Quark Expeditions", category: "Expédition", ships: ["Ultramarine"] },
];

const AGENCIES = [
	{ name: "ÆRIA Voyages", agencyIdCategory: "IATA", agencyId: "96147796", licenseNumber: "703633", consortium: "TravelSavers", city: "Montréal" },
	{ name: "Groupe Évasion", agencyIdCategory: "IATA", agencyId: "96141550", licenseNumber: "703112", consortium: "Virtuoso", city: "Québec" },
	{ name: "Croisières Boréal", agencyIdCategory: "CLIA", agencyId: "C78211", licenseNumber: "701880", consortium: null, city: "Laval" },
	{ name: "Agence Soleil", agencyIdCategory: "TIDS", agencyId: "T55012", licenseNumber: null, consortium: null, city: "Sherbrooke" },
];

const LISTINGS = [
	{
		agency: "Voyages Horizon",
		supplier: "Royal Caribbean",
		ship: "Wonder of the Seas",
		title: "Caraïbes de l'Est — groupe Horizon",
		travelType: "CRUISE",
		destination: "Caraïbes",
		departureCity: "Montréal",
		departIn: 280,
		nights: 7,
		language: "fr",
		inventoryType: "CABINS",
		inventoryLeft: 4,
		inventoryTotal: 16,
		cabinCategory: "Balcon",
		price: 1249,
		releaseIn: 41,
		guaranteed: false,
		soloAvailable: false,
		groupBenefits: "Crédit à bord de 100 $ par cabine, cocktail privé, forfait boissons au tarif groupe.",
		conditions: "Dépôt de 250 $ par personne. Paiement final 75 jours avant le départ.",
		commissionSplit: "Ouvert à discuter",
		externalId: "GRP-2027-004",
	},
	{
		agency: "Groupe Évasion",
		supplier: "Voyages Culturels",
		ship: null,
		title: "Japon au printemps — départ francophone",
		travelType: "ESCORTED_TOUR",
		destination: "Japon",
		departureCity: "Montréal",
		departIn: 610,
		nights: 13,
		language: "fr",
		inventoryType: "SEATS",
		inventoryLeft: 6,
		inventoryTotal: 30,
		cabinCategory: "Occupation double",
		price: 5995,
		releaseIn: 18,
		guaranteed: true,
		soloAvailable: false,
		groupBenefits: "Accompagnateur francophone au départ de Montréal, 7 excursions incluses, transferts inclus.",
		conditions: "Dépôt de 500 $. Départ confirmé à 20 participants.",
		commissionSplit: "50 / 50 sur la commission fournisseur",
		externalId: "GE-JPN-2028",
	},
	{
		agency: "Voyages Horizon",
		supplier: "Holland America",
		ship: "Koningsdam",
		title: "Alaska sauvage — dernières cabines",
		travelType: "CRUISE",
		destination: "Alaska",
		departureCity: "Vancouver",
		departIn: 320,
		nights: 7,
		language: "en",
		inventoryType: "CABINS",
		inventoryLeft: 2,
		inventoryTotal: 12,
		cabinCategory: "Balcon",
		price: 2299,
		releaseIn: 12,
		guaranteed: true,
		soloAvailable: false,
		groupBenefits: "Tarif de groupe, crédit à bord de 50 $ US, transfert aéroport-port inclus.",
		conditions: "Cabines relâchées automatiquement à la date indiquée. Aucune extension.",
		commissionSplit: "Ouvert à discuter",
		externalId: "GRP-2027-014",
	},
	{
		agency: "Croisières Boréal",
		supplier: "MSC Croisières",
		ship: "MSC Seaview",
		title: "Méditerranée en français",
		travelType: "CRUISE",
		destination: "Méditerranée",
		departureCity: "Montréal",
		departIn: 420,
		nights: 10,
		language: "fr",
		inventoryType: "CABINS",
		inventoryLeft: 3,
		inventoryTotal: 20,
		cabinCategory: "Vue mer",
		price: 2149,
		releaseIn: 62,
		guaranteed: false,
		soloAvailable: false,
		groupBenefits: "Animation francophone à bord, forfait boissons Easy inclus.",
		conditions: "Dépôt de 300 $ par cabine. Noms requis 90 jours avant le départ.",
		commissionSplit: "Ouvert à discuter",
		visibility: "MEMBERS_ONLY",
		externalId: "CB-MED-27",
	},
	{
		agency: "Agence Soleil",
		supplier: "Sunwing",
		ship: null,
		title: "Riviera Maya — chambres solo sans supplément",
		travelType: "PACKAGE",
		destination: "Mexique",
		departureCity: "Montréal",
		departIn: 240,
		nights: 7,
		language: "fr",
		inventoryType: "SEATS",
		inventoryLeft: 3,
		inventoryTotal: 24,
		cabinCategory: "Chambre solo",
		price: 1099,
		releaseIn: 33,
		guaranteed: false,
		soloAvailable: true,
		groupBenefits: "Supplément simple éliminé sur 3 chambres, transferts privés.",
		conditions: "Réservation ferme. Paiement final 45 jours avant le départ.",
		commissionSplit: "Aucun partage",
		externalId: null,
	},
	{
		agency: "Groupe Évasion",
		supplier: "Voyages Culturels",
		ship: null,
		title: "Islande et aurores boréales",
		travelType: "ESCORTED_TOUR",
		destination: "Islande",
		departureCity: "Montréal",
		departIn: 200,
		nights: 8,
		language: "fr",
		inventoryType: "SEATS",
		inventoryLeft: 5,
		inventoryTotal: 26,
		cabinCategory: "Occupation double",
		price: 3749,
		releaseIn: 27,
		guaranteed: true,
		soloAvailable: true,
		groupBenefits: "Guide francophone, deux sorties aurores, lagon bleu inclus.",
		conditions: "Départ confirmé à 24 participants. Dépôt de 400 $.",
		commissionSplit: "60 / 40 en faveur de l'agence acheteuse",
		externalId: "GE-ISL-27",
	},
	{
		agency: "Croisières Boréal",
		supplier: "Quark Expeditions",
		ship: "Ultramarine",
		title: "Antarctique — deux suites disponibles",
		travelType: "CRUISE",
		destination: "Antarctique",
		departureCity: "Buenos Aires",
		departIn: 470,
		nights: 12,
		language: "en",
		inventoryType: "CABINS",
		inventoryLeft: 2,
		inventoryTotal: 8,
		cabinCategory: "Suite balcon",
		price: 18900,
		releaseIn: 9,
		guaranteed: true,
		soloAvailable: false,
		groupBenefits: "Parka offerte, sortie en kayak incluse, crédit de 500 $ US par suite.",
		conditions: "Vol Ushuaia inclus. Non remboursable après confirmation.",
		commissionSplit: "Ouvert à discuter",
		priceHidden: true,
		externalId: "CB-ANT-27",
	},
	{
		agency: "Agence Soleil",
		supplier: "Norwegian",
		ship: "Norwegian Encore",
		title: "Noël dans les Caraïbes",
		travelType: "CRUISE",
		destination: "Caraïbes",
		departureCity: "Montréal",
		departIn: 500,
		nights: 7,
		language: "fr",
		inventoryType: "CABINS",
		inventoryLeft: 3,
		inventoryTotal: 14,
		cabinCategory: "Intérieure",
		price: 1789,
		releaseIn: 55,
		guaranteed: false,
		soloAvailable: false,
		groupBenefits: "Souper des fêtes réservé au groupe, forfait boissons, wifi inclus.",
		conditions: "Dépôt de 250 $ par cabine. Période de pointe, aucune modification.",
		commissionSplit: "Ouvert à discuter",
		externalId: null,
	},
];

async function main() {
	console.log("Nettoyage…");
	await prisma.$transaction([
		prisma.auditLog.deleteMany(),
		prisma.notification.deleteMany(),
		prisma.listingView.deleteMany(),
		prisma.searchEvent.deleteMany(),
		prisma.interestRequest.deleteMany(),
		prisma.savedSearch.deleteMany(),
		prisma.listingImage.deleteMany(),
		prisma.importRow.deleteMany(),
		prisma.listing.deleteMany(),
		prisma.importBatch.deleteMany(),
		prisma.featuredPlacement.deleteMany(),
		prisma.subscription.deleteMany(),
		prisma.emailCampaign.deleteMany(),
		prisma.bDMProfile.deleteMany(),
		prisma.supplierMember.deleteMany(),
		prisma.ship.deleteMany(),
		prisma.supplier.deleteMany(),
		prisma.agencyMember.deleteMany(),
		prisma.user.deleteMany(),
		prisma.agency.deleteMany(),
	]);

	console.log("Fournisseurs…");
	const supplierMap = {};
	const shipMap = {};
	for (const s of SUPPLIERS) {
		const supplier = await prisma.supplier.create({
			data: { name: s.name, slug: slug(s.name), category: s.category },
		});
		supplierMap[s.name] = supplier.id;
		for (const shipName of s.ships) {
			const ship = await prisma.ship.create({ data: { supplierId: supplier.id, name: shipName } });
			shipMap[shipName] = ship.id;
		}
	}

	console.log("Agences et conseillers…");
	const password = await bcrypt.hash("lastcall2026", 12);
	const agencyMap = {};
	const userMap = {};
	let platformAdminEmail = "";

	for (const [i, a] of AGENCIES.entries()) {
		const agency = await prisma.agency.create({
			data: {
				name: a.name,
				slug: slug(a.name),
				agencyIdCategory: a.agencyIdCategory,
				agencyId: a.agencyId,
				licenseNumber: a.licenseNumber,
				licenseRegion: a.licenseNumber ? "QC" : null,
				consortium: a.consortium,
				city: a.city,
				province: "QC",
				// La dernière agence reste en attente : utile pour voir l'écran de vérification.
				status: i < 3 ? "VERIFIED" : "PENDING",
				verifiedAt: i < 3 ? new Date() : null,
			},
		});
		agencyMap[a.name] = agency.id;
		if (a.name === "ÆRIA Voyages") {
			agencyMap["Voyages Horizon"] = agency.id;
		}

		const email = ["yvan", "marie", "simon", "julie"][i] + "@exemple.ca";
		const user = await prisma.user.create({
			data: {
				email,
				passwordHash: password,
				firstName: ["Yvan", "Marie", "Simon", "Julie"][i],
				lastName: ["Blanchette", "Lapointe", "Gagnon", "Bouchard"][i],
				phone: "514-555-0" + (100 + i),
				role: i === 0 ? "PLATFORM_ADMIN" : "AGENCY_ADMIN",
				status: i < 3 ? "VERIFIED" : "PENDING",
				memberships: { create: { agencyId: agency.id, role: "AGENCY_ADMIN", isPrimary: true } },
			},
		});
		if (i === 0) {
			platformAdminEmail = email;
		}
		userMap[a.name] = user.id;
		if (a.name === "ÆRIA Voyages") {
			userMap["Voyages Horizon"] = user.id;
		}
	}

	console.log("Annonces…");
	const listingIds = [];
	for (const l of LISTINGS) {
		const departureDate = inDays(l.departIn);
		const agencyId = assertMapValue(agencyMap, l.agency, "Agence");
		const authorId = assertMapValue(userMap, l.agency, "Utilisateur (auteur) pour l'agence");
		const supplierId = assertMapValue(supplierMap, l.supplier, "Fournisseur");
		const shipId = l.ship ? assertMapValue(shipMap, l.ship, "Navire") : null;
		const created = await prisma.listing.create({
			data: {
				externalId: l.externalId,
				agencyId,
				authorId,
				supplierId,
				shipId,
				title: l.title,
				travelType: l.travelType,
				destination: l.destination,
				departureCity: l.departureCity,
				departureDate,
				returnDate: new Date(departureDate.getTime() + l.nights * 86_400_000),
				nights: l.nights,
				language: l.language,
				inventoryType: l.inventoryType,
				inventoryTotal: l.inventoryTotal,
				inventoryLeft: l.inventoryLeft,
				cabinCategory: l.cabinCategory,
				soloAvailable: l.soloAvailable,
				guaranteed: l.guaranteed,
				price: l.price,
				currency: "CAD",
				priceHidden: Boolean(l.priceHidden),
				releaseDate: inDays(l.releaseIn),
				expiresAt: inDays(l.releaseIn),
				groupBenefits: l.groupBenefits,
				conditions: l.conditions,
				commissionSplit: l.commissionSplit,
				visibility: l.visibility ?? "B2B_ONLY",
				status: "ACTIVE",
				publishedAt: inDays(-Math.floor(Math.random() * 10)),
				score: Math.round((100 - l.releaseIn) * 100) / 100,
				scoredAt: new Date(),
			},
		});
		listingIds.push(created.id);
	}

	console.log("Compte fournisseur…");
	const demoSupplierId = supplierMap["Royal Caribbean"];
	await prisma.supplier.update({
		where: { id: demoSupplierId },
		data: { status: "VERIFIED", verifiedAt: new Date(), contactEmail: "fournisseur@exemple.ca", city: "Miami", province: "FL", country: "US" },
	});
	const supplierUser = await prisma.user.create({
		data: {
			email: "fournisseur@exemple.ca",
			passwordHash: password,
			firstName: "Karine",
			lastName: "Tremblay",
			phone: "514-555-0200",
			role: "SUPPLIER",
			status: "VERIFIED",
			supplierMemberships: { create: { supplierId: demoSupplierId, role: "SUPPLIER", isPrimary: true } },
		},
	});

	await prisma.listing.create({
		data: {
			ownerSupplierId: demoSupplierId,
			authorId: supplierUser.id,
			supplierId: demoSupplierId,
			shipId: shipMap["Wonder of the Seas"],
			title: "Wonder of the Seas — cabines restantes du 12 mars",
			travelType: "CRUISE",
			destination: "Caraïbes",
			departureCity: "Miami",
			departureDate: inDays(210),
			returnDate: inDays(217),
			nights: 7,
			language: "bilingue",
			inventoryType: "CABINS",
			inventoryTotal: 40,
			inventoryLeft: 9,
			cabinCategory: "Balcon",
			price: 1099,
			currency: "CAD",
			releaseDate: inDays(35),
			expiresAt: inDays(35),
			groupBenefits: "Tarif fournisseur direct, crédit à bord de 75 $ US par cabine.",
			conditions: "Allocation libérée automatiquement à la date de relâche.",
			visibility: "B2B_ONLY",
			status: "ACTIVE",
			publishedAt: new Date(),
			score: 70,
			scoredAt: new Date(),
		},
	});

	console.log("Recherches sauvegardées et demandes…");
	await prisma.savedSearch.createMany({
		data: [
			{
				userId: userMap["Agence Soleil"],
				name: "Japon francophone",
				destination: "Japon",
				language: "fr",
				departureCity: "Montréal",
				priceMax: 7000,
				alertsEnabled: true,
				matchCount: 1,
			},
			{
				userId: userMap["Croisières Boréal"],
				name: "Alaska balcon",
				destination: "Alaska",
				travelType: "CRUISE",
				alertsEnabled: true,
				matchCount: 1,
			},
			{
				userId: userMap["Groupe Évasion"],
				name: "Cabines solo",
				soloOnly: true,
				alertsEnabled: false,
			},
		],
	});

	await prisma.interestRequest.create({
		data: {
			listingId: listingIds[1],
			buyerUserId: userMap["Croisières Boréal"],
			sellerUserId: userMap["Groupe Évasion"],
			buyerAgencyId: agencyMap["Croisières Boréal"],
			numberOfTravelers: 2,
			message: "J'ai un couple de Laval prêt à déposer cette semaine. Les deux places sont-elles toujours en occupation double ?",
			status: "NEW",
		},
	});

	await prisma.interestRequest.create({
		data: {
			listingId: listingIds[2],
			buyerUserId: userMap["Groupe Évasion"],
			sellerUserId: userMap["Voyages Horizon"],
			buyerAgencyId: agencyMap["Groupe Évasion"],
			numberOfTravelers: 4,
			message: "Deux couples cherchent exactement ce départ. Quelle est votre entente de partage ?",
			status: "CONNECTED",
			respondedAt: new Date(),
			connectedAt: new Date(),
		},
	});

	// Recherches infructueuses : alimentent le tableau « demande non satisfaite ».
	await prisma.searchEvent.createMany({
		data: [
			{ userId: userMap["Agence Soleil"], query: "Japon francophone printemps", resultCount: 0 },
			{ userId: userMap["Croisières Boréal"], query: "Japon francophone printemps", resultCount: 0 },
			{ userId: userMap["Groupe Évasion"], query: "croisière accompagnée Noël", resultCount: 0 },
			{ userId: userMap["Agence Soleil"], query: "Antarctique départ canadien", resultCount: 0 },
			{ userId: userMap["Voyages Horizon"], query: "Alaska", resultCount: 1 },
		],
	});

	console.log("\nTerminé.");
	console.log("Comptes de démonstration (mot de passe : lastcall2026)");
	console.log("  yvan@exemple.ca   — Voyages Horizon, vérifiée");
	console.log("  marie@exemple.ca  — Groupe Évasion, vérifiée");
	console.log("  simon@exemple.ca  — Croisières Boréal, vérifiée");
	console.log("  julie@exemple.ca  — Agence Soleil, EN ATTENTE de vérification");
	console.log("  fournisseur@exemple.ca — compte fournisseur (Royal Caribbean), vérifié");
	console.log(`  ${platformAdminEmail} — administrateur plateforme (fusionné avec AGENCY_ADMIN de ÆRIA Voyages)`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
