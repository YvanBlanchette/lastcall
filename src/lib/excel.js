import * as XLSX from "xlsx";
import { listingSchema, TRAVEL_TYPES, INVENTORY_TYPES, VISIBILITIES } from "@/lib/validators";

/**
 * Colonnes du modèle officiel LastCall (section 13 du brief).
 * L'ordre fait foi pour le fichier généré ; la lecture, elle, se fait par nom.
 */
export const TEMPLATE_COLUMNS = [
  "external_id", "supplier", "travel_type", "title", "destination",
  "departure_city", "departure_date", "return_date", "language", "ship",
  "inventory_type", "inventory_available", "cabin_category", "price",
  "currency", "release_date", "group_benefits", "commission_split",
  "visibility", "notes", "image_url", "booking_reference_internal",
];

const TRAVEL_ALIASES = {
  croisiere: "CRUISE", croisière: "CRUISE", cruise: "CRUISE",
  circuit: "ESCORTED_TOUR", "circuit accompagne": "ESCORTED_TOUR",
  "circuit accompagné": "ESCORTED_TOUR", tour: "ESCORTED_TOUR",
  sejour: "PACKAGE", séjour: "PACKAGE", forfait: "PACKAGE", package: "PACKAGE",
  autre: "OTHER", other: "OTHER",
};

const INVENTORY_ALIASES = {
  cabine: "CABINS", cabines: "CABINS", cabin: "CABINS", cabins: "CABINS",
  place: "SEATS", places: "SEATS", siege: "SEATS", sièges: "SEATS", seats: "SEATS",
};

const VISIBILITY_ALIASES = {
  b2b: "B2B_ONLY", "b2b uniquement": "B2B_ONLY", prive: "B2B_ONLY", privé: "B2B_ONLY",
  membres: "MEMBERS_ONLY", "membres connectes": "MEMBERS_ONLY", "membres connectés": "MEMBERS_ONLY",
  public: "PUBLIC",
};

const LANG_ALIASES = {
  fr: "fr", francais: "fr", français: "fr", french: "fr",
  en: "en", anglais: "en", english: "en",
  bilingue: "bilingue", bilingual: "bilingue",
};

function norm(v) {
  return String(v ?? "").trim().toLowerCase();
}

