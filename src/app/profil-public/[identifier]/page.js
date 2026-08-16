import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Mail, MapPin, Globe, Phone, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge, listingBadges } from "@/components/ui/badge";
import { requireUser, canSeePrice } from "@/lib/auth";
import { ListingCard } from "@/components/listings/listing-card";
import { CoverImageEditor } from "@/components/profile/cover-image-editor";
import { RelationRequestButton } from "@/components/relations/relation-request-button";
import { daysUntil, formatDate, formatMoney, inventoryLabel } from "@/lib/utils";
import { TRAVEL_TYPE_LABELS } from "@/lib/validators";

export async function generateMetadata({ params }) {
	return {
		title: `@${params.identifier}`,
		description: "Profil public LastCall",
	};
}

function formatPostDate(value) {
	const date = value instanceof Date ? value : new Date(value);
	return new Intl.DateTimeFormat("fr-CA", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(date);
}

function ListingSquareTile({ listing }) {
	const coverUrl = listing.images?.[0]?.url;
	const days = daysUntil(listing.releaseDate);
	const badges = listingBadges(listing, days);

	return (
		<Link
			href={`/listing/${listing.id}`}
			className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-urgent-500"
		>
			<Card className="relative aspect-square overflow-hidden rounded-xl border-navy-200 p-0 shadow-sm">
				{coverUrl ? (
					<Image
						src={coverUrl}
						alt={listing.title}
						fill
						sizes="(max-width: 1024px) 50vw, 33vw"
						className="object-cover transition duration-300 group-hover:scale-105"
					/>
				) : (
					<div className="h-full w-full bg-gradient-to-br from-slate-200 via-cyan-300 to-blue-700" />
				)}

				<div className="absolute left-3 top-3 right-3 flex flex-wrap gap-1">
					{badges.slice(0, 2).map((badge) => (
						<Badge
							key={badge.label}
							tone={badge.tone}
						>
							{badge.label}
						</Badge>
					))}
				</div>

				<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
					<p className="line-clamp-2 text-sm font-semibold text-white">{listing.title}</p>
					<p className="mt-1 text-xs text-white/90">Publication du {formatPostDate(listing.updatedAt)}</p>
				</div>
			</Card>
		</Link>
	);
}

function ListingHorizontalTile({ listing, publisherName, publisherAvatarUrl, canDisplayPrice }) {
	const coverUrl = listing.images?.[0]?.url;
	const days = daysUntil(listing.releaseDate);
	const badges = listingBadges(listing, days);

	return (
		<Card className="overflow-hidden rounded-xl border-navy-100 p-0 shadow-sm">
			<Link
				href={`/listing/${listing.id}`}
				className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-urgent-500"
			>
				<div className="flex flex-col sm:flex-row">
					<div className="relative aspect-[4/3] w-full overflow-hidden bg-navy-100 sm:w-64 sm:shrink-0">
						{coverUrl ? (
							<Image
								src={coverUrl}
								alt={listing.title}
								fill
								sizes="(max-width: 640px) 100vw, 256px"
								className="object-cover transition duration-300 hover:scale-105"
							/>
						) : (
							<div className="h-full w-full bg-gradient-to-br from-slate-200 via-cyan-300 to-blue-700" />
						)}
						<div className="absolute left-3 top-3 right-20 flex flex-wrap gap-1">
							{badges.slice(0, 2).map((badge) => (
								<Badge
									key={badge.label}
									tone={badge.tone}
								>
									{badge.label}
								</Badge>
							))}
						</div>
						{days !== null && days > 0 && days <= 21 && (
							<div className="absolute bottom-3 right-3 rounded-lg bg-white px-2.5 py-1.5 text-center shadow-sm">
								<div className="text-base font-bold leading-none text-navy-900">{days}</div>
								<div className="text-[9px] font-medium uppercase leading-tight text-navy-400">
									jours
									<br />
									restants
								</div>
							</div>
						)}
					</div>

					<div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
						<div className="mb-3 flex items-center gap-3">
							<div className="h-10 w-10 overflow-hidden rounded-full bg-navy-100">
								{publisherAvatarUrl ? (
									<Image
										src={publisherAvatarUrl}
										alt={publisherName}
										width={40}
										height={40}
										className="h-full w-full object-cover"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center text-xs font-bold text-navy-700">{publisherName?.[0] || "?"}</div>
								)}
							</div>
							<div className="min-w-0">
								<p className="truncate text-sm font-semibold text-navy-900">{publisherName}</p>
								<p className="text-xs text-navy-500">Publication du {formatPostDate(listing.updatedAt)}</p>
							</div>
						</div>

						<h3 className="line-clamp-2 text-base font-semibold text-navy-900">{listing.title}</h3>
						<p className="mt-1 text-sm text-navy-600">
							{TRAVEL_TYPE_LABELS[listing.travelType] || "Voyage"}
							{listing.nights ? ` · ${listing.nights} nuits` : ""}
							{listing.supplier?.name ? ` · ${listing.supplier.name}` : ""}
						</p>
						<p className="mt-1 text-sm text-navy-600">
							Depart: {formatDate(listing.departureDate)}
							{listing.departureCity ? ` · ${listing.departureCity}` : ""}
						</p>
						<p className="mt-1 text-sm font-medium text-urgent-600">{inventoryLabel(listing.inventoryLeft, listing.inventoryType)}</p>
						<div className="mt-3 flex items-center justify-between gap-3">
							<span className="text-xs font-medium text-navy-500">Voir les details</span>
							{canDisplayPrice ? (
								<span className="text-sm font-semibold text-navy-900">{formatMoney(listing.price, listing.currency)}</span>
							) : (
								<span className="text-xs font-medium text-navy-400">Tarif reserve aux agences verifiees</span>
							)}
						</div>
					</div>
				</div>
			</Link>
		</Card>
	);
}

export default async function PublicProfilePage({ params, searchParams = {} }) {
	const currentUser = await requireUser();
	const requestedTab = String(searchParams?.tab || "").toLowerCase();
	const activeTab = requestedTab === "about" || requestedTab === "annonces" ? requestedTab : "home";
	const identifier = String(params?.identifier || "")
		.trim()
		.toLowerCase();
	if (!identifier) notFound();

	const [agent, agencyRecord, supplierRecord] = await Promise.all([
		prisma.user.findFirst({
			where: {
				OR: [{ publicIdentifier: identifier }, { id: identifier }],
			},
			select: {
				id: true,
				firstName: true,
				lastName: true,
				bio: true,
				email: true,
				avatarUrl: true,
				coverUrl: true,
				coverPositionY: true,
				publicIdentifier: true,
				memberships: {
					select: {
						agency: {
							select: {
								id: true,
								name: true,
								publicIdentifier: true,
								logoUrl: true,
								coverUrl: true,
								description: true,
								website: true,
								contactEmail: true,
								contactPhone: true,
								city: true,
								province: true,
								country: true,
							},
						},
						isPrimary: true,
					},
					orderBy: { isPrimary: "desc" },
					take: 1,
				},
			},
		}),
		prisma.agency.findFirst({
			where: {
				OR: [{ publicIdentifier: identifier }, { id: identifier }],
			},
			select: {
				id: true,
				name: true,
				logoUrl: true,
				coverUrl: true,
				coverPositionY: true,
				description: true,
				contactEmail: true,
				contactPhone: true,
				website: true,
				publicIdentifier: true,
				city: true,
				province: true,
				country: true,
				members: {
					select: {
						id: true,
						role: true,
						isPrimary: true,
						user: {
							select: {
								id: true,
								firstName: true,
								lastName: true,
								publicIdentifier: true,
								email: true,
								phone: true,
								avatarUrl: true,
							},
						},
					},
					orderBy: [{ role: "asc" }, { isPrimary: "desc" }, { joinedAt: "asc" }],
				},
			},
		}),
		prisma.supplier.findFirst({
			where: {
				OR: [{ publicIdentifier: identifier }, { id: identifier }],
				members: { some: {} },
			},
			select: {
				id: true,
				name: true,
				logoUrl: true,
				coverUrl: true,
				coverPositionY: true,
				description: true,
				contactEmail: true,
				contactPhone: true,
				website: true,
				publicIdentifier: true,
				city: true,
				province: true,
				country: true,
				members: {
					select: {
						id: true,
						role: true,
						isPrimary: true,
						user: {
							select: {
								id: true,
								firstName: true,
								lastName: true,
								publicIdentifier: true,
								email: true,
								phone: true,
								avatarUrl: true,
							},
						},
					},
					orderBy: [{ isPrimary: "desc" }, { joinedAt: "asc" }],
				},
			},
		}),
	]);

	const isSupplierOrg = !agencyRecord && Boolean(supplierRecord);
	const agency = agencyRecord ?? supplierRecord;

	if (!agent && !agency) notFound();

	if (agent) {
		const primaryAgency = agent.memberships[0]?.agency;
		const primaryAgencyHref = primaryAgency
			? primaryAgency.publicIdentifier
				? `/@${primaryAgency.publicIdentifier}`
				: `/profil-public/${primaryAgency.id}`
			: null;
		const isOwnAgentProfile = agent.id === currentUser.id;

		const listings = await prisma.listing.findMany({
			where: { authorId: agent.id, status: { not: "DRAFT" } },
			include: {
				supplier: true,
				images: { take: 1, orderBy: { position: "asc" } },
				author: { select: { id: true, firstName: true, lastName: true, publicIdentifier: true } },
			},
			orderBy: { updatedAt: "desc" },
			take: 12,
		});
		return (
			<div className="min-h-screen bg-navy-50/60">
				<div className="mx-auto max-w-[1120px] px-4 py-6 sm:px-6">
					<section className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm">
						<CoverImageEditor
							type="agent"
							coverUrl={agent.coverUrl}
							initialPositionY={agent.coverPositionY ?? 50}
							editable={isOwnAgentProfile}
							profileEditHref="/profil"
						/>

						<div className="relative px-6 pb-0">
							<div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
								<div className="flex items-end gap-4">
									<div className="h-24 w-24 overflow-hidden rounded-2xl border-4 border-white bg-navy-100 shadow-sm">
										{agent.avatarUrl ? (
											<Image
												src={agent.avatarUrl}
												alt={`${agent.firstName} ${agent.lastName}`}
												width={96}
												height={96}
												className="h-full w-full object-cover"
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center text-xl font-bold text-navy-700">
												{agent.firstName?.[0]}
												{agent.lastName?.[0]}
											</div>
										)}
									</div>
									<div>
										<h1 className="text-2xl font-bold text-white drop-shadow-sm">
											{agent.firstName} {agent.lastName}
										</h1>
										<p className="text-sm font-medium text-urgent-600">@{agent.publicIdentifier}</p>
										{primaryAgency?.name && (
											<p className="mt-1 text-sm text-navy-600">
												Agence:{" "}
												{primaryAgencyHref ? (
													<Link
														href={primaryAgencyHref}
														className="font-medium text-urgent-600 hover:underline"
													>
														{primaryAgency.name}
													</Link>
												) : (
													primaryAgency.name
												)}
											</p>
										)}
									</div>
								</div>

								<div className="flex items-center gap-2">
									<Badge tone="neutral">Agent</Badge>
									{isOwnAgentProfile ? null : (
										<RelationRequestButton
											targetUserId={agent.id}
											targetName={`${agent.firstName} ${agent.lastName}`}
										/>
									)}
								</div>
							</div>

							<div className="mt-6 border-t border-navy-100">
								<div className="flex flex-wrap items-center justify-between gap-3 py-3">
									<nav className="flex items-center gap-2 overflow-x-auto">
										<Link
											href="?tab=home"
											className={
												activeTab === "home"
													? "rounded-lg bg-navy-100 px-3 py-1.5 text-sm font-semibold text-navy-900"
													: "rounded-lg px-3 py-1.5 text-sm font-medium text-navy-500 hover:bg-navy-50"
											}
										>
											Accueil
										</Link>
										<Link
											href="?tab=about"
											className={
												activeTab === "about"
													? "rounded-lg bg-navy-100 px-3 py-1.5 text-sm font-semibold text-navy-900"
													: "rounded-lg px-3 py-1.5 text-sm font-medium text-navy-500 hover:bg-navy-50"
											}
										>
											A propos
										</Link>
										<Link
											href="?tab=annonces"
											className={
												activeTab === "annonces"
													? "rounded-lg bg-navy-100 px-3 py-1.5 text-sm font-semibold text-navy-900"
													: "rounded-lg px-3 py-1.5 text-sm font-medium text-navy-500 hover:bg-navy-50"
											}
										>
											Annonces
										</Link>
									</nav>
									<Link
										href="/messagerie"
										className="inline-flex items-center rounded-lg bg-urgent-500 px-3 py-2 text-sm font-semibold text-white hover:bg-urgent-600"
									>
										Envoyer un message
									</Link>
								</div>
							</div>
						</div>
					</section>

					{activeTab === "about" ? (
						<section className="mt-5">
							<Card className="rounded-xl border-navy-100 p-5 shadow-sm">
								<h2 className="text-lg font-semibold text-navy-900">A propos</h2>
								<p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-navy-700">{agent.bio || "Aucune présentation pour le moment."}</p>
								<div className="mt-5 border-t border-navy-100 pt-4">
									<h3 className="font-semibold text-navy-900">Coordonnees</h3>
									<div className="mt-2 space-y-2 text-sm text-navy-600">
										{agent.email && (
											<p className="flex items-center gap-2">
												<Mail className="h-4 w-4 text-navy-400" />
												{agent.email}
											</p>
										)}
										{primaryAgency && (
											<p className="flex items-center gap-2">
												<MapPin className="h-4 w-4 text-navy-400" />
												{primaryAgency.city || "Ville non renseignee"}
												{primaryAgency.province ? `, ${primaryAgency.province}` : ""}
												{primaryAgency.country ? `, ${primaryAgency.country}` : ""}
											</p>
										)}
									</div>
								</div>
							</Card>
						</section>
					) : activeTab === "annonces" ? (
						<section className="mt-5 rounded-xl border border-navy-100 bg-white p-4 shadow-sm sm:p-6">
							<div className="mb-4 flex items-center justify-between">
								<h2 className="text-lg font-semibold text-navy-900">Annonces</h2>
								<span className="text-sm text-navy-600">{listings.length} annonce(s)</span>
							</div>
							{listings.length === 0 ? (
								<p className="text-sm text-navy-600">Aucune annonce publiee pour le moment.</p>
							) : (
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
									{/* ANNONCES GRID */}
									{listings.map((listing) => (
										<ListingSquareTile
											key={listing.id}
											listing={listing}
										/>
									))}
								</div>
							)}
						</section>
					) : (
						<section className="mt-5 grid gap-5 lg:grid-cols-12">
							<div className="space-y-4 lg:col-span-4 lg:sticky lg:top-20 lg:self-start">
								<Card className="rounded-xl border-navy-100 p-4 shadow-sm">
									<h2 className="font-semibold text-navy-900">A propos</h2>
									<p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-navy-700">{agent.bio || "Aucune présentation pour le moment."}</p>
								</Card>
								<Card className="rounded-xl border-navy-100 p-4 shadow-sm">
									<h2 className="font-semibold text-navy-900">Coordonnees</h2>
									<div className="mt-3 space-y-2 text-sm text-navy-600">
										{agent.email && (
											<p className="flex items-center gap-2">
												<Mail className="h-4 w-4 text-navy-400" />
												{agent.email}
											</p>
										)}
										{primaryAgency && (
											<p className="flex items-center gap-2">
												<MapPin className="h-4 w-4 text-navy-400" />
												{primaryAgency.city || "Ville non renseignee"}
												{primaryAgency.province ? `, ${primaryAgency.province}` : ""}
												{primaryAgency.country ? `, ${primaryAgency.country}` : ""}
											</p>
										)}
									</div>
								</Card>
							</div>
							<div className="space-y-4 lg:col-span-8">
								<Card className="rounded-xl border-navy-100 p-4 shadow-sm">
									<div className="flex items-center justify-between">
										<h2 className="text-lg font-semibold text-navy-900">Publications</h2>
										<span className="text-sm text-navy-500">{listings.length} publication(s)</span>
									</div>
								</Card>
								{listings.length === 0 ? (
									<Card className="rounded-xl border-navy-100 p-6 text-sm text-navy-500 shadow-sm">Aucune annonce publiee pour le moment.</Card>
								) : (
									listings.map((listing) => (
										<ListingHorizontalTile
											key={listing.id}
											listing={listing}
											publisherName={`${agent.firstName} ${agent.lastName}`}
											publisherAvatarUrl={agent.avatarUrl}
											canDisplayPrice={canSeePrice(listing, currentUser)}
										/>
									))
								)}
							</div>
						</section>
					)}
				</div>
			</div>
		);
	}

	const isOwnAgency = isSupplierOrg ? agency.id === currentUser.supplierId : agency.id === currentUser.agencyId;
	const agencyContact = agency.members.find((member) => member.role === "AGENCY_ADMIN")?.user ?? agency.members[0]?.user ?? null;
	const agencyListings = await prisma.listing.findMany({
		where: { ...(isSupplierOrg ? { ownerSupplierId: agency.id } : { agencyId: agency.id }), status: { not: "DRAFT" } },
		include: {
			supplier: true,
			images: { take: 1, orderBy: { position: "asc" } },
			author: { select: { id: true, firstName: true, lastName: true, publicIdentifier: true, avatarUrl: true } },
		},
		orderBy: { updatedAt: "desc" },
		take: 18,
	});
	return (
		<div className="min-h-screen bg-navy-50/60">
			<div className="mx-auto max-w-[1120px] px-4 py-6 sm:px-6">
				<section className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm">
					<CoverImageEditor
						type="agency"
						coverUrl={agency.coverUrl}
						initialPositionY={agency.coverPositionY ?? 50}
						editable={isOwnAgency && !isSupplierOrg}
						className="from-emerald-300 via-cyan-400 to-navy-700"
					/>

					<div className="relative px-6 pb-0">
						<div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
							<div className="flex items-end gap-4">
								<div className="h-24 w-24 overflow-hidden rounded-2xl border-4 border-white bg-navy-100 shadow-sm">
									{agency.logoUrl ? (
										<Image
											src={agency.logoUrl}
											alt={agency.name}
											width={96}
											height={96}
											className="h-full w-full object-cover"
										/>
									) : (
										<div className="flex h-full w-full items-center justify-center text-xl font-bold text-navy-700">{agency.name?.[0]}</div>
									)}
								</div>
								<div>
									<h1 className="text-2xl font-bold text-white drop-shadow-sm">{agency.name}</h1>
									<p className="text-sm font-medium text-urgent-600">@{agency.publicIdentifier}</p>
									<p className="mt-1 text-sm text-navy-500">{agency.members.length} membre(s)</p>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<Badge tone="neutral">{isSupplierOrg ? "Fournisseur" : "Agence"}</Badge>
								{!isOwnAgency && agencyContact && agencyContact.id !== currentUser.id ? (
									<RelationRequestButton
										targetUserId={agencyContact.id}
										targetName={`${agencyContact.firstName} ${agencyContact.lastName}`}
									/>
								) : null}
							</div>
						</div>

						<div className="mt-6 border-t border-navy-100">
							<div className="flex flex-wrap items-center justify-between gap-3 py-3">
								<nav className="flex items-center gap-2 overflow-x-auto">
									<Link
										href="?tab=home"
										className={
											activeTab === "home"
												? "rounded-lg bg-navy-100 px-3 py-1.5 text-sm font-semibold text-navy-900"
												: "rounded-lg px-3 py-1.5 text-sm font-medium text-navy-500 hover:bg-navy-50"
										}
									>
										Accueil
									</Link>
									<Link
										href="?tab=about"
										className={
											activeTab === "about"
												? "rounded-lg bg-navy-100 px-3 py-1.5 text-sm font-semibold text-navy-900"
												: "rounded-lg px-3 py-1.5 text-sm font-medium text-navy-500 hover:bg-navy-50"
										}
									>
										A propos
									</Link>
									<Link
										href="?tab=annonces"
										className={
											activeTab === "annonces"
												? "rounded-lg bg-navy-100 px-3 py-1.5 text-sm font-semibold text-navy-900"
												: "rounded-lg px-3 py-1.5 text-sm font-medium text-navy-500 hover:bg-navy-50"
										}
									>
										Annonces
									</Link>
								</nav>
								<Link
									href={isOwnAgency ? "/publier" : "/messagerie"}
									className="inline-flex items-center rounded-lg bg-urgent-500 px-3 py-2 text-sm font-semibold text-white hover:bg-urgent-600"
								>
									{isOwnAgency ? "Créer une annonce" : "Envoyer un message"}
								</Link>
							</div>
						</div>
					</div>
				</section>

				{activeTab === "about" ? (
					<section className="mt-5 space-y-5">
						<Card className="rounded-xl border-navy-100 p-5 shadow-sm">
							<h2 className="text-lg font-semibold text-navy-900">A propos de l&apos;agence</h2>
							<p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-navy-700">{agency.description || "Aucune presentation pour le moment."}</p>
						</Card>

						<Card className="rounded-xl border-navy-100 p-5 shadow-sm">
							<h3 className="font-semibold text-navy-900">Coordonnees</h3>
							<div className="mt-3 space-y-2 text-sm text-navy-600">
								{agency.contactEmail && (
									<p className="flex items-center gap-2">
										<Mail className="h-4 w-4 text-navy-400" />
										{agency.contactEmail}
									</p>
								)}
								{agency.contactPhone && (
									<p className="flex items-center gap-2">
										<Phone className="h-4 w-4 text-navy-400" />
										{agency.contactPhone}
									</p>
								)}
								{agency.website && (
									<p className="flex items-center gap-2">
										<Globe className="h-4 w-4 text-navy-400" />
										<a
											href={agency.website}
											target="_blank"
											rel="noreferrer"
											className="text-urgent-600 hover:underline"
										>
											{agency.website}
										</a>
									</p>
								)}
								<p className="flex items-center gap-2">
									<MapPin className="h-4 w-4 text-navy-400" />
									{agency.city || "Ville non renseignee"}
									{agency.province ? `, ${agency.province}` : ""}
									{agency.country ? `, ${agency.country}` : ""}
								</p>
							</div>
						</Card>

						<Card className="rounded-xl border-navy-100 p-5 shadow-sm">
							<h3 className="font-semibold text-navy-900">Agents affilies</h3>
							{agency.members.length === 0 ? (
								<p className="mt-3 text-sm text-navy-500">Aucun agent affilié pour le moment.</p>
							) : (
								<div className="mt-4 space-y-3">
									{agency.members.map((member) => {
										const memberProfileHref = member.user.publicIdentifier ? `/@${member.user.publicIdentifier}` : `/profil-public/${member.user.id}`;
										const initials = `${member.user.firstName?.[0] ?? ""}${member.user.lastName?.[0] ?? ""}`.toUpperCase();
										return (
											<div
												key={member.id}
												className="flex items-start gap-3 rounded-lg border border-navy-100 p-3"
											>
												<div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-navy-100">
													{member.user.avatarUrl ? (
														<Image
															src={member.user.avatarUrl}
															alt={`${member.user.firstName} ${member.user.lastName}`}
															width={40}
															height={40}
															className="h-full w-full object-cover"
														/>
													) : (
														<div className="flex h-full w-full items-center justify-center text-xs font-semibold text-navy-700">{initials}</div>
													)}
												</div>
												<div className="min-w-0 flex-1">
													<p className="truncate text-sm font-semibold text-navy-900">
														<Link
															href={memberProfileHref}
															className="hover:underline"
														>
															{member.user.firstName} {member.user.lastName}
														</Link>
													</p>
													<p className="text-xs text-navy-500">{member.role}</p>
													<div className="mt-1 space-y-1 text-xs text-navy-600">
														{member.user.email && <p>{member.user.email}</p>}
														{member.user.phone && <p>{member.user.phone}</p>}
													</div>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</Card>
					</section>
				) : activeTab === "annonces" ? (
					<section className="mt-5 rounded-xl border border-navy-100 bg-white p-4 shadow-sm sm:p-6">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-lg font-semibold text-navy-900">Annonces de l&apos;agence</h2>
							<span className="text-sm text-navy-600">{agencyListings.length} annonce(s)</span>
						</div>
						{agencyListings.length === 0 ? (
							<p className="text-sm text-navy-600">Aucune annonce publiee pour le moment.</p>
						) : (
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{/* ANNONCES GRID */}
								{agencyListings.map((listing) => (
									<ListingSquareTile
										key={listing.id}
										listing={listing}
									/>
								))}
							</div>
						)}
					</section>
				) : (
					<section className="mt-5 grid gap-5 lg:grid-cols-12">
						<div className="space-y-4 lg:col-span-4 lg:sticky lg:top-20 lg:self-start">
							<Card className="rounded-xl border-navy-100 p-4 shadow-sm">
								<h2 className="font-semibold text-navy-900">A propos de l&apos;agence</h2>
								<p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-navy-700">{agency.description || "Aucune presentation pour le moment."}</p>
							</Card>
							<Card className="rounded-xl border-navy-100 p-4 shadow-sm">
								<h2 className="font-semibold text-navy-900">Coordonnees</h2>
								<div className="mt-3 space-y-2 text-sm text-navy-600">
									{agency.contactEmail && (
										<p className="flex items-center gap-2">
											<Mail className="h-4 w-4 text-navy-400" />
											{agency.contactEmail}
										</p>
									)}
									{agency.contactPhone && (
										<p className="flex items-center gap-2">
											<Phone className="h-4 w-4 text-navy-400" />
											{agency.contactPhone}
										</p>
									)}
									{agency.website && (
										<p className="flex items-center gap-2">
											<Globe className="h-4 w-4 text-navy-400" />
											<a
												href={agency.website}
												target="_blank"
												rel="noreferrer"
												className="text-urgent-600 hover:underline"
											>
												{agency.website}
											</a>
										</p>
									)}
									<p className="flex items-center gap-2">
										<MapPin className="h-4 w-4 text-navy-400" />
										{agency.city || "Ville non renseignee"}
										{agency.province ? `, ${agency.province}` : ""}
										{agency.country ? `, ${agency.country}` : ""}
									</p>
								</div>
							</Card>
						</div>
						<div className="space-y-4 lg:col-span-8">
							<Card className="rounded-xl border-navy-100 p-4 shadow-sm">
								<div className="flex items-center justify-between">
									<h2 className="text-lg font-semibold text-navy-900">Publications</h2>
									<span className="text-sm text-navy-500">{agencyListings.length} publication(s)</span>
								</div>
							</Card>
							{agencyListings.length === 0 ? (
								<Card className="rounded-xl border-navy-100 p-6 text-sm text-navy-500 shadow-sm">Aucune annonce publiee pour le moment.</Card>
							) : (
								agencyListings.map((listing) =>
									(() => {
										const agentName = listing.author ? `${listing.author.firstName} ${listing.author.lastName}` : agency.name;
										const agentAvatar = listing.author?.avatarUrl || agency.logoUrl;
										return (
											<ListingHorizontalTile
												key={listing.id}
												listing={listing}
												publisherName={agentName}
												publisherAvatarUrl={agentAvatar}
												canDisplayPrice={canSeePrice(listing, currentUser)}
											/>
										);
									})(),
								)
							)}
						</div>
					</section>
				)}
			</div>
		</div>
	);
}
