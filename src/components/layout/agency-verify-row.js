"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { verifyAgencyAction } from "@/actions/admin";
import { useToast } from "@/components/ui/toast";

export function AgencyVerifyRow({ agency }) {
	const [pending, start] = useTransition();
	const toast = useToast();

	const agencyIdentifier = agency.agencyId && agency.agencyIdCategory ? `${agency.agencyIdCategory} ${agency.agencyId}` : agency.agencyId || null;

	const decide = (status) => {
		start(async () => {
			const res = await verifyAgencyAction(agency.id, status);
			if (res?.error) toast(res.error, "error");
			else toast(status === "VERIFIED" ? "Agence vérifiée." : "Agence refusée.");
		});
	};

	return (
		<li className="flex flex-wrap items-center justify-between gap-3 py-3">
			<div>
				<p className="text-sm font-medium text-navy-900">{agency.name}</p>
				<p className="text-xs text-navy-500">
					{agencyIdentifier ? `Identifiant ${agencyIdentifier}` : "Aucun identifiant d'agence fourni"}
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
