import { Inbox } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAgency } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/card";
import { RequestCard } from "@/components/listings/request-card";

export const metadata = { title: "Mes demandes" };

export default async function DemandesPage() {
  const user = await requireAgency();

  const [received, sent] = await Promise.all([
    prisma.interestRequest.findMany({
      where: { sellerUserId: user.id },
      include: { listing: true, buyerAgency: true, buyer: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.interestRequest.findMany({
      where: { buyerUserId: user.id },
      include: { listing: { include: { agency: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <PageHeader
        title="Mes demandes"
        description="Les mises en relation reçues et envoyées."
      />

      <section className="mt-8">
        <h2 className="font-semibold text-navy-900">
          Reçues <span className="font-normal text-navy-400">({received.length})</span>
        </h2>
        <div className="mt-3 space-y-3">
          {received.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Aucune demande reçue"
              description="Quand un conseiller aura un client pour un de vos espaces, sa demande apparaîtra ici."
            />
          ) : (
            received.map((r) => <RequestCard key={r.id} request={r} role="seller" />)
          )}
        </div>
      </section>

      {sent.length > 0 && (
        <section className="mt-10">
          <h2 className="font-semibold text-navy-900">
            Envoyées <span className="font-normal text-navy-400">({sent.length})</span>
          </h2>
          <div className="mt-3 space-y-3">
            {sent.map((r) => <RequestCard key={r.id} request={r} role="buyer" />)}
          </div>
        </section>
      )}
    </div>
  );
}
