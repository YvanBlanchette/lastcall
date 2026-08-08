"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Eye, Inbox, Minus, Plus, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { updateInventoryAction, setListingStatusAction } from "@/actions/listings";
import { formatDate, daysUntil, cn } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/validators";
import { useToast } from "@/components/ui/toast";

const STATUS_TONE = {
	ACTIVE: "success",
	DRAFT: "neutral",
	PAUSED: "warning",
	SOLD_OUT: "neutral",
	RELEASED: "neutral",
	EXPIRED: "neutral",
	ARCHIVED: "neutral",
};

/**
 * Mise à jour de l'inventaire directement dans la liste.
 * C'est le geste le plus fréquent d'un détenteur de groupe : il ne doit pas
 * exiger d'ouvrir un formulaire d'édition complet.
 */
export function ListingRow({ listing }) {
	const [left, setLeft] = useState(listing.inventoryLeft);
	const [pending, start] = useTransition();
	const toast = useToast();
	const days = daysUntil(listing.releaseDate);

	const change = (delta) => {
		const next = Math.max(0, left + delta);
		setLeft(next);
		start(async () => {
			const res = await updateInventoryAction(listing.id, next);
			if (res?.error) {
				setLeft(listing.inventoryLeft);
				toast(res.error, "error");
			} else if (next === 0) {
				toast("Annonce marquée complète et retirée du marketplace.");
			}
		});
	};

	const pause = () => {
		start(async () => {
			await setListingStatusAction(listing.id, listing.status === "PAUSED" ? "ACTIVE" : "PAUSED");
			toast(listing.status === "PAUSED" ? "Annonce réactivée." : "Annonce mise en pause.");
		});
	};

	return (
		<Card className="flex flex-wrap items-center gap-4 p-4">
			<Link
				href={`/listing/${listing.id}`}
				className="flex min-w-0 flex-1 items-center gap-4"
			>
				<div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-cyan-200 to-navy-600">
					{listing.images?.[0] && (
						<img
							src={listing.images[0].url}
							alt=""
							className="h-full w-full object-cover"
						/>
					)}
				</div>
				<div className="min-w-0">
					<h3 className="truncate font-semibold text-navy-900">{listing.title}</h3>
					<p className="text-xs text-navy-500">
						{listing.supplier?.name ?? "Sans fournisseur"} · Départ {formatDate(listing.departureDate)}
					</p>
					<p className="mt-1 flex items-center gap-3 text-xs text-navy-400">
						<span className="flex items-center gap-1">
							<Eye
								className="h-3 w-3"
								aria-hidden
							/>{" "}
							{listing._count?.views ?? 0}
						</span>
						<span className="flex items-center gap-1">
							<Inbox
								className="h-3 w-3"
								aria-hidden
							/>{" "}
							{listing._count?.requests ?? 0}
						</span>
					</p>
				</div>
			</Link>

			<div
				className="flex items-center gap-1"
				aria-label="Ajuster l'inventaire restant"
			>
				<button
					onClick={() => change(-1)}
					disabled={pending || left === 0}
					className="flex h-8 w-8 items-center justify-center rounded-lg border border-navy-200 text-navy-600 hover:bg-navy-50 disabled:opacity-40"
					aria-label="Retirer une unité"
				>
					<Minus className="h-3.5 w-3.5" />
				</button>
				<span className="w-12 text-center text-sm font-semibold text-navy-900">{left}</span>
				<button
					onClick={() => change(1)}
					disabled={pending}
					className="flex h-8 w-8 items-center justify-center rounded-lg border border-navy-200 text-navy-600 hover:bg-navy-50 disabled:opacity-40"
					aria-label="Ajouter une unité"
				>
					<Plus className="h-3.5 w-3.5" />
				</button>
			</div>

			<div className="text-right">
				<p className={cn("text-xs", days <= 14 ? "font-semibold text-red-600" : "text-navy-500")}>{days > 0 ? `Relâche dans ${days} j` : "Relâchée"}</p>
				<Link
					href={`/publier?edit=${listing.id}`}
					className="block text-xs text-navy-500 hover:text-navy-900 hover:underline"
				>
					<span className="inline-flex items-center gap-1">
						<Pencil
							className="h-3 w-3"
							aria-hidden
						/>{" "}
						Modifier
					</span>
				</Link>
				<button
					onClick={pause}
					disabled={pending}
					className="text-xs text-navy-400 hover:text-navy-900 hover:underline"
				>
					{listing.status === "PAUSED" ? "Réactiver" : "Mettre en pause"}
				</button>
			</div>

			<Badge tone={STATUS_TONE[listing.status]}>{STATUS_LABELS[listing.status]}</Badge>
		</Card>
	);
}
