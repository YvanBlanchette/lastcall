"use client";

import Link from "next/link";
import { useTransition, useState } from "react";
import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { toggleAlertAction, deleteSavedSearchAction } from "@/actions/saved-searches";
import { formatMoney, cn } from "@/lib/utils";
import { TRAVEL_TYPE_LABELS } from "@/lib/validators";
import { useToast } from "@/components/ui/toast";

const LANGS = { fr: "Français", en: "Anglais", bilingue: "Bilingue" };

export function SavedSearchRow({ search }) {
  const [enabled, setEnabled] = useState(search.alertsEnabled);
  const [pending, start] = useTransition();
  const toast = useToast();

  const criteria = [
    search.destination,
    search.travelType && TRAVEL_TYPE_LABELS[search.travelType],
    search.language && LANGS[search.language],
    search.departureCity,
    search.priceMax && `max ${formatMoney(search.priceMax)}`,
    search.soloOnly && "Solo",
    search.guaranteedOnly && "Départ garanti",
  ].filter(Boolean);

  const query = new URLSearchParams(
    Object.entries({
      q: search.destination ?? "",
      type: search.travelType ?? "",
      langue: search.language ?? "",
      ville: search.departureCity ?? "",
      prixMax: search.priceMax ?? "",
      solo: search.soloOnly ? "1" : "",
      garanti: search.guaranteedOnly ? "1" : "",
    }).filter(([, v]) => v)
  );

  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
      <div className="min-w-0">
        <Link href={`/marketplace?${query}`} className="font-semibold text-navy-900 hover:underline">
          {search.name}
        </Link>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {criteria.map((c) => (
            <span key={c} className="rounded-full bg-navy-100 px-2 py-0.5 text-xs text-navy-600">{c}</span>
          ))}
          {criteria.length === 0 && <span className="text-xs text-navy-400">Tous les espaces</span>}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm">
          <span className="font-bold text-urgent-600">{search.matchCount}</span>
          <span className="text-navy-500"> correspondance{search.matchCount > 1 ? "s" : ""}</span>
        </span>

        <button
          role="switch"
          aria-checked={enabled}
          aria-label="Recevoir les alertes"
          disabled={pending}
          onClick={() => {
            const next = !enabled;
            setEnabled(next);
            start(async () => {
              await toggleAlertAction(search.id, next);
              toast(next ? "Alertes activées." : "Alertes désactivées.");
            });
          }}
          className={cn("relative h-6 w-11 rounded-full transition", enabled ? "bg-urgent-500" : "bg-navy-200")}
        >
          <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all", enabled ? "left-5" : "left-0.5")} />
        </button>

        <button
          onClick={() => start(() => deleteSavedSearchAction(search.id))}
          disabled={pending}
          className="text-navy-300 hover:text-red-600"
          aria-label="Supprimer cette recherche"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}
