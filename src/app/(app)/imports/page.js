import Link from "next/link";
import { FileSpreadsheet, Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportUploader } from "@/components/publish/import-uploader";
import { ImportReview } from "@/components/publish/import-review";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Imports" };

const STATUS_LABELS = {
	UPLOADED: "Reçu",
	PARSING: "Lecture en cours",
	NEEDS_REVIEW: "À vérifier",
	COMPLETED: "Terminé",
	FAILED: "Échec",
};

export default async function ImportsPage({ searchParams }) {
	const user = await requireOrg();
	const ownerWhere = user.supplierId ? { supplierId: user.supplierId } : { agencyId: user.agencyId };

	const [batches, pending] = await Promise.all([
		prisma.importBatch.findMany({
			where: ownerWhere,
			orderBy: { createdAt: "desc" },
			take: 10,
		}),
		searchParams.lot
			? prisma.importBatch.findUnique({
					where: { id: searchParams.lot },
					include: { rows: { orderBy: { rowNumber: "asc" } } },
				})
			: null,
	]);

	return (
		<div className="page-shell page-shell-lg">
			<PageHeader
				title="Imports"
				description="Publiez plusieurs groupes d'un coup à partir d'un fichier Excel."
			/>

			{pending && (user.supplierId ? pending.supplierId === user.supplierId : pending.agencyId === user.agencyId) ? (
				<div className="mt-6">
					<ImportReview batch={pending} />
				</div>
			) : (
				<Card className="mt-6 p-6">
					<h2 className="section-title">Importez plusieurs groupes</h2>
					<p className="section-subtitle">Utilisez le modèle LastCall : les colonnes y sont déjà nommées correctement.</p>
					<div className="mt-4">
						<ImportUploader />
					</div>
					<Link
						href="/api/imports/template"
						className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-urgent-600 hover:underline"
					>
						<Download
							className="h-4 w-4"
							aria-hidden
						/>{" "}
						Télécharger le modèle Excel LastCall
					</Link>
				</Card>
			)}

			<Card className="mt-6">
				<CardHeader>
					<CardTitle>Vos imports récents</CardTitle>
				</CardHeader>
				{batches.length === 0 ? (
					<p className="p-5 text-sm text-navy-500">Aucun import pour l&apos;instant. Vos fichiers apparaîtront ici avec leur résultat.</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="text-left text-xs uppercase tracking-wide text-navy-400">
									<th
										scope="col"
										className="px-5 py-2 font-medium"
									>
										Fichier
									</th>
									<th
										scope="col"
										className="px-5 py-2 font-medium"
									>
										Date
									</th>
									<th
										scope="col"
										className="px-5 py-2 font-medium"
									>
										Statut
									</th>
									<th
										scope="col"
										className="px-5 py-2 font-medium"
									>
										Résultat
									</th>
								</tr>
							</thead>
							<tbody>
								{batches.map((b) => (
									<tr
										key={b.id}
										className="border-t border-navy-100"
									>
										<td className="px-5 py-3 font-medium text-navy-900">
											{b.status === "NEEDS_REVIEW" ? (
												<Link
													href={`/imports?lot=${b.id}`}
													className="hover:underline"
												>
													{b.fileName}
												</Link>
											) : (
												b.fileName
											)}
										</td>
										<td className="px-5 py-3 text-navy-500">{formatDate(b.createdAt)}</td>
										<td className="px-5 py-3">
											<span
												className={`rounded px-2 py-0.5 text-xs font-semibold ${
													b.status === "COMPLETED"
														? "bg-emerald-50 text-emerald-700"
														: b.status === "FAILED"
															? "bg-red-50 text-red-700"
															: "bg-amber-50 text-amber-700"
												}`}
											>
												{STATUS_LABELS[b.status]}
											</span>
										</td>
										<td className="px-5 py-3 text-navy-600">
											{b.successCount} sur {b.rowCount}
											{b.errorCount > 0 && ` · ${b.errorCount} à corriger`}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</Card>

			<Card className="mt-6 p-5">
				<div className="flex gap-3">
					<FileSpreadsheet
						className="h-5 w-5 shrink-0 text-navy-400"
						aria-hidden
					/>
					<div className="text-sm text-navy-600">
						<p className="font-medium text-navy-900">Réimporter le même fichier met à jour vos annonces</p>
						<p className="mt-1 leading-relaxed">
							Si la colonne <code className="rounded bg-navy-100 px-1">external_id</code> est remplie, LastCall reconnaît le groupe et met à jour
							l&apos;inventaire, le prix et la date de relâche au lieu de créer un doublon.
						</p>
					</div>
				</div>
			</Card>
		</div>
	);
}
