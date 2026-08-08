import Link from "next/link";
import { notFound } from "next/navigation";
import { CldImage } from "next-cloudinary";
import {
  ChevronLeft, MapPin, Calendar, Ship, Globe, Bed, Users, Clock, CheckCircle2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser, visibilityScopeFor, canSeePrice } from "@/lib/auth";
import { trackListingView } from "@/actions/listings";
import { Badge, listingBadges } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { InterestDialog } from "@/components/listings/interest-dialog";
import { formatDate, formatMoney, daysUntil, inventoryLabel, cn } from "@/lib/utils";
import { TRAVEL_TYPE_LABELS, VISIBILITY_LABELS } from "@/lib/validators";

export async function generateMetadata({ params }) {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    select: { title: true, destination: true, visibility: true },
  });
  if (!listing) return { title: "Espace introuvable" };
  return {
    title: listing.title,
    description: `Espace groupe disponible — ${listing.destination}`,
    // Les inventaires B2B ne sont jamais indexés (section 30 du brief).
    robots: listing.visibility === "PUBLIC" ? { index: true } : { index: false, follow: false },
  };
}

export default async function ListingPage({ params, searchParams }) {
  const user = await requireUser();
  const scope = visibilityScopeFor(user);

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      agency: true,
      supplier: true,
      ship: true,
      images: { orderBy: { position: "asc" } },
    },
  });

  if (!listing) notFound();

  const isOwner = listing.agencyId === user.agencyId;
  if (!isOwner && !scope.includes(listing.visibility)) notFound();
  if (!isOwner && listing.status !== "ACTIVE") notFound();

  if (!isOwner) trackListingView(listing.id, user.id, "MARKETPLACE");

  const days = daysUntil(listing.releaseDate);
  const badges = listingBadges(listing, days);
  const showPrice = canSeePrice(listing, user);
  const cover = listing.images[0];

  const facts = [
    [MapPin, "Destination", listing.destination],
    [Calendar, "Dates", `${formatDate(listing.departureDate)}${listing.returnDate ? ` → ${formatDate(listing.returnDate)}` : ""}`],
    [Ship, "Ville de départ", listing.departureCity],
    [Globe, "Langue du groupe", { fr: "Français", en: "Anglais", bilingue: "Bilingue" }[listing.language]],
    [Bed, "Catégorie", listing.cabinCategory ?? "Non précisée"],
    [Users, "Inventaire restant", inventoryLabel(listing.inventoryLeft, listing.inventoryType)],
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link href="/marketplace" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-navy-600 hover:text-navy-900">
        <ChevronLeft className="h-4 w-4" aria-hidden /> Retour au marketplace
      </Link>

      {searchParams?.publiee && (
        <div role="status" className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          Annonce publiée. Les conseillers dont la recherche correspond ont été avertis.
        </div>
      )}

      <div className="relative h-56 overflow-hidden rounded-xl bg-gradient-to-br from-cyan-200 via-sky-400 to-navy-600">
        {cover && (
          <CldImage src={cover.publicId} alt={listing.title} fill sizes="100vw" className="object-cover" priority />
        )}
        <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
          {badges.map((b) => <Badge key={b.label} tone={b.tone}>{b.label}</Badge>)}
        </div>
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <h1 className="text-2xl font-bold text-navy-900">{listing.title}</h1>
          <p className="mt-1 text-navy-600">
            {TRAVEL_TYPE_LABELS[listing.travelType]}
            {listing.supplier ? ` · ${listing.supplier.name}` : ""}
            {listing.ship ? ` · ${listing.ship.name}` : ""}
          </p>

          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            {facts.map(([Icon, label, value]) => (
              <div key={label} className="flex gap-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" aria-hidden />
                <div>
                  <dt className="text-xs uppercase tracking-wide text-navy-400">{label}</dt>
                  <dd className="text-sm font-medium text-navy-900">{value}</dd>
                </div>
              </div>
            ))}
          </dl>

          <div className="mt-6 space-y-4">
            {[
              ["Avantages de groupe", listing.groupBenefits],
              ["Conditions", listing.conditions],
              ["Modalités de collaboration", listing.commissionSplit],
              ["Notes", listing.notes],
            ]
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <section key={label}>
                  <h2 className="text-sm font-semibold text-navy-900">{label}</h2>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-navy-600">{value}</p>
                </section>
              ))}
          </div>
        </div>

        <aside className="space-y-4">
          <Card className="p-5">
            {showPrice ? (
              <>
                <p className="text-xs text-navy-400">à partir de</p>
                <p className="text-2xl font-bold text-navy-900">
                  {formatMoney(listing.price, listing.currency)}
                  <span className="text-sm font-normal text-navy-500"> par personne</span>
                </p>
              </>
            ) : (
              <p className="text-sm font-medium text-navy-500">
                Le tarif de ce groupe est réservé aux agences vérifiées.
              </p>
            )}

            <div className={cn("mt-4 flex items-start gap-2 rounded-lg p-3", days <= 21 ? "bg-red-50" : "bg-urgent-50")}>
              <Clock className={cn("mt-0.5 h-4 w-4 shrink-0", days <= 21 ? "text-red-600" : "text-urgent-600")} aria-hidden />
              <div className="text-sm">
                <p className={cn("font-semibold", days <= 21 ? "text-red-700" : "text-urgent-700")}>
                  Relâche le {formatDate(listing.releaseDate)}
                </p>
                <p className="text-navy-600">
                  {days > 0 ? `Dans ${days} jour${days > 1 ? "s" : ""}` : "Aujourd'hui"}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <InterestDialog
                listingId={listing.id}
                agencyName={listing.agency.name}
                disabled={isOwner || user.status !== "VERIFIED"}
                disabledReason={
                  isOwner
                    ? "Cette annonce appartient à votre agence."
                    : "Votre agence doit être vérifiée pour contacter les détenteurs de groupes."
                }
              />
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-xs uppercase tracking-wide text-navy-400">Agence détentrice</p>
            <p className="mt-1 flex items-center gap-2">
              <span className="font-semibold text-navy-900">{listing.agency.name}</span>
              {listing.agency.status === "VERIFIED" && (
                <Badge tone="success">
                  <CheckCircle2 className="h-3 w-3" aria-hidden /> Vérifiée
                </Badge>
              )}
            </p>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-navy-500">Visibilité</dt>
                <dd className="text-right font-medium text-navy-900">{VISIBILITY_LABELS[listing.visibility]}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-navy-500">Mise à jour</dt>
                <dd className="text-right font-medium text-navy-900">{formatDate(listing.updatedAt)}</dd>
              </div>
              {listing.agency.consortium && (
                <div className="flex justify-between gap-4">
                  <dt className="text-navy-500">Réseau</dt>
                  <dd className="text-right font-medium text-navy-900">{listing.agency.consortium}</dd>
                </div>
              )}
            </dl>
          </Card>

          <p className="px-1 text-xs leading-relaxed text-navy-400">
            LastCall ne prend pas part à la réservation ni à la commission. Les conditions
            de collaboration se règlent entre les deux agences, selon les règles du fournisseur.
          </p>
        </aside>
      </div>
    </div>
  );
}
