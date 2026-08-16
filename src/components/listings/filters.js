"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const QUICK = [
	{ key: "type", value: "CRUISE", label: "Croisières" },
	{ key: "type", value: "ESCORTED_TOUR", label: "Circuits" },
	{ key: "ville", value: "Montréal", label: "Départ Montréal" },
	{ key: "langue", value: "fr", label: "Francophone" },
	{ key: "solo", value: "1", label: "Solo" },
	{ key: "release", value: "30", label: "Release < 30 jours" },
];

export function MarketplaceFilters({ suppliers = [] }) {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const [pending, start] = useTransition();

	const update = (patch) => {
		const next = new URLSearchParams(params.toString());
		for (const [k, v] of Object.entries(patch)) {
			if (v === null || v === "") next.delete(k);
			else next.set(k, v);
		}
		next.delete("page");
		start(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
	};

	const toggle = (key, value) => {
		update({ [key]: params.get(key) === value ? null : value });
	};

	return (
		<div className="space-y-4">
			{/* SEARCH SLOT */}
			<form
				onSubmit={(e) => {
					e.preventDefault();
					update({ q: new FormData(e.currentTarget).get("q") });
				}}
				className="relative"
			>
				<Search
					className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300"
					aria-hidden
				/>
				<input
					name="q"
					defaultValue={params.get("q") ?? ""}
					placeholder="Rechercher une destination, un navire, un fournisseur…"
					aria-label="Rechercher"
					className="h-12 w-full rounded-xl border border-navy-200 bg-white pl-10 pr-10 text-sm text-navy-900 placeholder:text-navy-300 shadow-sm focus-visible:border-urgent-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-urgent-500"
				/>
				{pending && (
					<Loader2
						className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-navy-300"
						aria-hidden
					/>
				)}
			</form>

			{/* SORT SLOT */}
			<div className="rounded-2xl border border-navy-100 bg-navy-50/70 p-3">
				<label
					htmlFor="tri"
					className="mb-2 block text-xs font-semibold uppercase tracking-wide text-navy-500"
				>
					Trier par
				</label>
				<select
					id="tri"
					defaultValue={params.get("tri") ?? "pertinence"}
					onChange={(e) => update({ tri: e.target.value })}
					className="h-11 w-full rounded-xl border border-navy-200 bg-white px-3 text-sm font-medium text-navy-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-urgent-500"
				>
					<option value="pertinence">Pertinence</option>
					<option value="release">Release imminente</option>
					<option value="recent">Plus récent</option>
					<option value="prix">Prix croissant</option>
					<option value="depart">Date de départ</option>
				</select>
			</div>

			{/* QUICK FILTERS SLOT */}
			<div>
				<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-500">Filtres rapides</p>
				<div className="grid grid-cols-2 gap-2">
					{QUICK.map((f) => {
						const active = params.get(f.key) === f.value;
						return (
							<button
								key={f.label}
								onClick={() => toggle(f.key, f.value)}
								aria-pressed={active}
								className={cn(
									"min-h-11 rounded-2xl border px-3 py-2 text-sm text-left leading-tight transition",
									"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-urgent-500",
									active ? "border-navy-900 bg-navy-900 text-white" : "border-navy-200 bg-white text-navy-700 hover:border-navy-400",
								)}
							>
								{f.label}
							</button>
						);
					})}
				</div>
			</div>

			{/* ADVANCED FILTERS SLOT */}
			<details className="rounded-2xl border border-navy-100 bg-white">
				<summary className="flex w-full cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-navy-700">
					<span className="flex items-center gap-2">
						<SlidersHorizontal
							className="h-4 w-4"
							aria-hidden
						/>
						Plus de filtres
					</span>
					<span className="text-navy-400">+</span>
				</summary>
				<div className="space-y-3 border-t border-navy-100 p-4">
					<label className="block text-sm">
						<span className="mb-1 block font-medium text-navy-700">Fournisseur</span>
						<select
							defaultValue={params.get("fournisseur") ?? ""}
							onChange={(e) => update({ fournisseur: e.target.value })}
							className="h-10 w-full rounded-xl border border-navy-200 px-3 text-sm"
						>
							<option value="">Tous</option>
							{suppliers.map((s) => (
								<option
									key={s.id}
									value={s.id}
								>
									{s.name}
								</option>
							))}
						</select>
					</label>

					<label className="block text-sm">
						<span className="mb-1 block font-medium text-navy-700">Départ à partir du</span>
						<input
							type="date"
							defaultValue={params.get("departA") ?? ""}
							onChange={(e) => update({ departA: e.target.value })}
							className="h-10 w-full rounded-xl border border-navy-200 px-3 text-sm"
						/>
					</label>

					<label className="block text-sm">
						<span className="mb-1 block font-medium text-navy-700">Prix maximum</span>
						<input
							type="number"
							min="0"
							step="100"
							defaultValue={params.get("prixMax") ?? ""}
							onChange={(e) => update({ prixMax: e.target.value })}
							className="h-10 w-full rounded-xl border border-navy-200 px-3 text-sm"
							placeholder="7000"
						/>
					</label>

					<label className="flex items-center gap-2 text-sm text-navy-700">
						<input
							type="checkbox"
							defaultChecked={params.get("garanti") === "1"}
							onChange={(e) => update({ garanti: e.target.checked ? "1" : null })}
							className="h-4 w-4 rounded border-navy-300"
						/>
						Départs garantis seulement
					</label>

					<button
						onClick={() => start(() => router.push(pathname))}
						className="w-full rounded-xl border border-navy-200 py-2 text-sm font-medium text-navy-600 hover:bg-navy-50"
					>
						Effacer les filtres
					</button>
				</div>
			</details>
		</div>
	);
}
