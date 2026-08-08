"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { createInterestRequestAction } from "@/actions/requests";
import { useToast } from "@/components/ui/toast";

export function InterestDialog({ listingId, agencyName, disabled, disabledReason }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createInterestRequestAction, {});
  const toast = useToast();

  if (state?.ok && open) {
    setOpen(false);
    toast("Demande envoyée à l'agence détentrice.");
  }

  if (disabled) {
    return (
      <div>
        <Button className="w-full" disabled>J'ai un client intéressé</Button>
        <p className="mt-2 text-center text-xs text-navy-400">{disabledReason}</p>
      </div>
    );
  }

  return (
    <>
      <Button className="w-full" onClick={() => setOpen(true)}>
        J'ai un client intéressé
      </Button>
      <p className="mt-2 text-center text-xs text-navy-400">
        Votre demande est transmise à {agencyName}. Aucune coordonnée n'est partagée avant son accord.
      </p>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-navy-900/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titre-demande"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <h2 id="titre-demande" className="text-lg font-bold text-navy-900">
                Envoyer une demande
              </h2>
              <button onClick={() => setOpen(false)} className="text-navy-400 hover:text-navy-900" aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-sm text-navy-500">
              {agencyName} reçoit votre demande et décide de la suite. Vos clients restent les vôtres.
            </p>

            <form action={formAction} className="mt-4 space-y-4">
              <input type="hidden" name="listingId" value={listingId} />

              <Field label="Nombre de voyageurs" htmlFor="pax" error={state?.errors?.numberOfTravelers} required>
                <Input id="pax" name="numberOfTravelers" type="number" min="1" defaultValue="2" />
              </Field>

              <Field label="Message" htmlFor="msg" error={state?.errors?.message}
                hint="Décrivez la situation de vos clients : dates, catégorie souhaitée, échéance de décision.">
                <Textarea
                  id="msg"
                  name="message"
                  rows={3}
                  placeholder="J'ai des clients prêts à déposer cette semaine. L'inventaire est-il toujours disponible ?"
                />
              </Field>

              {state?.errors?._ && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {state.errors._}
                </p>
              )}

              <SubmitButton className="w-full" pendingLabel="Envoi…">
                Envoyer la demande
              </SubmitButton>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
