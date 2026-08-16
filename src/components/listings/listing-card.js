import Link from "next/link";
import Image from "next/image";
import { Badge, listingBadges } from "@/components/ui/badge";
import { formatDate, formatMoney, daysUntil, inventoryLabel, cn } from "@/lib/utils";
import { TRAVEL_TYPE_LABELS } from "@/lib/validators";

/** Degarde deterministe quand une annonce n'a pas d'image. */
const GRADIENTS = [
	"from-sky-400 via-cyan-500 to-blue-700",
	"from-pink-300 via-rose-400 to-rose-600",
	"from-cyan-200 via-sky-400 to-navy-600",
	"from-emerald-400 via-teal-600 to-indigo-800",
	"from-amber-300 via-orange-400 to-rose-600",
	"from-slate-200 via-cyan-300 to-blue-800",
];

function gradientFor(id) {
	let hash = 0;
	for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
	return GRADIENTS[hash % GRADIENTS.length];
}

export function ListingCard({ listing, canSeePrice = true, compact = false, variant = "grid" }) {
	const days = daysUntil(listing.releaseDate);
	const urgent = days !== null && days <= 21;
	const badges = listingBadges(listing, days);
	const cover = listing.images?.[0];
	const isFeed = variant === "feed";
	const agentProfileHref = listing.author
		? listing.author.publicIdentifier
			? `/@${listing.author.publicIdentifier}`
			: listing.author.id
				? `/profil-public/${listing.author.id}`
				: null
		: null;
	const authorName = listing.author ? `${listing.author.firstName} ${listing.author.lastName}` : null;

	if (isFeed) {
		return (
			<div className="group overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-navy-100 transition hover:shadow-md">
				<Link
					href={`/listing/${listing.id}`}
					className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-urgent-500"
				>
					<div className="flex flex-col sm:flex-row">
						<div className="relative h-52 w-full shrink-0 sm:h-auto sm:w-72">
							{cover ? (
								<Image
									src={cover.url}
									alt={listing.title}
									fill
									sizes="(max-width: 768px) 100vw, 288px"
									className="object-cover"
								/>
							) : (
								<div
									className={cn("h-full w-full bg-gradient-to-br", gradientFor(listing.id))}
									aria-hidden
								/>
							)}

							<div className="absolute left-3 top-3 right-20 flex flex-wrap gap-1">
								{badges.slice(0, 2).map((b) => (
									<Badge
										key={b.label}
										tone={b.tone}
									>
										{b.label}
									</Badge>
								))}
							</div>

							{urgent && days > 0 && (
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
									{listing.author?.avatarUrl ? (
										<Image
											src={listing.author.avatarUrl}
											alt={authorName || "Agent"}
											width={40}
											height={40}
											className="h-full w-full object-cover"
										/>
									) : (
										<div className="flex h-full w-full items-center justify-center text-xs font-bold text-navy-700">
											{authorName?.[0] || listing.supplier?.name?.[0] || "?"}
										</div>
									)}
								</div>
								<div className="min-w-0">
									<p className="truncate text-sm font-semibold text-navy-900">{authorName || "Publication reseau"}</p>
									<p className="text-xs text-navy-500">Publication du {formatDate(listing.updatedAt)}</p>
								</div>
							</div>

							<h3 className="text-lg font-semibold leading-snug text-navy-900">{listing.title}</h3>
							<p className="mt-1 text-sm text-navy-500">
								{TRAVEL_TYPE_LABELS[listing.travelType]}
								{listing.nights ? ` · ${listing.nights} nuits` : ""}
								{listing.supplier ? ` · ${listing.supplier.name}` : ""}
							</p>
							<p className="mt-1 text-sm text-navy-500">
								Depart: {formatDate(listing.departureDate)} · {listing.departureCity}
							</p>
							<p className={cn("mt-2 text-sm font-semibold", urgent ? "text-red-600" : "text-urgent-600")}>
								{inventoryLabel(listing.inventoryLeft, listing.inventoryType)}
							</p>

							<div className="mt-4 flex items-end justify-between gap-3 border-t border-navy-100 pt-3">
								<span className="text-xs font-medium text-navy-500">Voir les details</span>
								<span className="text-right">
									{canSeePrice ? (
										<>
											<span className="block text-[10px] text-navy-400">a partir de</span>
											<span className="block text-lg font-bold text-navy-900">{formatMoney(listing.price, listing.currency)}</span>
										</>
									) : (
										<span className="block text-xs font-medium text-navy-400">
											Tarif reserve aux
											<br />
											agences verifiees
										</span>
									)}
								</span>
							</div>
						</div>
					</div>
				</Link>
			</div>
		);
	}

	return (
		<div className="group overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-navy-100 transition hover:shadow-md">
			<Link
				href={`/listing/${listing.id}`}
				className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-urgent-500"
			>
				<div className={cn("relative", compact ? "h-28" : "h-36")}>
					{cover ? (
						<Image
							src={cover.url}
							alt={listing.title}
							fill
							sizes="(max-width: 768px) 100vw, 33vw"
							className="object-cover"
						/>
					) : (
						<div
							className={cn("h-full w-full bg-gradient-to-br", gradientFor(listing.id))}
							aria-hidden
						/>
					)}

					<div className="absolute left-3 top-3 flex flex-wrap gap-1">
						{badges.slice(0, 1).map((b) => (
							<Badge
								key={b.label}
								tone={b.tone}
							>
								{b.label}
							</Badge>
						))}
					</div>

					{urgent && days > 0 && (
						<div className="absolute right-3 top-3 rounded-lg bg-white px-2.5 py-1.5 text-center shadow-sm">
							<div className="text-base font-bold leading-none text-navy-900">{days}</div>
							<div className="text-[9px] font-medium uppercase leading-tight text-navy-400">
								jours
								<br />
								restants
							</div>
						</div>
					)}
				</div>

				<div className="flex flex-1 flex-col p-4">
					<h3 className="font-semibold leading-snug text-navy-900">{listing.title}</h3>
					<p className="mt-1 text-xs text-navy-500">
						{TRAVEL_TYPE_LABELS[listing.travelType]}
						{listing.nights ? ` · ${listing.nights} nuits` : ""}
						{listing.supplier ? ` · ${listing.supplier.name}` : ""}
					</p>
					<p className="mt-0.5 text-xs text-navy-500">
						Depart: {formatDate(listing.departureDate)} · {listing.departureCity}
					</p>

					<div className="mt-3 flex items-end justify-between gap-3 pt-1">
						<span className={cn("text-sm font-semibold", urgent ? "text-red-600" : "text-urgent-600")}>
							{inventoryLabel(listing.inventoryLeft, listing.inventoryType)}
						</span>
						<span className="text-right">
							{canSeePrice ? (
								<>
									<span className="block text-[10px] text-navy-400">a partir de</span>
									<span className="block text-base font-bold text-navy-900">{formatMoney(listing.price, listing.currency)}</span>
								</>
							) : (
								<span className="block text-xs font-medium text-navy-400">
									Tarif reserve aux
									<br />
									agences verifiees
								</span>
							)}
						</span>
					</div>
				</div>
			</Link>

			{listing.author && (
				<p className="px-4 pb-3 text-xs text-navy-500">
					Agent affilie:{" "}
					{agentProfileHref ? (
						<Link
							href={agentProfileHref}
							className="font-medium text-urgent-600 hover:underline"
						>
							{listing.author.firstName} {listing.author.lastName}
						</Link>
					) : (
						<>
							{listing.author.firstName} {listing.author.lastName}
						</>
					)}
				</p>
			)}
		</div>
	);
}
