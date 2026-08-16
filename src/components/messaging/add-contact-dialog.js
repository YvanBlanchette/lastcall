"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { Plus, Search, Send, X } from "lucide-react";
import { sendRelationRequestAction } from "@/actions/relations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToast } from "@/components/ui/toast";

const initialState = {};

function CandidateRow({ candidate, formAction }) {
	const agencyHref = candidate.agencyPublicIdentifier
		? `/@${candidate.agencyPublicIdentifier}`
		: candidate.agencyId
			? `/profil-public/${candidate.agencyId}`
			: null;

	return (
		<form
			action={formAction}
			className="flex items-center justify-between gap-3 rounded-lg border border-navy-100 bg-white p-3"
		>
			<input
				type="hidden"
				name="email"
				value={candidate.email}
			/>
			<div className="min-w-0">
				<p className="truncate text-sm font-medium text-navy-900">
					{candidate.publicIdentifier ? (
						<Link
							href={`/@${candidate.publicIdentifier}`}
							className="hover:underline"
						>
							{candidate.firstName} {candidate.lastName}
						</Link>
					) : (
						<>
							{candidate.firstName} {candidate.lastName}
						</>
					)}
				</p>
				{candidate.publicIdentifier && (
					<Link
						href={`/@${candidate.publicIdentifier}`}
						className="truncate text-xs font-medium text-urgent-600 hover:underline"
					>
						@{candidate.publicIdentifier}
					</Link>
				)}
				<p className="truncate text-xs text-navy-500">{candidate.email}</p>
				<p className="truncate text-xs text-navy-400">
					{agencyHref ? (
						<Link
							href={agencyHref}
							className="hover:underline"
						>
							{candidate.agencyName || "Agence non précisée"}
						</Link>
					) : (
						candidate.agencyName || "Agence non précisée"
					)}
					{candidate.agencyPublicIdentifier ? ` · @${candidate.agencyPublicIdentifier}` : ""}
				</p>
			</div>
			<SubmitButton
				size="sm"
				pendingLabel="..."
			>
				<Send
					className="h-3.5 w-3.5"
					aria-hidden
				/>
				Envoyer
			</SubmitButton>
		</form>
	);
}

export function AddContactDialog({ candidates }) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [state, formAction] = useFormState(sendRelationRequestAction, initialState);
	const lastHandledResultRef = useRef("");
	const toast = useToast();

	useEffect(() => {
		if (!state?.ok) return;
		const key = `ok:${state.message || ""}`;
		if (lastHandledResultRef.current === key) return;
		lastHandledResultRef.current = key;
		toast(state.message || "Demande de relation envoyee.");
		setOpen(false);
	}, [state, toast]);

	useEffect(() => {
		if (!state?.errors?.email) return;
		const key = `err:${state.errors.email}`;
		if (lastHandledResultRef.current === key) return;
		lastHandledResultRef.current = key;
		toast(state.errors.email, "error");
	}, [state, toast]);

	const filtered = useMemo(() => {
		const needle = query.trim().toLowerCase().replace(/^@+/, "");
		if (!needle) return candidates.slice(0, 12);
		return candidates
			.filter((candidate) => {
				const haystack = [
					candidate.firstName,
					candidate.lastName,
					candidate.email,
					candidate.publicIdentifier,
					candidate.agencyName,
					candidate.agencyPublicIdentifier,
				]
					.filter(Boolean)
					.join(" ")
					.toLowerCase();
				return haystack.includes(needle);
			})
			.slice(0, 20);
	}, [candidates, query]);

	return (
		<>
			<Button
				className="w-full"
				onClick={() => setOpen(true)}
			>
				<Plus
					className="h-4 w-4"
					aria-hidden
				/>
				Ajouter un contact
			</Button>

			{open && (
				<div
					className="fixed inset-0 z-50 flex items-end justify-center bg-navy-900/50 p-4 sm:items-center"
					role="dialog"
					aria-modal="true"
					aria-labelledby="titre-ajout-contact"
					onClick={(event) => event.target === event.currentTarget && setOpen(false)}
				>
					<div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
						<div className="flex items-start justify-between gap-4">
							<div>
								<h2
									id="titre-ajout-contact"
									className="text-lg font-bold text-navy-900"
								>
									Ajouter un contact
								</h2>
								<p className="mt-1 text-sm text-navy-500">Cherchez un agent ou une agence et envoyez une demande de relation.</p>
							</div>
							<button
								onClick={() => setOpen(false)}
								className="text-navy-400 hover:text-navy-900"
								aria-label="Fermer"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						<div className="mt-4 rounded-lg border border-navy-100 bg-navy-50/60 p-3">
							<div className="relative">
								<Search
									className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400"
									aria-hidden
								/>
								<Input
									value={query}
									onChange={(event) => setQuery(event.target.value)}
									placeholder="Rechercher par nom, @identifiant, courriel ou agence"
									className="pl-9"
								/>
							</div>
							<p className="mt-2 text-xs text-navy-500">{filtered.length} resultat(s) affiche(s)</p>
						</div>

						<div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
							{filtered.length === 0 ? (
								<div className="rounded-lg border border-dashed border-navy-200 p-5 text-center text-sm text-navy-500">
									Aucun agent ou agence ne correspond a votre recherche.
								</div>
							) : (
								filtered.map((candidate) => (
									<div key={candidate.id}>
										<CandidateRow
											candidate={candidate}
											formAction={formAction}
										/>
									</div>
								))
							)}
						</div>

						<form
							action={formAction}
							className="mt-5 border-t border-navy-100 pt-4"
						>
							<p className="text-sm font-medium text-navy-800">Ou envoyer avec un courriel direct</p>
							<div className="mt-2 flex gap-2">
								<Input
									name="email"
									type="email"
									placeholder="agent@agence.com"
									required
								/>
								<SubmitButton pendingLabel="Envoi...">Envoyer</SubmitButton>
							</div>
							{state?.errors?.email && <p className="mt-2 text-xs text-red-600">{state.errors.email}</p>}
						</form>
					</div>
				</div>
			)}
		</>
	);
}
