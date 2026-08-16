import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser, visibilityScopeFor, canSeePrice } from "@/lib/auth";
import { buildListingWhere, buildOrderBy } from "@/lib/matching";
import { logSearchEvent } from "@/actions/saved-searches";
import { PageHeader } from "@/components/layout/page-header";
import { MarketplaceFilters } from "@/components/listings/filters";
import { SaveSearchButton } from "@/components/listings/save-search-button";
import { ListingCard } from "@/components/listings/listing-card";
import { Card, EmptyState } from "@/components/ui/card";
import Image from "next/image";

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
			include: {
				supplier: true,
				images: { take: 1, orderBy: { position: "asc" } },
				author: { select: { id: true, firstName: true, lastName: true, publicIdentifier: true, avatarUrl: true } },
			},
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
		<div className="min-h-screen bg-navy-50/60">
			<div className="page-shell page-shell-market">
				{/* HEADER SLOT */}
				<section className="relative overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm min-h-[200px]">
					{/* <div className="h-28 bg-gradient-to-br from-orange-500 via-navy-500 to-navy-800" /> */}
					<Image
						src="/images/marketplace-cover.webp"
						alt="LastCall"
						width={1500}
						height={1500}
						className="absolute top-0 left-0 right-0 h-[50%] w-full m-auto object-cover"
					/>
					<div className="px-6 pb-6 absolute bottom-0 left-0 right-0">
						<div className="flex justify-between items-end gap-4 mt-2">
							<PageHeader
								title="Marketplace"
								description="Espaces encore disponibles sur des groupes confirmés."
							/>
							<p
								className="mt-2 text-sm text-navy-500"
								aria-live="polite"
							>
								{total} annonce{total > 1 ? "s" : ""}
							</p>
						</div>
						{/* <SaveSearchButton filters={savedFilters} /> */}
					</div>
				</section>

				<div className="mt-5 grid gap-5 lg:grid-cols-12">
					{/* FILTERS SLOT */}
					<aside className="space-y-4 lg:col-span-4 lg:self-start">
						<Card className="rounded-2xl p-4 sm:p-5 lg:sticky lg:top-[4.5rem]">
							<MarketplaceFilters suppliers={suppliers} />
						</Card>
						{/* <Card className="rounded-2xl p-5">
							<h2 className="text-lg font-semibold text-navy-900">Recherche active</h2>
							<p className="mt-2 text-sm leading-relaxed text-navy-600">
								Affinez vos critères à gauche pour faire remonter rapidement les groupes les plus pertinents.
							</p>
							<div className="mt-4 flex items-center justify-between rounded-xl bg-navy-50 px-4 py-3">
								<span className="text-sm text-navy-500">Résultats trouvés</span>
								<span className="text-lg font-semibold text-navy-900">{total}</span>
							</div>
						</Card> */}
					</aside>

					{/* RESULTS SLOT */}
					<section className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm sm:p-5 lg:col-span-8">
						<div className="section-header border-b border-navy-100 pb-4">
							<div>
								<h2 className="section-title text-lg">Publications disponibles</h2>
								<p className="section-subtitle">Consultez les groupes publiés par les agents et agences du réseau.</p>
							</div>
							<div className="rounded-full bg-navy-100 px-3 py-1 text-sm font-medium text-navy-700">Page {page}</div>
						</div>

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
								<div className="mt-5 space-y-4">
									{listings.map((l) => (
										<ListingCard
											key={l.id}
											listing={l}
											canSeePrice={canSeePrice(l, user)}
											variant="feed"
										/>
									))}
								</div>

								{total > PER_PAGE && (
									<nav
										className="mt-8 flex flex-wrap justify-center gap-2"
										aria-label="Pagination"
									>
										{Array.from({ length: Math.ceil(total / PER_PAGE) }, (_, i) => i + 1).map((p) => {
											const params = new URLSearchParams(searchParams);
											params.set("page", String(p));
											return (
												<a
													key={p}
													href={`/marketplace?${params}`}
													aria-current={p === page ? "page" : undefined}
													className={
														p === page
															? "rounded-lg bg-navy-900 px-3 py-1.5 text-sm font-semibold text-white"
															: "rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-navy-600 ring-1 ring-navy-200 transition hover:bg-navy-50"
													}
												>
													{p}
												</a>
											);
										})}
									</nav>
								)}
							</>
						)}
					</section>
				</div>
			</div>
		</div>
	);
}
