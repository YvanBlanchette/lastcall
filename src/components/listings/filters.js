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
      if (v === null || v === "" ) next.delete(k);
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: new FormData(e.currentTarget).get("q") });
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" aria-hidden />
        <input
          name="q"
          defaultValue={params.get("q") ?? ""}
          placeholder="Rechercher une destination, un navire, un fournisseur…"
          aria-label="Rechercher"
          className="h-11 w-full rounded-lg border border-navy-200 bg-white pl-9 pr-4 text-sm text-navy-900 placeholder:text-navy-300 focus-visible:border-urgent-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-urgent-500"
        />
        {pending && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-navy-300" aria-hidden />
        )}
      </form>

      <div className="flex flex-wrap items-center gap-2">
        {QUICK.map((f) => {
          const active = params.get(f.key) === f.value;
          return (
            <button
              key={f.label}
              onClick={() => toggle(f.key, f.value)}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-urgent-500",
                active
                  ? "border-navy-900 bg-navy-900 text-white"
                  : "border-navy-200 bg-white text-navy-700 hover:border-navy-400"
              )}
            >
              {f.label}
            </button>
          );
        })}

        <details className="relative">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-navy-200 bg-white px-3 py-1.5 text-sm text-navy-700 hover:border-navy-400">
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden /> Plus de filtres
          </summary>
          <div className="absolute left-0 z-10 mt-2 w-72 space-y-3 rounded-xl border border-navy-100 bg-white p-4 shadow-lg">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-navy-700">Fournisseur</span>
              <select
                defaultValue={params.get("fournisseur") ?? ""}
                onChange={(e) => update({ fournisseur: e.target.value })}
                className="h-9 w-full rounded-lg border border-navy-200 px-2 text-sm"
              >
                <option value="">Tous</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-navy-700">Départ à partir du</span>
              <input
                type="date"
                defaultValue={params.get("departA") ?? ""}
                onChange={(e) => update({ departA: e.target.value })}
                className="h-9 w-full rounded-lg border border-navy-200 px-2 text-sm"
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
                className="h-9 w-full rounded-lg border border-navy-200 px-2 text-sm"
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
              className="w-full rounded-lg border border-navy-200 py-1.5 text-sm text-navy-600 hover:bg-navy-50"
            >
              Effacer les filtres
            </button>
          </div>
        </details>

        <div className="ml-auto flex items-center gap-2 text-sm">
          <label htmlFor="tri" className="text-navy-500">Trier par</label>
          <select
            id="tri"
            defaultValue={params.get("tri") ?? "pertinence"}
            onChange={(e) => update({ tri: e.target.value })}
            className="h-9 rounded-lg border border-navy-200 bg-white px-2 text-sm font-medium text-navy-900"
          >
            <option value="pertinence">Pertinence</option>
            <option value="release">Release imminente</option>
            <option value="recent">Plus récent</option>
            <option value="prix">Prix croissant</option>
            <option value="depart">Date de départ</option>
          </select>
        </div>
      </div>
    </div>
  );
}
