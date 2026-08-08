import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Profil" };

const STATUS = {
	PENDING: ["warning", "Vérification en cours"],
	VERIFIED: ["success", "Vérifié"],
	REJECTED: ["neutral", "Refusé"],
	SUSPENDED: ["neutral", "Suspendu"],
};

export default async function ProfilPage() {
	const user = await requireUser();
	const [tone, label] = STATUS[user.status] ?? STATUS.PENDING;

	const rows = [
		["Nom", `${user.firstName} ${user.lastName}`],
		["Courriel", user.email],
		["Téléphone", user.phone ?? "Non renseigné"],
		["Agence", user.agency?.name ?? "Aucune"],
		["Type d'identifiant", user.agency?.agencyIdCategory ?? "Non renseigné"],
		["Identifiant agence", user.agency?.agencyId ?? "Non renseigné"],
		["Numéro professionnel", user.agency?.licenseNumber ?? "Non renseigné"],
		["Réseau / consortium", user.agency?.consortium ?? "Aucun"],
		["Membre depuis", formatDate(user.createdAt)],
	];

	return (
		<div className="mx-auto max-w-2xl px-6 py-8">
			<PageHeader
				title="Profil"
				description="Vos coordonnées professionnelles et l'état de votre vérification."
			/>

			<Card className="mt-6 p-5">
				<div className="flex items-center justify-between">
					<h2 className="font-semibold text-navy-900">Statut du compte</h2>
					<Badge tone={tone}>{label}</Badge>
				</div>
				{user.status !== "VERIFIED" && (
					<p className="mt-2 text-sm leading-relaxed text-navy-600">
						Un administrateur vérifie votre agence sous 24 h ouvrables. D'ici là, vous pouvez parcourir le marketplace et publier vos propres espaces, mais les
						inventaires réservés aux professionnels vérifiés restent masqués.
					</p>
				)}
			</Card>

			<Card className="mt-4 p-5">
				<h2 className="font-semibold text-navy-900">Vos informations</h2>
				<dl className="mt-3 divide-y divide-navy-100 text-sm">
					{rows.map(([k, v]) => (
						<div
							key={k}
							className="flex justify-between gap-4 py-2.5"
						>
							<dt className="text-navy-500">{k}</dt>
							<dd className="text-right font-medium text-navy-900">{v}</dd>
						</div>
					))}
				</dl>
			</Card>
		</div>
	);
}
