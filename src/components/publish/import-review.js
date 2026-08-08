"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { commitImportAction } from "@/actions/imports";
import { useToast } from "@/components/ui/toast";
import { formatMoney } from "@/lib/utils";

/**
 * Écran de validation : on montre ce qui va être publié et ce qui bloque,
 * ligne par ligne, en langage humain.
 */
export function ImportReview({ batch }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const ok = batch.rows.filter((r) => r.errors.length === 0);
  const broken = batch.rows.filter((r) => r.errors.length > 0);

  const commit = () => {
    start(async () => {
      const res = await commitImportAction(batch.id);
      if (res?.error) toast(res.error, "error");
      else {
        toast(`${res.published} annonce${res.published > 1 ? "s" : ""} publiée${res.published > 1 ? "s" : ""}.`);
        router.push("/mes-annonces");
      }
    });
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold text-navy-900">{batch.fileName}</h2>
      <p className="mt-1 text-sm text-navy-500">
        {batch.rowCount} groupe{batch.rowCount > 1 ? "s" : ""} détecté{batch.rowCount > 1 ? "s" : ""} ·{" "}
        {ok.length} prêt{ok.length > 1 ? "s" : ""} à publier
        {broken.length > 0 && ` · ${broken.length} nécessite${broken.length > 1 ? "nt" : ""} votre attention`}
      </p>

      {broken.length > 0 && (
        <div className="mt-5 space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-700">
            <AlertTriangle className="h-4 w-4" aria-hidden /> À corriger dans votre fichier
          </h3>
          {broken.map((row) => (
            <div key={row.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-medium text-navy-900">
                Ligne {row.rowNumber}
                {row.parsed?.title ? ` — ${row.parsed.title}` : ""}
              </p>
              <ul className="mt-1 list-inside list-disc text-sm text-amber-800">
                {row.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          ))}
          <p className="text-xs text-navy-500">
            Corrigez ces lignes dans Excel puis réimportez le fichier. Les lignes valides
            ci-dessous peuvent être publiées dès maintenant.
          </p>
        </div>
      )}

      {ok.length > 0 && (
        <div className="mt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden /> Prêtes à publier
          </h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-navy-400">
                  <th scope="col" className="py-2 pr-4 font-medium">Titre</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Départ</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Restant</th>
                  <th scope="col" className="py-2 font-medium">Prix</th>
                </tr>
              </thead>
              <tbody>
                {ok.map((row) => (
                  <tr key={row.id} className="border-t border-navy-100">
                    <td className="py-2 pr-4 font-medium text-navy-900">{row.parsed.title}</td>
                    <td className="py-2 pr-4 text-navy-600">
                      {new Date(row.parsed.departureDate).toLocaleDateString("fr-CA")}
                    </td>
                    <td className="py-2 pr-4 text-navy-600">
                      {row.parsed.inventoryLeft} {row.parsed.inventoryType === "CABINS" ? "cabines" : "places"}
                    </td>
                    <td className="py-2 text-navy-600">
                      {formatMoney(row.parsed.price, row.parsed.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-2">
        <Button onClick={commit} disabled={pending || ok.length === 0}>
          {pending ? "Publication…" : `Publier ${ok.length} annonce${ok.length > 1 ? "s" : ""}`}
        </Button>
        <Button variant="outline" onClick={() => router.push("/imports")}>Annuler</Button>
      </div>
    </Card>
  );
}
