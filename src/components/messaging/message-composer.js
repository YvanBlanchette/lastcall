"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { sendMessageAction, uploadMessageImageAction } from "@/actions/messages";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToast } from "@/components/ui/toast";

export function MessageComposer({ conversationId, mentionCandidates = [] }) {
	const toast = useToast();
	const router = useRouter();
	const [image, setImage] = useState(null);
	const [uploading, setUploading] = useState(false);
	const [body, setBody] = useState("");
	const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

	const activeMention = useMemo(() => {
		const match = body.match(/(?:^|\s)@([a-z0-9._-]*)$/i);
		if (!match) return null;
		return {
			query: match[1].toLowerCase(),
			start: body.length - match[0].length,
		};
	}, [body]);

	const mentionSuggestions = useMemo(() => {
		if (!activeMention) return [];
		return mentionCandidates
			.filter((candidate) => {
				const identifier = String(candidate.publicIdentifier || "").toLowerCase();
				const name = String(candidate.name || "").toLowerCase();
				if (!identifier) return false;
				if (!activeMention.query) return true;
				return identifier.includes(activeMention.query) || name.includes(activeMention.query);
			})
			.slice(0, 6);
	}, [activeMention, mentionCandidates]);

	useEffect(() => {
		setActiveSuggestionIndex(mentionSuggestions.length ? 0 : -1);
	}, [mentionSuggestions.length]);

	function insertMention(identifier) {
		if (!activeMention) return;
		const prefix = body.slice(0, activeMention.start);
		const mentionPrefix = prefix && !prefix.endsWith(" ") ? `${prefix} ` : prefix;
		setBody(`${mentionPrefix}@${identifier} `);
		setActiveSuggestionIndex(-1);
	}

	function handleBodyKeyDown(event) {
		if (!activeMention || !mentionSuggestions.length) return;

		if (event.key === "ArrowDown") {
			event.preventDefault();
			setActiveSuggestionIndex((current) => (current + 1) % mentionSuggestions.length);
			return;
		}

		if (event.key === "ArrowUp") {
			event.preventDefault();
			setActiveSuggestionIndex((current) => (current <= 0 ? mentionSuggestions.length - 1 : current - 1));
			return;
		}

		if (event.key === "Enter" || event.key === "Tab") {
			if (activeSuggestionIndex >= 0) {
				event.preventDefault();
				insertMention(mentionSuggestions[activeSuggestionIndex].publicIdentifier);
			}
			return;
		}

		if (event.key === "Escape") {
			event.preventDefault();
			setActiveSuggestionIndex(-1);
		}
	}

	async function handleImageSelect(event) {
		const file = event.target.files?.[0];
		if (!file) return;

		setUploading(true);
		const fd = new FormData();
		fd.append("file", file);
		const res = await uploadMessageImageAction(fd);
		setUploading(false);
		event.target.value = "";

		if (res?.error) {
			toast(res.error, "error");
			return;
		}

		setImage({
			url: res.image.url,
			publicId: res.image.publicId,
		});
	}

	async function handleSend(formData) {
		const res = await sendMessageAction(formData);
		const error = res?.errors?._ ?? res?.errors?.body;
		if (error) {
			toast(error, "error");
			return;
		}

		setBody("");
		setImage(null);
		setActiveSuggestionIndex(-1);
		router.refresh();
	}

	return (
		<form
			action={handleSend}
			className="border-t border-navy-100 p-4"
		>
			<input
				type="hidden"
				name="conversationId"
				value={conversationId}
			/>
			<input
				type="hidden"
				name="imageUrl"
				value={image?.url ?? ""}
			/>
			<input
				type="hidden"
				name="imagePublicId"
				value={image?.publicId ?? ""}
			/>

			{image && (
				<div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-navy-50 p-2">
					<Image
						src={image.url}
						alt="Pièce jointe"
						width={56}
						height={56}
						className="h-14 w-14 rounded-md object-cover"
					/>
					<button
						type="button"
						onClick={() => setImage(null)}
						className="rounded-md p-1 text-navy-500 hover:bg-navy-100 hover:text-navy-800"
						aria-label="Retirer l'image"
					>
						<X
							className="h-4 w-4"
							aria-hidden
						/>
					</button>
				</div>
			)}

			<div className="flex gap-2">
				<Input
					name="body"
					value={body}
					onChange={(event) => setBody(event.target.value)}
					onKeyDown={handleBodyKeyDown}
					placeholder={image ? "Ajoutez un texte (optionnel)..." : "Écrivez votre message..."}
					required={!image}
				/>

				<label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-navy-200 bg-white text-navy-600 hover:bg-navy-50">
					{uploading ? (
						<Loader2
							className="h-4 w-4 animate-spin"
							aria-hidden
						/>
					) : (
						<ImagePlus
							className="h-4 w-4"
							aria-hidden
						/>
					)}
					<input
						type="file"
						accept="image/*"
						className="sr-only"
						onChange={handleImageSelect}
						disabled={uploading}
					/>
				</label>

				<SubmitButton pendingLabel="Envoi...">Envoyer</SubmitButton>
			</div>

			{mentionSuggestions.length > 0 && (
				<div className="mt-2 rounded-lg border border-navy-100 bg-white p-2">
					<p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-navy-400">Mentions</p>
					<div className="space-y-1">
						{mentionSuggestions.map((candidate, index) => (
							<button
								key={candidate.id}
								type="button"
								onMouseEnter={() => setActiveSuggestionIndex(index)}
								onClick={() => insertMention(candidate.publicIdentifier)}
								className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm ${index === activeSuggestionIndex ? "bg-navy-100" : "hover:bg-navy-50"}`}
							>
								<span className="font-medium text-navy-900">@{candidate.publicIdentifier}</span>
								<span className="truncate pl-2 text-xs text-navy-500">{candidate.name}</span>
							</button>
						))}
					</div>
				</div>
			)}
		</form>
	);
}
