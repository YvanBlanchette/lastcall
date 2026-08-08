import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAgency } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListingRow } from "@/components/listings/listing-row";

export const metadata = { title: "Mes annonces" };

export default async function MesAnnoncesPage({ searchParams }) {
  const user = await requireAgency();

  const where = { agencyId: user.agencyId };
  if (searchParams.filtre === "urgent") {
    where.releaseDate = { lte: new Date(Date.now() + 14 * 86_400_000), gte: new Date() };
    where.status = "ACTIVE";
  }

  const listings = await prisma.listing.findMany({
    where,
    include: {
      supplier: true,
      images: { take: 1, orderBy: { position: "asc" } },
      _count: { select: { requests: true, views: true } },
    },
    orderBy: [{ status: "asc" }, { releaseDate: "asc" }],
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <PageHeader
        title="Mes annonces"
        description="Vos espaces publiés, leur inventaire et leur date de relâche."
        action={
          <Button asChild variant="navy">
            <Link href="/publier"><Plus className="h-4 w-4 text-urgent-400" aria-hidden /> Publier un espace</Link>
          </Button>
        }
      />

      <div className="mt-6 space-y-3">
        {listings.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aucune annonce pour l'instant"
            description="Publiez votre premier espace groupe : il sera visible par tous les conseillers vérifiés du réseau."
            action={<Button asChild><Link href="/publier">Publier un espace</Link></Button>}
          />
        ) : (
          listings.map((l) => <ListingRow key={l.id} listing={l} />)
        )}
      </div>
    </div>
  );
}
