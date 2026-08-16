"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { Link2, Send, X } from "lucide-react";
import { sendRelationRequestToUserAction } from "@/actions/relations";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToast } from "@/components/ui/toast";

const initialState = {};

export function RelationRequestButton({ targetUserId, targetName, className = "" }) {
	const [open, setOpen] = useState(false);
	const [state, formAction] = useFormState(sendRelationRequestToUserAction, initialState);
	const toast = useToast();
	const handledRef = useRef("");

	useEffect(() => {
		if (!state?.ok) return;
		const key = `ok:${state.message || ""}`;
		if (handledRef.current === key) return;
		handledRef.current = key;
		setOpen(false);
		toast(state.message || "Demande envoyee.");
	}, [state, toast]);

	useEffect(() => {
		const error = state?.errors?.targetUserId || state?.error;
		if (!error) return;
		const key = `err:${error}`;
		if (handledRef.current === key) return;
		handledRef.current = key;
		toast(error, "error");
	}, [state, toast]);

	return (
		<>
			<Button
				type="button"
				variant="outline"
				className={className}
				onClick={() => setOpen(true)}
			>
				<Link2
					className="h-4 w-4"
					aria-hidden
				/>
				Envoyer une demande de relation
			</Button>

			{open && (
				<div
					className="fixed inset-0 z-50 flex items-end justify-center bg-navy-900/50 p-4 sm:items-center"
					role="dialog"
					aria-modal="true"
					aria-labelledby="relation-request-title"
					onClick={(event) => event.target === event.currentTarget && setOpen(false)}
				>
					<div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
						<div className="flex items-start justify-between">
							<h2
								id="relation-request-title"
								className="text-lg font-bold text-navy-900"
							>
								Nouvelle demande de relation
							</h2>
							<button
								onClick={() => setOpen(false)}
								className="text-navy-400 hover:text-navy-900"
								aria-label="Fermer"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						<p className="mt-1 text-sm text-navy-500">Votre demande sera envoyee a {targetName}. Ajoutez un message pour contextualiser votre demande.</p>

						<form
							action={formAction}
							className="mt-4 space-y-4"
						>
							<input
								type="hidden"
								name="targetUserId"
								value={targetUserId}
							/>

							<div>
								<label
									htmlFor="relation-message"
									className="text-sm font-medium text-navy-800"
								>
									Message (optionnel)
								</label>
								<Textarea
									id="relation-message"
									name="message"
									rows={4}
									maxLength={500}
									placeholder="Ex: J'ai un groupe sur une destination proche de votre expertise et je souhaite echanger avec vous."
								/>
							</div>

							<SubmitButton
								className="w-full"
								pendingLabel="Envoi..."
							>
								<Send
									className="h-4 w-4"
									aria-hidden
								/>
								Envoyer
							</SubmitButton>
						</form>
					</div>
				</div>
			)}
		</>
	);
}
