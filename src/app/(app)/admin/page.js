import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { AgencyVerifyRow } from "@/components/layout/agency-verify-row";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Administration" };

export default async function AdminPage() {
  await requireAdmin();

  const weekAgo = new Date(Date.now() - 7 * 86_400_000);

  const [pendingAgencies, activeListings, unmetSearches, repeatPublishers, bookedCount] =
    await Promise.all([
      prisma.agency.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" } }),
      prisma.listing.count({ where: { status: "ACTIVE" } }),
      prisma.searchEvent.groupBy({
        by: ["query"],
        where: { resultCount: 0, query: { not: null }, createdAt: { gte: weekAgo } },
        _count: true,
        orderBy: { _count: { query: "desc" } },
        take: 8,
      }),
      // La métrique qui compte : combien d'agences reviennent publier d'elles-mêmes.
      prisma.$queryRaw`
        SELECT COUNT(*)::int AS count FROM (
          SELECT "agencyId"
          FROM "Listing"
          WHERE "publishedAt" IS NOT NULL
          GROUP BY "agencyId"
          HAVING COUNT(*) >= 2
             AND MAX("publishedAt") - MIN("publishedAt") > INTERVAL '7 days'
        ) t`,
      prisma.interestRequest.count({ where: { outcomeBooked: true } }),
    ]);

  const repeat = repeatPublishers?.[0]?.count ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <PageHeader title="Administration" description="Vérification des agences et santé du réseau." />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-2xl font-bold text-navy-900">{repeat}</p>
          <p className="text-sm text-navy-600">Agences ayant republié</p>
          <p className="mt-1 text-xs leading-relaxed text-navy-400">
            Au moins deux publications espacées de sept jours. C'est le seul chiffre qui
            indique si l'habitude est en train de naître.
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-navy-900">{activeListings}</p>
          <p className="text-sm text-navy-600">Annonces actives</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-navy-900">{bookedCount}</p>
          <p className="text-sm text-navy-600">Réservations déclarées</p>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <h2 className="font-semibold text-navy-900">Agences en attente de vérification</h2>
        {pendingAgencies.length === 0 ? (
          <p className="mt-2 text-sm text-navy-500">Aucune demande en attente.</p>
        ) : (
          <ul className="mt-3 divide-y divide-navy-100">
            {pendingAgencies.map((a) => (
              <AgencyVerifyRow key={a.id} agency={{ ...a, createdAtLabel: formatDate(a.createdAt) }} />
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-6 p-5">
        <h2 className="font-semibold text-navy-900">Demande non satisfaite (7 derniers jours)</h2>
        <p className="mt-1 text-sm text-navy-500">
          Recherches sans aucun résultat. C'est ce que le réseau cherche et que personne ne publie.
        </p>
        {unmetSearches.length === 0 ? (
          <p className="mt-3 text-sm text-navy-400">Aucune recherche infructueuse cette semaine.</p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {unmetSearches.map((s) => (
              <li key={s.query} className="flex items-center justify-between text-sm">
                <span className="text-navy-700">{s.query}</span>
                <span className="font-semibold text-urgent-600">{s._count} recherches</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
