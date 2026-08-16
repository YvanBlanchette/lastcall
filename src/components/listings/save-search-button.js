"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { createSavedSearchAction } from "@/actions/saved-searches";
import { useToast } from "@/components/ui/toast";

/** Enregistre les filtres courants pour être alerté des futures publications. */
export function SaveSearchButton({ filters }) {
	const [open, setOpen] = useState(false);
	const [state, formAction] = useFormState(createSavedSearchAction, {});
	const toast = useToast();

	if (state?.ok && open) {
		setOpen(false);
		toast("Recherche enregistrée. Vous serez averti dès qu'un espace correspond.");
	}

	return (
		<>
			<Button
				variant="outline"
				size="sm"
				onClick={() => setOpen(true)}
			>
				<Bookmark
					className="h-4 w-4"
					aria-hidden
				/>{" "}
				Enregistrer cette recherche
			</Button>

			{open && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4"
					role="dialog"
					aria-modal="true"
					onClick={(e) => e.target === e.currentTarget && setOpen(false)}
				>
					<form
						action={formAction}
						className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-xl"
					>
						<h2 className="text-lg font-bold text-navy-900">Enregistrer cette recherche</h2>
						<p className="text-sm text-navy-500">Nous vous écrirons dès qu&apos;une agence publie un espace correspondant à ces critères.</p>

						{Object.entries(filters).map(([k, v]) =>
							v ? (
								<input
									key={k}
									type="hidden"
									name={k}
									value={v}
								/>
							) : null,
						)}

						<Field
							label="Nom de la recherche"
							htmlFor="nom"
							error={state?.errors?.name}
							required
						>
							<Input
								id="nom"
								name="name"
								placeholder="Ex. Japon francophone printemps 2028"
							/>
						</Field>

						<div className="flex gap-2">
							<Button
								type="button"
								variant="outline"
								className="flex-1"
								onClick={() => setOpen(false)}
							>
								Annuler
							</Button>
							<SubmitButton
								className="flex-1"
								pendingLabel="Enregistrement…"
							>
								Enregistrer
							</SubmitButton>
						</div>
					</form>
				</div>
			)}
		</>
	);
}
