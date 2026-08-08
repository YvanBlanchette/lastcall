import Link from "next/link";
import { Bell } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Alertes" };

const HREF = {
  NEW_MATCH: (id) => `/listing/${id}`,
  REQUEST_RECEIVED: () => "/demandes",
  REQUEST_ANSWERED: () => "/demandes",
  LISTING_EXPIRING: () => "/mes-annonces",
};

export default async function AlertesPage() {
  const user = await requireUser();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Consulter la page vaut lecture : le badge ne doit pas rester allumé.
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <PageHeader title="Alertes" description="Ce qui a bougé sur vos recherches et vos annonces." />

      <div className="mt-6 space-y-2">
        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Aucune alerte pour l'instant"
            description="Enregistrez une recherche : vous serez averti dès qu'un espace correspondant est publié."
            action={<Button asChild><Link href="/marketplace">Ouvrir le marketplace</Link></Button>}
          />
        ) : (
          notifications.map((n) => (
            <Card key={n.id} className="p-4">
              <Link href={(HREF[n.type] ?? (() => "/accueil"))(n.entityId)} className="block">
                <p className="text-sm font-medium text-navy-900">{n.title}</p>
                {n.body && <p className="mt-0.5 text-sm text-navy-500">{n.body}</p>}
                <p className="mt-1 text-xs text-navy-400">{formatDate(n.createdAt)}</p>
              </Link>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
