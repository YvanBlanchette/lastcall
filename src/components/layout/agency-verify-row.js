"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { verifyAgencyAction, verifySupplierAction } from "@/actions/admin";
import { useToast } from "@/components/ui/toast";

export function AgencyVerifyRow({ agency, kind = "AGENCY" }) {
	const [pending, start] = useTransition();
	const toast = useToast();
	const isSupplier = kind === "SUPPLIER";

	const agencyIdentifier = agency.agencyId && agency.agencyIdCategory ? `${agency.agencyIdCategory} ${agency.agencyId}` : agency.agencyId || null;
	const agencyProfileHref = agency.publicIdentifier ? `/@${agency.publicIdentifier}` : `/profil-public/${agency.id}`;

	const decide = (status) => {
		start(async () => {
			const res = isSupplier ? await verifySupplierAction(agency.id, status) : await verifyAgencyAction(agency.id, status);
			if (res?.error) toast(res.error, "error");
			else toast(status === "VERIFIED" ? "Compte vérifié." : "Compte refusé.");
		});
	};

	return (
		<li className="flex flex-wrap items-center justify-between gap-3 py-3">
			<div>
				<p className="text-sm font-medium text-navy-900">
					<Link
						href={agencyProfileHref}
						className="hover:underline"
					>
						{agency.name}
					</Link>
				</p>
				<p className="text-xs text-navy-500">
					{isSupplier
						? agency.category || "Catégorie non précisée"
						: agencyIdentifier
							? `Identifiant ${agencyIdentifier}`
							: "Aucun identifiant d'agence fourni"}
					{agency.licenseNumber ? ` · Permis ${agency.licenseNumber}` : ""}
					{agency.consortium ? ` · ${agency.consortium}` : ""} · inscrite le {agency.createdAtLabel}
				</p>
			</div>
			<div className="flex gap-2">
				<Button
					size="sm"
					disabled={pending}
					onClick={() => decide("VERIFIED")}
				>
					Vérifier
				</Button>
				<Button
					size="sm"
					variant="outline"
					disabled={pending}
					onClick={() => decide("REJECTED")}
				>
					Refuser
				</Button>
			</div>
		</li>
	);
}
