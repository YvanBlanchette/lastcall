"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import {
  Ship, MapPin, Sparkles, Check, ChevronLeft, ChevronRight,
  Bed, Users, Plus, CheckCircle2, AlertTriangle, Loader2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { createListingAction, uploadListingImageAction } from "@/actions/listings";
import { CURRENCIES, VISIBILITIES, VISIBILITY_LABELS } from "@/lib/validators";
import { cn, formatMoney, daysUntil } from "@/lib/utils";

const STEPS = ["Type de voyage", "Détails du voyage", "Inventaire et prix", "Informations", "Aperçu"];

const TYPES = [
  { value: "CRUISE", label: "Croisière", icon: Ship, hint: "Navire, cabine, itinéraire maritime" },
  { value: "ESCORTED_TOUR", label: "Circuit / groupe terrestre", icon: MapPin, hint: "Circuit accompagné, groupe organisé" },
  { value: "OTHER", label: "Autre", icon: Sparkles, hint: "Séjour, forfait, événement" },
];

const EMPTY = {
  travelType: "", supplierId: "", supplierName: "", title: "", destination: "",
  shipName: "", departureCity: "", departureDate: "", returnDate: "", language: "fr",
  inventoryType: "CABINS", inventoryLeft: "", inventoryTotal: "", cabinCategory: "",
  price: "", currency: "CAD", releaseDate: "", groupBenefits: "", conditions: "",
  commissionSplit: "Ouvert à discuter", notes: "", visibility: "B2B_ONLY",
  soloAvailable: false, guaranteed: false, priceHidden: false, externalId: "",
};