/** Excel stocke les dates en série numérique ; on accepte aussi ISO et JJ/MM/AAAA. */
function parseDate(value) {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    const d = XLSX.SSF.parse_date_code(value);
    if (!d) return null;
    return new Date(Date.UTC(d.y, d.m - 1, d.d));
  }
  const s = String(value).trim();
  const fr = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (fr) return new Date(Date.UTC(Number(fr[3]), Number(fr[2]) - 1, Number(fr[1])));
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseMoney(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  const cleaned = String(value).replace(/[^\d.,-]/g, "").replace(/\s/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : n;
}

function parseBool(value) {
  const s = norm(value);
  return ["oui", "yes", "true", "1", "x", "vrai"].includes(s);
}

/**
 * Lit un classeur et retourne des lignes normalisées avec des erreurs
 * rédigées pour un conseiller, pas pour un développeur.
 */
export function parseWorkbook(buffer, { suppliers = [] } = {}) {
  const wb = XLSX.read(buffer, { cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) {
    return { rows: [], fatal: "Le fichier ne contient aucune feuille lisible." };
  }

  const raw = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false, dateNF: "yyyy-mm-dd" });
  if (!raw.length) {
    return { rows: [], fatal: "Le fichier est vide. Utilisez le modèle LastCall comme point de départ." };
  }

  const supplierByName = new Map(suppliers.map((s) => [norm(s.name), s.id]));

  const rows = raw.map((r, i) => {
    const rowNumber = i + 2; // ligne 1 = en-têtes
    const errors = [];

    const get = (key) => {
      const found = Object.keys(r).find((k) => norm(k) === key);
      return found ? r[found] : "";
    };

    const supplierName = String(get("supplier") ?? "").trim();
    const supplierId = supplierByName.get(norm(supplierName)) ?? null;
    if (supplierName && !supplierId) {
      errors.push(`Le fournisseur « ${supplierName} » n'existe pas encore sur LastCall. Il sera créé à l'import.`);
    }

    const travelType = TRAVEL_ALIASES[norm(get("travel_type"))] ?? null;
    if (!travelType) errors.push("Le type de voyage doit être : croisière, circuit, séjour ou autre.");

    const inventoryType = INVENTORY_ALIASES[norm(get("inventory_type"))] ?? null;
    if (!inventoryType) errors.push("Le type d'inventaire doit être « cabines » ou « places ».");

    const departureDate = parseDate(get("departure_date"));
    if (!departureDate) errors.push("La date de départ est manquante ou illisible (format attendu : AAAA-MM-JJ).");

    const releaseDate = parseDate(get("release_date"));
    if (!releaseDate) errors.push("La date de relâche est manquante.");

    const price = parseMoney(get("price"));
    if (price === null) errors.push("Le prix par personne est manquant.");

    const inventoryLeft = Number(get("inventory_available"));
    if (!inventoryLeft || inventoryLeft < 1) errors.push("Indiquez au moins 1 place ou cabine disponible.");

    if (departureDate && releaseDate && releaseDate > departureDate) {
      errors.push("La date de relâche est postérieure au départ.");
    }

    const parsed = {
      externalId: String(get("external_id") ?? "").trim() || null,
      supplierName: supplierName || null,
      supplierId,
      travelType,
      title: String(get("title") ?? "").trim(),
      destination: String(get("destination") ?? "").trim(),
      departureCity: String(get("departure_city") ?? "").trim(),
      departureDate,
      returnDate: parseDate(get("return_date")),
      language: LANG_ALIASES[norm(get("language"))] ?? "fr",
      shipName: String(get("ship") ?? "").trim() || null,
      inventoryType,
      inventoryLeft: inventoryLeft || 0,
      cabinCategory: String(get("cabin_category") ?? "").trim() || null,
      price,
      currency: (String(get("currency") ?? "CAD").trim().toUpperCase()) || "CAD",
      releaseDate,
      groupBenefits: String(get("group_benefits") ?? "").trim() || null,
      commissionSplit: String(get("commission_split") ?? "").trim() || null,
      visibility: VISIBILITY_ALIASES[norm(get("visibility"))] ?? "B2B_ONLY",
      notes: String(get("notes") ?? "").trim() || null,
      imageUrl: String(get("image_url") ?? "").trim() || null,
      soloAvailable: parseBool(get("solo")),
      guaranteed: parseBool(get("guaranteed")),
    };

    if (!parsed.title) errors.push("Le titre du groupe est manquant.");
    if (!parsed.destination) errors.push("La destination est manquante.");
    if (!parsed.departureCity) errors.push("La ville de départ est manquante.");

    // Erreurs bloquantes seulement : un fournisseur inconnu n'empêche pas la publication.
    const blocking = errors.filter((e) => !e.includes("sera créé à l'import"));

    return { rowNumber, raw: r, parsed, errors, ok: blocking.length === 0 };
  });

  return { rows, fatal: null };
}

/** Génère le modèle Excel officiel, avec une ligne d'exemple. */
export function buildTemplate() {
  const example = {
    external_id: "GRP-2027-014",
    supplier: "Holland America",
    travel_type: "croisière",
    title: "Alaska sauvage — groupe Voyages Horizon",
    destination: "Alaska",
    departure_city: "Vancouver",
    departure_date: "2027-06-18",
    return_date: "2027-06-25",
    language: "français",
    ship: "Koningsdam",
    inventory_type: "cabines",
    inventory_available: 4,
    cabin_category: "Balcon",
    price: 2299,
    currency: "CAD",
    release_date: "2027-03-15",
    group_benefits: "Crédit à bord 50 $ US, transfert inclus",
    commission_split: "Ouvert à discuter",
    visibility: "b2b",
    notes: "Cabines relâchées automatiquement",
    image_url: "",
    booking_reference_internal: "HAL-88213",
  };

  const ws = XLSX.utils.json_to_sheet([example], { header: TEMPLATE_COLUMNS });
  ws["!cols"] = TEMPLATE_COLUMNS.map((c) => ({ wch: Math.max(14, c.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inventaire");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}
