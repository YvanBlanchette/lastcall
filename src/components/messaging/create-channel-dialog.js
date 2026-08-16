"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { Hash, Plus, X } from "lucide-react";
import { createAgencyChannelAction } from "@/actions/messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToast } from "@/components/ui/toast";

const initialState = {};

export function CreateChannelDialog() {
	const [open, setOpen] = useState(false);
	const [state, formAction] = useFormState(createAgencyChannelAction, initialState);
	const toast = useToast();
	const lastHandledErrorRef = useRef("");

	useEffect(() => {
		const msg = state?.errors?._ || state?.errors?.name;
		if (!msg) return;
		if (lastHandledErrorRef.current === msg) return;
		lastHandledErrorRef.current = msg;
		toast(msg, "error");
	}, [state, toast]);

	return (
		<>
			<Button
				variant="outline"
				className="w-full"
				onClick={() => setOpen(true)}
			>
				<Hash
					className="h-4 w-4"
					aria-hidden
				/>
				Créer un canal
			</Button>

			{open && (
				<div
					className="fixed inset-0 z-50 flex items-end justify-center bg-navy-900/50 p-4 sm:items-center"
					role="dialog"
					aria-modal="true"
					aria-labelledby="titre-creation-canal"
					onClick={(event) => event.target === event.currentTarget && setOpen(false)}
				>
					<div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
						<div className="flex items-start justify-between gap-4">
							<div>
								<h2
									id="titre-creation-canal"
									className="text-lg font-bold text-navy-900"
								>
									Créer un canal d&apos;agence
								</h2>
								<p className="mt-1 text-sm text-navy-500">Tous les agents de l&apos;agence seront automatiquement ajoutés.</p>
							</div>
							<button
								onClick={() => setOpen(false)}
								className="text-navy-400 hover:text-navy-900"
								aria-label="Fermer"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						<form
							action={formAction}
							className="mt-5 space-y-4"
						>
							<div>
								<label
									htmlFor="channelName"
									className="text-sm font-medium text-navy-800"
								>
									Nom du canal
								</label>
								<Input
									id="channelName"
									name="name"
									placeholder="Ex. marketing, offres-vip, equipe-ouest"
									required
									className="mt-1"
								/>
								<p className="mt-1 text-xs text-navy-500">Le canal apparaîtra avec un # en préfixe.</p>
							</div>

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
									pendingLabel="Création..."
								>
									<Plus
										className="h-4 w-4"
										aria-hidden
									/>
									Créer
								</SubmitButton>
							</div>
						</form>
					</div>
				</div>
			)}
		</>
	);
}
