import { Inbox } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/card";
import { RequestCard } from "@/components/listings/request-card";
import { toPlain } from "@/lib/utils";

export const metadata = { title: "Mes demandes" };

export default async function DemandesPage() {
	const user = await requireOrg();

	const [received, sent] = await Promise.all([
		prisma.interestRequest.findMany({
			where: { sellerUserId: user.id },
			include: { listing: true, buyerAgency: true, buyer: true, conversation: true },
			orderBy: { createdAt: "desc" },
		}),
		prisma.interestRequest.findMany({
			where: { buyerUserId: user.id },
			include: { listing: { include: { agency: true, ownerSupplier: true } }, conversation: true },
			orderBy: { createdAt: "desc" },
		}),
	]);

	// Prisma Decimal (ex: listing.price) et Date ne peuvent pas traverser
	// Server -> Client tels quels. On sérialise en objet plain.
	const receivedSafe = toPlain(received);
	const sentSafe = toPlain(sent);

	return (
		<div className="page-shell page-shell-md">
			<PageHeader
				title="Mes demandes"
				description="Les mises en relation reçues et envoyées."
			/>

			<section className="mt-6">
				<h2 className="section-title">
					Reçues <span className="font-normal text-navy-400">({receivedSafe.length})</span>
				</h2>
				<div className="mt-3 space-y-3">
					{receivedSafe.length === 0 ? (
						<EmptyState
							icon={Inbox}
							title="Aucune demande reçue"
							description="Quand un conseiller aura un client pour un de vos espaces, sa demande apparaîtra ici."
						/>
					) : (
						receivedSafe.map((r) => (
							<RequestCard
								key={r.id}
								request={r}
								role="seller"
							/>
						))
					)}
				</div>
			</section>

			{sentSafe.length > 0 && (
				<section className="mt-8">
					<h2 className="section-title">
						Envoyées <span className="font-normal text-navy-400">({sentSafe.length})</span>
					</h2>
					<div className="mt-3 space-y-3">
						{sentSafe.map((r) => (
							<RequestCard
								key={r.id}
								request={r}
								role="buyer"
							/>
						))}
					</div>
				</section>
			)}
		</div>
	);
}
