import Link from "next/link";
import { FileText, Inbox, AlertTriangle, TrendingUp, Plus, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser, visibilityScopeFor, canSeePrice } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { ListingCard } from "@/components/listings/listing-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Accueil" };

const QUICK_LINKS = [
	{ href: "/marketplace?type=CRUISE", label: "Croisières" },
	{ href: "/marketplace?type=ESCORTED_TOUR", label: "Circuits" },
	{ href: "/marketplace?ville=Montr%C3%A9al", label: "Départ Montréal" },
	{ href: "/marketplace?langue=fr", label: "Francophone" },
	{ href: "/marketplace?solo=1", label: "Solo" },
	{ href: "/marketplace?release=30", label: "Release < 30 jours" },
];

function Stat({ icon: Icon, tint, value, label, href, action }) {
	return (
		<Card className="p-4">
			<Icon
				className={`h-5 w-5 ${tint}`}
				aria-hidden
			/>
			<p className="mt-2 text-2xl font-bold text-navy-900">{value}</p>
			<p className="text-sm text-navy-600">{label}</p>
			<Link
				href={href}
				className="mt-1 inline-block text-xs font-medium text-urgent-600 hover:underline"
			>
				{action}
			</Link>
		</Card>
	);
}

export default async function AccueilPage() {
	const user = await requireUser();
	const scope = visibilityScopeFor(user);
	const in14days = new Date(Date.now() + 14 * 86_400_000);

	const [active, newRequests, expiring, views, latest] = await Promise.all([
		prisma.listing.count({ where: { agencyId: user.agencyId ?? "", status: "ACTIVE" } }),
		prisma.interestRequest.count({ where: { sellerUserId: user.id, status: "NEW" } }),
		prisma.listing.count({
			where: {
				agencyId: user.agencyId ?? "",
				status: "ACTIVE",
				releaseDate: { lte: in14days, gte: new Date() },
			},
		}),
		prisma.listingView.count({
			where: {
				listing: { agencyId: user.agencyId ?? "" },
				createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) },
			},
		}),
		prisma.listing.findMany({
			where: {
				status: "ACTIVE",
				visibility: { in: scope },
				releaseDate: { gte: new Date() },
				NOT: { agencyId: user.agencyId ?? "" },
			},
			include: { supplier: true, images: { take: 1, orderBy: { position: "asc" } } },
			orderBy: [{ score: "desc" }, { publishedAt: "desc" }],
			take: 4,
		}),
	]);

	return (
		<div className="mx-auto max-w-6xl px-6 py-8">
			<PageHeader
				title={`Bonjour ${user.firstName}`}
				description="Voici ce qui se passe aujourd'hui."
				action={
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
				}
			/>

			<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Stat
					icon={FileText}
					tint="text-urgent-500"
					value={active}
					label="Annonces actives"
					href="/mes-annonces"
					action="Voir mes annonces"
				/>
				<Stat
					icon={Inbox}
					tint="text-blue-600"
					value={newRequests}
					label="Nouvelles demandes"
					href="/demandes"
					action="Voir les demandes"
				/>
				<Stat
					icon={AlertTriangle}
					tint="text-red-500"
					value={expiring}
					label="Relâches dans 14 jours"
					href="/mes-annonces?filtre=urgent"
					action="Voir les détails"
				/>
				<Stat
					icon={TrendingUp}
					tint="text-emerald-600"
					value={views}
					label="Vues cette semaine"
					href="/mes-annonces"
					action="Voir le détail"
				/>
			</div>

			<Card className="mt-6 p-5">
				<h2 className="font-semibold text-navy-900">Que cherchez-vous aujourd&apos;hui ?</h2>
				<form
					action="/marketplace"
					className="mt-3 flex gap-2"
				>
					<div className="relative flex-1">
						<Search
							className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300"
							aria-hidden
						/>
						<input
							name="q"
							aria-label="Rechercher un espace"
							placeholder="Destination, fournisseur, navire, mots-clés…"
							className="h-10 w-full rounded-lg border border-navy-200 bg-white pl-9 pr-3 text-sm placeholder:text-navy-300 focus-visible:border-urgent-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-urgent-500"
						/>
					</div>
					<Button type="submit">Rechercher</Button>
				</form>
				<div className="mt-3 flex flex-wrap gap-2">
					{QUICK_LINKS.map((l) => (
						<Link
							key={l.href}
							href={l.href}
							className="rounded-full border border-navy-200 bg-white px-3 py-1.5 text-sm text-navy-700 transition hover:border-navy-400"
						>
							{l.label}
						</Link>
					))}
				</div>
			</Card>

			<div className="mt-8 flex items-center justify-between">
				<h2 className="font-semibold text-navy-900">Dernières annonces publiées</h2>
				<Link
					href="/marketplace"
					className="text-sm font-medium text-urgent-600 hover:underline"
				>
					Voir tout
				</Link>
			</div>

			{latest.length === 0 ? (
				<Card className="mt-4 p-8 text-center">
					<p className="text-sm text-navy-500">Aucune annonce publiée par une autre agence pour l&apos;instant. Publiez la vôtre pour amorcer le réseau.</p>
				</Card>
			) : (
				<div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{latest.map((l) => (
						<ListingCard
							key={l.id}
							listing={l}
							canSeePrice={canSeePrice(l, user)}
							compact
						/>
					))}
				</div>
			)}
		</div>
	);
}
