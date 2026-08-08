import { prisma } from "@/lib/prisma";

/**
 * Trouve les recherches sauvegardées qui correspondent à une annonce.
 *
 * Le filtrage se fait en base sur les critères indexables, puis en mémoire
 * sur le prix (Decimal) et les booléens. Un critère nul dans la recherche
 * sauvegardée signifie « peu importe » — d'où les OR avec null.
 */
export async function findMatchingSavedSearches(listing) {
  const candidates = await prisma.savedSearch.findMany({
    where: {
      alertsEnabled: true,
      AND: [
        { OR: [{ destination: null }, { destination: { contains: listing.destination, mode: "insensitive" } }] },
        { OR: [{ travelType: null }, { travelType: listing.travelType }] },
        { OR: [{ language: null }, { language: listing.language }, { language: "bilingue" }] },
        { OR: [{ departureCity: null }, { departureCity: { contains: listing.departureCity, mode: "insensitive" } }] },
        { OR: [{ supplierId: null }, { supplierId: listing.supplierId ?? undefined }] },
        { OR: [{ dateFrom: null }, { dateFrom: { lte: listing.departureDate } }] },
        { OR: [{ dateTo: null }, { dateTo: { gte: listing.departureDate } }] },
      ],
    },
    include: { user: { select: { id: true, email: true, firstName: true, status: true } } },
  });

  return candidates.filter((s) => {
    if (s.soloOnly && !listing.soloAvailable) return false;
    if (s.guaranteedOnly && !listing.guaranteed) return false;
    if (s.priceMax && Number(listing.price) > Number(s.priceMax)) return false;
    // On n'alerte pas quelqu'un sur une annonce qu'il ne pourra pas ouvrir.
    if (listing.visibility === "B2B_ONLY" && s.user.status !== "VERIFIED") return false;
    return true;
  });
}

/** Construit le WHERE Prisma du marketplace à partir des paramètres d'URL. */
export function buildListingWhere(params, visibilityScope) {
  const where = {
    status: "ACTIVE",
    visibility: { in: visibilityScope },
    releaseDate: { gte: new Date() },
  };
  const and = [];

  if (params.q) {
    and.push({
      OR: [
        { title: { contains: params.q, mode: "insensitive" } },
        { destination: { contains: params.q, mode: "insensitive" } },
        { departureCity: { contains: params.q, mode: "insensitive" } },
        { supplier: { is: { name: { contains: params.q, mode: "insensitive" } } } },
        { ship: { is: { name: { contains: params.q, mode: "insensitive" } } } },
      ],
    });
  }
  if (params.type) and.push({ travelType: params.type });
  if (params.ville) and.push({ departureCity: { contains: params.ville, mode: "insensitive" } });
  if (params.langue) and.push({ language: params.langue });
  if (params.fournisseur) and.push({ supplierId: params.fournisseur });
  if (params.solo === "1") and.push({ soloAvailable: true });
  if (params.garanti === "1") and.push({ guaranteed: true });
  if (params.prixMax) and.push({ price: { lte: Number(params.prixMax) } });
  if (params.departA) and.push({ departureDate: { gte: new Date(params.departA) } });
  if (params.departB) and.push({ departureDate: { lte: new Date(params.departB) } });
  if (params.release) {
    const limit = new Date();
    limit.setDate(limit.getDate() + Number(params.release));
    and.push({ releaseDate: { lte: limit } });
  }

  if (and.length) where.AND = and;
  return where;
}

export function buildOrderBy(sort) {
  switch (sort) {
    case "release": return [{ releaseDate: "asc" }];
    case "prix": return [{ price: "asc" }];
    case "depart": return [{ departureDate: "asc" }];
    case "recent": return [{ publishedAt: "desc" }];
    default: return [{ score: "desc" }, { releaseDate: "asc" }];
  }
}
