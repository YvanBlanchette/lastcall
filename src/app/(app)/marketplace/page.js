import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser, visibilityScopeFor, canSeePrice } from "@/lib/auth";
import { buildListingWhere, buildOrderBy } from "@/lib/matching";
import { logSearchEvent } from "@/actions/saved-searches";
import { PageHeader } from "@/components/layout/page-header";
import { MarketplaceFilters } from "@/components/listings/filters";
import { SaveSearchButton } from "@/components/listings/save-search-button";
import { ListingCard } from "@/components/listings/listing-card";
import { EmptyState } from "@/components/ui/card";

export const metadata = { title: "Marketplace" };

const PER_PAGE = 24;

export default async function MarketplacePage({ searchParams }) {
  const user = await requireUser();
  const scope = visibilityScopeFor(user);
  const page = Math.max(1, Number(searchParams.page ?? 1));

  const where = buildListingWhere(searchParams, scope);
  const orderBy = buildOrderBy(searchParams.tri);

  const [listings, total, suppliers] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy,
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { supplier: true, images: { take: 1, orderBy: { position: "asc" } } },
    }),
    prisma.listing.count({ where }),
    prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  // Une recherche sans résultat est le signal le plus précieux du système.
  await logSearchEvent({
    userId: user.id,
    agencyId: user.agencyId,
    query: searchParams.q,
    filters: searchParams,
    resultCount: total,
  });

  const savedFilters = {
    destination: searchParams.q ?? "",
    travelType: searchParams.type ?? "",
    language: searchParams.langue ?? "",
    departureCity: searchParams.ville ?? "",
    supplierId: searchParams.fournisseur ?? "",
    priceMax: searchParams.prixMax ?? "",
    soloOnly: searchParams.solo === "1" ? "true" : "",
    guaranteedOnly: searchParams.garanti === "1" ? "true" : "",
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <PageHeader
        title="Marketplace"
        description="Les espaces encore disponibles sur des groupes confirmés."
        action={<SaveSearchButton filters={savedFilters} />}
      />

      <div className="mt-5">
        <MarketplaceFilters suppliers={suppliers} />
      </div>

      <p className="mt-4 text-sm text-navy-500" aria-live="polite">
        {total} résultat{total > 1 ? "s" : ""}
      </p>

      {listings.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Search}
            title="Aucun espace ne correspond à cette recherche"
            description="Enregistrez-la : nous vous avertirons dès qu'une agence publie un inventaire correspondant."
            action={<SaveSearchButton filters={savedFilters} />}
          />
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} canSeePrice={canSeePrice(l, user)} />
            ))}
          </div>

          {total > PER_PAGE && (
            <nav className="mt-8 flex justify-center gap-2" aria-label="Pagination">
              {Array.from({ length: Math.ceil(total / PER_PAGE) }, (_, i) => i + 1).map((p) => {
                const params = new URLSearchParams(searchParams);
                params.set("page", String(p));
                return (
                  <a
                    key={p}
                    href={`/marketplace?${params}`}
                    aria-current={p === page ? "page" : undefined}
                    className={`rounded-lg px-3 py-1.5 text-sm ${
                      p === page ? "bg-navy-900 text-white" : "bg-white text-navy-600 ring-1 ring-navy-200"
                    }`}
                  >
                    {p}
                  </a>
                );
              })}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
