"use client";

import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import { useEffect, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { SubmitButton } from "@/components/ui/submit-button";
import { uploadImportAction } from "@/actions/imports";

export function ImportUploader() {
  const [state, formAction] = useFormState(uploadImportAction, {});
  const [fileName, setFileName] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (state?.batchId) router.push(`/imports?lot=${state.batchId}`);
  }, [state?.batchId, router]);

  return (
    <form action={formAction} className="space-y-3">
      <label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-navy-200 p-10 text-center transition hover:border-urgent-400">
        <FileSpreadsheet className="h-7 w-7 text-navy-300" aria-hidden />
        <span className="mt-3 text-sm font-medium text-navy-700">
          {fileName ?? "Glissez-déposez votre fichier Excel ici"}
        </span>
        <span className="text-sm text-navy-400">ou cliquez pour parcourir</span>
        <input
          type="file"
          name="file"
          accept=".xlsx,.xls,.csv"
          className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </label>

      {state?.errors?.file && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.errors.file}</p>
      )}

      <SubmitButton className="w-full" pendingLabel="Lecture du fichier…" disabled={!fileName}>
        Vérifier le fichier
      </SubmitButton>
    </form>
  );
}