export function PublishWizard({ suppliers, cities }) {
  const [step, setStep] = useState(0);
  const [d, setD] = useState(EMPTY);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [state, formAction] = useFormState(createListingAction, {});

  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));
  const err = (k) => state?.errors?.[k];

  const canAdvance =
    (step === 0 && d.travelType) ||
    (step === 1 && d.title.length >= 4 && d.destination && d.departureCity && d.departureDate) ||
    (step === 2 && d.inventoryLeft && d.price && d.releaseDate) ||
    step === 3;

  async function handleUpload(event) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setUploadError(null);

    for (const file of files.slice(0, 6 - images.length)) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadListingImageAction(fd);
      if (res.error) setUploadError(res.error);
      else setImages((prev) => [...prev, res.image]);
    }
    setUploading(false);
    event.target.value = "";
  }

  const releaseDays = d.releaseDate ? daysUntil(d.releaseDate) : null;

  return (
    <form action={formAction}>
      {/* Toutes les valeurs voyagent avec le formulaire, même celles des étapes
          précédentes : l'utilisateur peut revenir en arrière sans rien perdre. */}
      {Object.entries(d).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={typeof v === "boolean" ? String(v) : v} />
      ))}
      <input type="hidden" name="images" value={JSON.stringify(images)} />

      <ol className="flex items-center gap-2" aria-label="Étapes de publication">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <span
              aria-current={i === step ? "step" : undefined}
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                i < step ? "bg-emerald-500 text-white"
                  : i === step ? "bg-urgent-500 text-white"
                  : "bg-navy-100 text-navy-400"
              )}
            >
              {i < step ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
            </span>
            <span className={cn("hidden truncate text-xs sm:block", i === step ? "font-semibold text-navy-900" : "text-navy-400")}>
              {s}
            </span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-navy-100" aria-hidden />}
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-navy-100">
        {step === 0 && (
          <>
            <h2 className="text-xl font-bold text-navy-900">Quel type d'espace publiez-vous ?</h2>
            <p className="mt-1 text-sm text-navy-500">Choisissez ce qui correspond le mieux à votre groupe.</p>
            <div className="mt-5 space-y-3">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => { set("travelType", t.value); set("inventoryType", t.value === "CRUISE" ? "CABINS" : "SEATS"); }}
                  aria-pressed={d.travelType === t.value}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-4 text-left transition",
                    d.travelType === t.value ? "border-urgent-500 bg-urgent-50" : "border-navy-200 hover:border-navy-400"
                  )}
                >
                  <t.icon className={cn("h-5 w-5", d.travelType === t.value ? "text-urgent-500" : "text-navy-400")} aria-hidden />
                  <span>
                    <span className="block text-sm font-semibold text-navy-900">{t.label}</span>
                    <span className="block text-xs text-navy-500">{t.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-xl font-bold text-navy-900">Parlez-nous de votre voyage</h2>
            <p className="mt-1 text-sm text-navy-500">Les détails principaux du groupe.</p>
            <div className="mt-5 space-y-4">
              <Field label="Fournisseur" htmlFor="fournisseur">
                <Select
                  id="fournisseur"
                  value={d.supplierId}
                  onChange={(e) => set("supplierId", e.target.value)}
                >
                  <option value="">Sélectionnez un fournisseur</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </Field>

              {!d.supplierId && (
                <Field label="…ou saisissez-en un nouveau" htmlFor="nouveauFournisseur"
                  hint="Il sera ajouté au catalogue LastCall.">
                  <Input id="nouveauFournisseur" value={d.supplierName}
                    onChange={(e) => set("supplierName", e.target.value)} placeholder="Ex. Voyages Culturels" />
                </Field>
              )}

              <Field label="Titre du groupe" htmlFor="titre" error={err("title")} required>
                <Input id="titre" value={d.title} onChange={(e) => set("title", e.target.value)}
                  placeholder="Ex. Découverte du Japon au printemps" aria-invalid={Boolean(err("title"))} />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Destination" htmlFor="dest" error={err("destination")} required>
                  <Input id="dest" value={d.destination} onChange={(e) => set("destination", e.target.value)} placeholder="Ex. Japon" />
                </Field>
                <Field label="Navire" htmlFor="navire" hint="Si applicable">
                  <Input id="navire" value={d.shipName} onChange={(e) => set("shipName", e.target.value)} placeholder="Ex. Norwegian Encore" />
                </Field>
                <Field label="Ville de départ" htmlFor="ville" error={err("departureCity")} required>
                  <Input id="ville" list="villes" value={d.departureCity}
                    onChange={(e) => set("departureCity", e.target.value)} placeholder="Ex. Montréal" />
                  <datalist id="villes">
                    {cities.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </Field>
                <Field label="Langue du groupe" htmlFor="langue">
                  <Select id="langue" value={d.language} onChange={(e) => set("language", e.target.value)}>
                    <option value="fr">Français</option>
                    <option value="en">Anglais</option>
                    <option value="bilingue">Bilingue</option>
                  </Select>
                </Field>
                <Field label="Date de départ" htmlFor="depart" error={err("departureDate")} required>
                  <Input id="depart" type="date" value={d.departureDate} onChange={(e) => set("departureDate", e.target.value)} />
                </Field>
                <Field label="Date de retour" htmlFor="retour" error={err("returnDate")}>
                  <Input id="retour" type="date" value={d.returnDate} onChange={(e) => set("returnDate", e.target.value)} />
                </Field>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl font-bold text-navy-900">Qu'est-ce qu'il vous reste ?</h2>
            <p className="mt-1 text-sm text-navy-500">L'inventaire disponible et le prix par personne.</p>
            <div className="mt-5 space-y-4">
              <Field label="Type d'inventaire">
                <div className="grid grid-cols-2 gap-3">
                  {[{ v: "CABINS", l: "Cabines", i: Bed }, { v: "SEATS", l: "Places", i: Users }].map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => set("inventoryType", o.v)}
                      aria-pressed={d.inventoryType === o.v}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition",
                        d.inventoryType === o.v
                          ? "border-urgent-500 bg-urgent-50 text-urgent-700"
                          : "border-navy-200 text-navy-600 hover:border-navy-400"
                      )}
                    >
                      <o.i className="h-4 w-4" aria-hidden /> {o.l}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre disponible" htmlFor="dispo" error={err("inventoryLeft")} required>
                  <Input id="dispo" type="number" min="1" value={d.inventoryLeft}
                    onChange={(e) => set("inventoryLeft", e.target.value)} placeholder="6" />
                </Field>
                <Field label="Inventaire total du groupe" htmlFor="total" hint="Facultatif — sert au taux de remplissage.">
                  <Input id="total" type="number" min="1" value={d.inventoryTotal}
                    onChange={(e) => set("inventoryTotal", e.target.value)} placeholder="30" />
                </Field>
              </div>

              <Field label="Catégorie" htmlFor="cat">
                <Input id="cat" value={d.cabinCategory} onChange={(e) => set("cabinCategory", e.target.value)}
                  placeholder="Ex. Balcon, occupation double" />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Prix par personne" htmlFor="prix" error={err("price")} required>
                  <Input id="prix" type="number" min="0" step="1" value={d.price}
                    onChange={(e) => set("price", e.target.value)} placeholder="2299" />
                </Field>
                <Field label="Devise" htmlFor="devise">
                  <Select id="devise" value={d.currency} onChange={(e) => set("currency", e.target.value)}>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </Field>
              </div>

              <Field label="Date de relâche" htmlFor="release" error={err("releaseDate")} required
                hint="L'annonce est retirée automatiquement à cette date.">
                <Input id="release" type="date" value={d.releaseDate} onChange={(e) => set("releaseDate", e.target.value)} />
              </Field>

              <div className="space-y-2 rounded-lg bg-navy-50 p-4">
                {[
                  ["guaranteed", "Départ garanti"],
                  ["soloAvailable", "Chambre ou cabine solo disponible"],
                  ["priceHidden", "Masquer le tarif aux agences non vérifiées"],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2.5 text-sm text-navy-700">
                    <input
                      type="checkbox"
                      checked={d[key]}
                      onChange={(e) => set(key, e.target.checked)}
                      className="h-4 w-4 rounded border-navy-300 text-urgent-500 focus:ring-urgent-500"
                    />
                    {label}
                  </label>
                ))}
                <p className="pt-1 text-xs text-navy-500">
                  Masquer le tarif protège votre entente fournisseur tout en gardant l'annonce visible.
                </p>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-xl font-bold text-navy-900">Informations complémentaires</h2>
            <p className="mt-1 text-sm text-navy-500">Facultatif — une annonce complète reçoit plus de demandes.</p>
            <div className="mt-5 space-y-4">
              <Field label="Avantages de groupe" htmlFor="avantages">
                <Textarea id="avantages" rows={2} value={d.groupBenefits}
                  onChange={(e) => set("groupBenefits", e.target.value)}
                  placeholder="Ex. cocktail privé, crédit à bord, transfert inclus" />
              </Field>
              <Field label="Conditions" htmlFor="conditions">
                <Textarea id="conditions" rows={2} value={d.conditions}
                  onChange={(e) => set("conditions", e.target.value)}
                  placeholder="Ex. dépôt de 250 $, paiement final 60 jours avant le départ" />
              </Field>
              <Field label="Partage de commission" htmlFor="commission"
                hint="Ce que vous proposez à l'agence qui amène le client. LastCall ne prélève rien.">
                <Select id="commission" value={d.commissionSplit} onChange={(e) => set("commissionSplit", e.target.value)}>
                  {["Ouvert à discuter", "50 / 50", "60 / 40 en faveur de l'agence acheteuse", "Aucun partage", "Selon entente réseau"].map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Visibilité de l'annonce" htmlFor="visibilite"
                hint="Les inventaires sensibles restent réservés aux professionnels vérifiés.">
                <Select id="visibilite" value={d.visibility} onChange={(e) => set("visibility", e.target.value)}>
                  {VISIBILITIES.map((v) => <option key={v} value={v}>{VISIBILITY_LABELS[v]}</option>)}
                </Select>
              </Field>
              <Field label="Référence interne" htmlFor="ext"
                hint="Votre numéro de groupe. Permet de mettre à jour cette annonce lors d'un réimport Excel.">
                <Input id="ext" value={d.externalId} onChange={(e) => set("externalId", e.target.value)} placeholder="GRP-2027-014" />
              </Field>

              <Field label="Images" error={uploadError}>
                <div className="flex flex-wrap gap-3">
                  {images.map((img, i) => (
                    <div key={img.publicId} className="relative">
                      <img src={img.url} alt="" className="h-16 w-20 rounded-lg object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                        className="absolute -right-1.5 -top-1.5 rounded-full bg-navy-900 p-0.5 text-white"
                        aria-label="Retirer l'image"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {images.length < 6 && (
                    <label className="flex h-16 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-navy-300 text-navy-400 hover:border-urgent-400 hover:text-urgent-500">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      <span className="text-[10px]">Ajouter</span>
                      <input type="file" accept="image/*" multiple className="sr-only" onChange={handleUpload} />
                    </label>
                  )}
                </div>
              </Field>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-xl font-bold text-navy-900">Aperçu de votre annonce</h2>
            <p className="mt-1 text-sm text-navy-500">Voici ce que verront les conseillers.</p>

            <div className="mt-5 overflow-hidden rounded-xl ring-1 ring-navy-100">
              <div className="relative h-32 bg-gradient-to-br from-cyan-200 via-sky-400 to-navy-600">
                {images[0] && <img src={images[0].url} alt="" className="h-full w-full object-cover" />}
                {releaseDays !== null && releaseDays <= 21 && (
                  <>
                    <div className="absolute left-3 top-3"><Badge tone="urgent">Release bientôt</Badge></div>
                    <div className="absolute right-3 top-3 rounded-lg bg-white px-2.5 py-1.5 text-center shadow-sm">
                      <div className="text-base font-bold leading-none text-navy-900">{releaseDays}</div>
                      <div className="text-[9px] uppercase leading-tight text-navy-400">jours<br />restants</div>
                    </div>
                  </>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-navy-900">{d.title || "Titre de votre groupe"}</h3>
                <p className="mt-1 text-xs text-navy-500">
                  {TYPES.find((t) => t.value === d.travelType)?.label ?? "Type"} ·{" "}
                  {suppliers.find((s) => s.id === d.supplierId)?.name ?? d.supplierName ?? "Fournisseur"}
                </p>
                <p className="mt-0.5 text-xs text-navy-500">
                  Départ&nbsp;: {d.departureDate || "—"} · {d.departureCity || "—"}
                </p>
                <div className="mt-3 flex items-end justify-between">
                  <span className="text-sm font-semibold text-urgent-600">
                    {d.inventoryLeft || 0} {d.inventoryType === "CABINS" ? "cabines" : "places"} restantes
                  </span>
                  <span className="text-base font-bold text-navy-900">
                    {d.price ? formatMoney(d.price, d.currency) : "—"}
                  </span>
                </div>
              </div>
            </div>

            <ul className="mt-4 space-y-1.5 text-sm">
              {[
                [Boolean(d.title && d.destination && d.departureCity), "Informations principales complétées"],
                [Boolean(d.price && d.inventoryLeft), "Prix et inventaire valides"],
                [Boolean(d.releaseDate), "Date de relâche renseignée"],
                [images.length > 0, "Image ajoutée (améliore la visibilité)"],
              ].map(([ok, txt]) => (
                <li key={txt} className="flex items-center gap-2">
                  {ok ? <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden />
                      : <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />}
                  <span className={ok ? "text-navy-700" : "text-amber-700"}>{txt}</span>
                </li>
              ))}
            </ul>

            {state?.errors && (
              <div role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <p className="font-medium">Corrigez ces points avant de publier :</p>
                <ul className="mt-1 list-inside list-disc">
                  {Object.values(state.errors).map((m) => <li key={m}>{m}</li>)}
                </ul>
              </div>
            )}

            <div className="mt-5 space-y-2">
              <SubmitButton name="intent" value="publish" className="w-full" pendingLabel="Publication…">
                Publier sur LastCall
              </SubmitButton>
              <SubmitButton name="intent" value="draft" variant="ghost" className="w-full" pendingLabel="Enregistrement…">
                Enregistrer en brouillon
              </SubmitButton>
            </div>
          </>
        )}

        {step < 4 && (
          <div className="mt-6 flex items-center justify-between border-t border-navy-100 pt-5">
            <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ChevronLeft className="h-4 w-4" aria-hidden /> Retour
            </Button>
            <Button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
              Suivant <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        )}
      </div>

      <p className="mt-3 text-center text-xs text-navy-400">
        Vos réponses sont conservées si vous revenez en arrière.
      </p>
    </form>
  );
}
