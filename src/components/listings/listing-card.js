import Link from "next/link";
import { CldImage } from "next-cloudinary";
import { Badge, listingBadges } from "@/components/ui/badge";
import { formatDate, formatMoney, daysUntil, inventoryLabel } from "@/lib/utils";
import { TRAVEL_TYPE_LABELS } from "@/lib/validators";
import { cn } from "@/lib/utils";

/** Dégradé déterministe quand une annonce n'a pas d'image. */
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

export function ListingCard({ listing, canSeePrice = true, compact = false }) {
  const days = daysUntil(listing.releaseDate);
  const urgent = days !== null && days <= 21;
  const badges = listingBadges(listing, days);
  const cover = listing.images?.[0];

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-navy-100 transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-urgent-500"
    >
      <div className={cn("relative", compact ? "h-28" : "h-36")}>
        {cover ? (
          <CldImage
            src={cover.publicId}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className={cn("h-full w-full bg-gradient-to-br", gradientFor(listing.id))} aria-hidden />
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-1">
          {badges.slice(0, 1).map((b) => (
            <Badge key={b.label} tone={b.tone}>{b.label}</Badge>
          ))}
        </div>

        {urgent && days > 0 && (
          <div className="absolute right-3 top-3 rounded-lg bg-white px-2.5 py-1.5 text-center shadow-sm">
            <div className="text-base font-bold leading-none text-navy-900">{days}</div>
            <div className="text-[9px] font-medium uppercase leading-tight text-navy-400">
              jours<br />restants
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
          Départ&nbsp;: {formatDate(listing.departureDate)} · {listing.departureCity}
        </p>

        <div className="mt-3 flex items-end justify-between gap-3 pt-1">
          <span className={cn("text-sm font-semibold", urgent ? "text-red-600" : "text-urgent-600")}>
            {inventoryLabel(listing.inventoryLeft, listing.inventoryType)}
          </span>
          <span className="text-right">
            {canSeePrice ? (
              <>
                <span className="block text-[10px] text-navy-400">à partir de</span>
                <span className="block text-base font-bold text-navy-900">
                  {formatMoney(listing.price, listing.currency)}
                </span>
              </>
            ) : (
              <span className="block text-xs font-medium text-navy-400">
                Tarif réservé aux<br />agences vérifiées
              </span>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}
