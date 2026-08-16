import { Bookmark } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SavedSearchRow } from "@/components/listings/saved-search-row";
import Link from "next/link";

export const metadata = { title: "Recherches sauvegardées" };

export default async function RecherchesPage() {
  const user = await requireUser();

  const searches = await prisma.savedSearch.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="page-shell page-shell-md">
      <PageHeader
        title="Recherches sauvegardées"
        description="Nous vous écrivons dès qu'un espace correspond. Vous n'avez pas à revenir chaque jour."
      />

      <div className="mt-6 space-y-3">
        {searches.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="Aucune recherche enregistrée"
            description="Enregistrez une recherche depuis le marketplace : LastCall vous avertira à chaque nouvelle publication correspondante."
            action={<Button asChild><Link href="/marketplace">Ouvrir le marketplace</Link></Button>}
          />
        ) : (
          searches.map((s) => <SavedSearchRow key={s.id} search={s} />)
        )}
      </div>
    </div>
  );
}
