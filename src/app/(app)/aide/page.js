import Link from "next/link";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Aide" };

const FAQ = [
	{
		q: "LastCall prend-il une part de ma commission ?",
		a: "Non. LastCall rend votre inventaire visible et transmet les demandes. La réservation, la commission et les conditions de collaboration se règlent directement entre les deux agences, selon les règles du fournisseur.",
	},
	{
		q: "Qui voit mes annonces ?",
		a: "Vous choisissez à la publication. « Professionnels vérifiés » est le réglage par défaut : seules les agences dont l'identité et le numéro professionnel ont été validés voient l'annonce. Vous pouvez aussi masquer le tarif tout en gardant l'annonce visible.",
	},
	{
		q: "Est-ce que l'agence acheteuse peut me prendre mon client ?",
		a: "Le client appartient à l'agence qui l'amène. LastCall ne transmet jamais de coordonnées de voyageurs, et l'agence détentrice ne reçoit que la demande professionnelle. Signalez tout manquement : les comptes concernés sont suspendus.",
	},
	{
		q: "Que se passe-t-il à la date de relâche ?",
		a: "L'annonce est retirée automatiquement du marketplace le jour de la relâche. Vous n'avez rien à faire — mais vous recevez un rappel sept jours avant, au cas où vous auriez obtenu une extension.",
	},
	{
		q: "Puis-je réimporter le même fichier Excel ?",
		a: "Oui. Si la colonne external_id est remplie, LastCall reconnaît chaque groupe et met à jour l'inventaire, le prix et la date de relâche au lieu de créer un doublon.",
	},
];

export default function AidePage() {
	return (
		<div className="page-shell page-shell-sm">
			<PageHeader
				title="Aide"
				description="Les questions qui reviennent le plus souvent."
			/>

			<Card className="mt-6 p-5">
				<h2 className="section-title">Modèle d&apos;import</h2>
				<p className="section-subtitle">Le fichier Excel officiel, avec les bonnes colonnes et une ligne d&apos;exemple.</p>
				<Link
					href="/api/imports/template"
					className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-urgent-600 hover:underline"
				>
					<Download
						className="h-4 w-4"
						aria-hidden
					/>{" "}
					Télécharger le modèle
				</Link>
			</Card>

			<div className="mt-6 space-y-3">
				{FAQ.map((item) => (
					<Card
						key={item.q}
						className="p-5"
					>
						<h3 className="font-semibold text-navy-900">{item.q}</h3>
						<p className="mt-1.5 text-sm leading-relaxed text-navy-600">{item.a}</p>
					</Card>
				))}
			</div>
		</div>
	);
}
