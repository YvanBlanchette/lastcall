import Link from "next/link";
import { FileText, Plus, Upload } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/auth";
import { listingOwnerWhere } from "@/lib/org";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListingRow } from "@/components/listings/listing-row";
import { toPlain } from "@/lib/utils";

export const metadata = { title: "Mes annonces" };

export default async function MesAnnoncesPage({ searchParams }) {
	const user = await requireOrg();

	const where = listingOwnerWhere(user);
	if (searchParams.filtre === "urgent") {
		where.releaseDate = { lte: new Date(Date.now() + 14 * 86_400_000), gte: new Date() };
		where.status = "ACTIVE";
	}

	const listings = await prisma.listing.findMany({
		where,
		include: {
			supplier: true,
			images: { take: 1, orderBy: { position: "asc" } },
			author: { select: { id: true, firstName: true, lastName: true, publicIdentifier: true } },
			_count: { select: { requests: true, views: true } },
		},
		orderBy: [{ status: "asc" }, { releaseDate: "asc" }],
	});

	// Empêche l'envoi de Prisma Decimal/Date bruts vers un composant client.
	const listingsSafe = toPlain(listings);

	return (
		<div className="page-shell page-shell-lg">
			<PageHeader
				title="Mes annonces"
				description="Vos espaces publiés, leur inventaire et leur date de relâche."
				action={
					<div className="flex gap-2">
						<Button
							asChild
							variant=""
						>
							<Link href="/import">
								<Upload
									className="h-4 w-4 text-urgent-400"
									aria-hidden
								/>{" "}
								Importer
							</Link>
						</Button>
						<Button
							asChild
							variant="navy"
						>
							<Link href="/publier">
								<Plus
									className="h-4 w-4 text-urgent-400"
									aria-hidden
								/>{" "}
								Publier un espace
							</Link>
						</Button>
					</div>
				}
			/>

			<div className="mt-6 space-y-3">
				{listingsSafe.length === 0 ? (
					<EmptyState
						icon={FileText}
						title="Aucune annonce pour l'instant"
						description="Publiez votre premier espace groupe : il sera visible par tous les conseillers vérifiés du réseau."
						action={
							<Button asChild>
								<Link href="/publier">Publier un espace</Link>
							</Button>
						}
					/>
				) : (
					listingsSafe.map((l) => (
						<ListingRow
							key={l.id}
							listing={l}
						/>
					))
				)}
			</div>
		</div>
	);
}
