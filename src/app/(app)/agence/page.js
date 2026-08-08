import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAgency } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Mon agence" };

export default async function AgencePage() {
	const user = await requireAgency();

	const [members, stats, booked] = await Promise.all([
		prisma.agencyMember.findMany({
			where: { agencyId: user.agencyId },
			include: { user: true },
			orderBy: { joinedAt: "asc" },
		}),
		prisma.listing.groupBy({
			by: ["status"],
			where: { agencyId: user.agencyId },
			_count: true,
		}),
		prisma.interestRequest.count({
			where: { listing: { agencyId: user.agencyId }, outcomeBooked: true },
		}),
	]);

	const byStatus = Object.fromEntries(stats.map((s) => [s.status, s._count]));

	return (
		<div className="mx-auto max-w-3xl px-6 py-8">
			<PageHeader
				title={user.agency.name}
				description="Votre équipe et l'activité de l'agence sur LastCall."
			/>

			<div className="mt-6 grid gap-4 sm:grid-cols-3">
				{[
					["Annonces actives", byStatus.ACTIVE ?? 0],
					["Complètes ou relâchées", (byStatus.SOLD_OUT ?? 0) + (byStatus.RELEASED ?? 0)],
					["Réservations déclarées", booked],
				].map(([label, value]) => (
					<Card
						key={label}
						className="p-4"
					>
						<p className="text-2xl font-bold text-navy-900">{value}</p>
						<p className="text-sm text-navy-600">{label}</p>
					</Card>
				))}
			</div>

			<Card className="mt-6 p-5">
				<h2 className="font-semibold text-navy-900">Conseillers</h2>
				<ul className="mt-3 divide-y divide-navy-100">
					{members.map((m) => (
						<li
							key={m.id}
							className="flex items-center justify-between gap-4 py-3"
						>
							<div>
								<p className="text-sm font-medium text-navy-900">
									{m.user.firstName} {m.user.lastName}
								</p>
								<p className="text-xs text-navy-500">
									{m.user.email} · depuis {formatDate(m.joinedAt)}
								</p>
							</div>
							<Badge tone={m.user.status === "VERIFIED" ? "success" : "warning"}>{m.user.status === "VERIFIED" ? "Vérifié" : "En attente"}</Badge>
						</li>
					))}
				</ul>
				<p className="mt-4 text-xs text-navy-400">
					Pour ajouter un conseiller, demandez-lui de créer un compte avec le courriel de l'agence — nous rattacherons les comptes lors de la vérification.
				</p>
			</Card>

			<Card className="mt-4 p-5">
				<h2 className="font-semibold text-navy-900">Informations légales</h2>
				<dl className="mt-3 space-y-2 text-sm">
					<div className="flex justify-between gap-4">
						<dt className="text-navy-500">Type d'identifiant</dt>
						<dd className="font-medium text-navy-900">{user.agency.agencyIdCategory ?? "Non renseigné"}</dd>
					</div>
					<div className="flex justify-between gap-4">
						<dt className="text-navy-500">Identifiant agence</dt>
						<dd className="font-medium text-navy-900">{user.agency.agencyId ?? "Non renseigné"}</dd>
					</div>
					<div className="flex justify-between gap-4">
						<dt className="text-navy-500">Numéro professionnel</dt>
						<dd className="font-medium text-navy-900">{user.agency.licenseNumber ?? "Non renseigné"}</dd>
					</div>
					<div className="flex justify-between gap-4">
						<dt className="text-navy-500">Réseau</dt>
						<dd className="font-medium text-navy-900">{user.agency.consortium ?? "Aucun"}</dd>
					</div>
					<div className="flex justify-between gap-4">
						<dt className="text-navy-500">Statut</dt>
						<dd>
							<Badge tone={user.agency.status === "VERIFIED" ? "success" : "warning"}>
								{user.agency.status === "VERIFIED" ? "Vérifiée" : "En vérification"}
							</Badge>
						</dd>
					</div>
				</dl>
			</Card>

			<p className="mt-6 text-center text-sm text-navy-500">
				<Link
					href="/publier"
					className="font-medium text-urgent-600 hover:underline"
				>
					Publier un nouvel espace
				</Link>
			</p>
		</div>
	);
}
