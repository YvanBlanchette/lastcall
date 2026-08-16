"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, MoreVertical, MoveVertical, Pencil, Save } from "lucide-react";
import {
	uploadAgencyLogoQuickAction,
	uploadAgencyCoverQuickAction,
	uploadUserAvatarQuickAction,
	uploadUserCoverQuickAction,
	updateAgencyCoverPositionQuickAction,
	updateUserCoverPositionQuickAction,
} from "@/actions/public-profile";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const DRAG_SENSITIVITY = 0.65;

export function CoverImageEditor({ type, coverUrl, initialPositionY = 50, editable = false, className = "", profileEditHref = "" }) {
	const toast = useToast();
	const [positionY, setPositionY] = useState(initialPositionY ?? 50);
	const [dragging, setDragging] = useState(false);
	const [dirty, setDirty] = useState(false);
	const [repositionMode, setRepositionMode] = useState(false);
	const [uploadingCover, setUploadingCover] = useState(false);
	const [uploadingLogo, setUploadingLogo] = useState(false);
	const [saving, setSaving] = useState(false);
	const dragState = useRef({ startY: 0, startPosition: 50, height: 1 });
	const coverFileInputRef = useRef(null);
	const logoFileInputRef = useRef(null);

	useEffect(() => {
		setPositionY(initialPositionY ?? 50);
		setDirty(false);
		setRepositionMode(false);
	}, [initialPositionY, coverUrl]);

	const isBusy = uploadingCover || uploadingLogo || saving;

	async function handleCoverUpload(event) {
		const file = event.target.files?.[0];
		if (!file) return;
		event.target.value = "";

		setUploadingCover(true);
		const fd = new FormData();
		fd.append("file", file);
		const action = type === "agent" ? uploadUserCoverQuickAction : uploadAgencyCoverQuickAction;
		const res = await action(fd);
		setUploadingCover(false);

		if (res?.error) {
			toast(res.error, "error");
			return;
		}

		setPositionY(50);
		setDirty(false);
		toast("Couverture mise a jour.");
	}

	async function handleLogoUpload(event) {
		if (type !== "agency" && type !== "agent") return;
		const file = event.target.files?.[0];
		if (!file) return;
		event.target.value = "";

		setUploadingLogo(true);
		const fd = new FormData();
		fd.append("file", file);
		const action = type === "agent" ? uploadUserAvatarQuickAction : uploadAgencyLogoQuickAction;
		const res = await action(fd);
		setUploadingLogo(false);

		if (res?.error) {
			toast(res.error, "error");
			return;
		}

		toast(type === "agent" ? "Photo mise a jour." : "Logo mis a jour.");
	}

	async function savePosition() {
		setSaving(true);
		const fd = new FormData();
		fd.append("coverPositionY", String(positionY));
		const action = type === "agent" ? updateUserCoverPositionQuickAction : updateAgencyCoverPositionQuickAction;
		const res = await action(fd);
		setSaving(false);

		if (res?.error) {
			toast(res.error, "error");
			return;
		}

		setDirty(false);
		toast("Position enregistree.");
	}

	function onPointerDown(event) {
		if (!editable || !coverUrl || !repositionMode || isBusy) return;
		event.preventDefault();
		event.currentTarget.setPointerCapture(event.pointerId);
		dragState.current = {
			startY: event.clientY,
			startPosition: positionY,
			height: event.currentTarget.clientHeight || 1,
		};
		setDragging(true);
	}

	function onPointerMove(event) {
		if (!dragging) return;
		event.preventDefault();
		const deltaY = event.clientY - dragState.current.startY;
		const deltaPercent = (deltaY / dragState.current.height) * 100 * DRAG_SENSITIVITY;
		const nextRaw = dragState.current.startPosition + deltaPercent;
		const next = Math.max(0, Math.min(100, Number(nextRaw.toFixed(1))));
		if (next !== positionY) {
			setPositionY(next);
			setDirty(true);
		}
	}

	function onPointerUp(event) {
		if (!dragging) return;
		event.preventDefault();
		if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
		setDragging(false);
	}

	return (
		<div
			className={cn(
				"relative h-56 bg-gradient-to-br from-cyan-300 via-sky-400 to-navy-700",
				className,
				editable && coverUrl && repositionMode ? "cursor-ns-resize touch-none" : "",
			)}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUp}
			onPointerCancel={onPointerUp}
		>
			{coverUrl && (
				<Image
					src={coverUrl}
					alt="Couverture"
					fill
					sizes="100vw"
					className={cn("object-cover select-none", dragging ? "pointer-events-none" : "")}
					style={{
						objectPosition: `center ${positionY}%`,
						transition: dragging ? "none" : "object-position 140ms ease-out",
					}}
					draggable={false}
				/>
			)}

			{editable && (
				<>
					<div
						className="absolute right-4 top-4 z-10 flex items-center gap-2"
						onPointerDown={(event) => event.stopPropagation()}
					>
						<input
							ref={coverFileInputRef}
							type="file"
							accept="image/*"
							className="sr-only"
							onChange={handleCoverUpload}
							disabled={isBusy}
						/>

						<input
							ref={logoFileInputRef}
							type="file"
							accept="image/*"
							className="sr-only"
							onChange={handleLogoUpload}
							disabled={isBusy}
						/>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type="button"
									className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/90 text-navy-900 shadow-sm hover:bg-white"
									aria-label="Options de la couverture"
								>
									{isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-60"
							>
								<DropdownMenuItem
									onSelect={(event) => {
										event.preventDefault();
										if (isBusy) return;
										coverFileInputRef.current?.click();
									}}
								>
									<ImagePlus className="mr-2 h-4 w-4" />
									Changer la couverture
								</DropdownMenuItem>
								{type === "agency" && (
									<DropdownMenuItem
										onSelect={(event) => {
											event.preventDefault();
											if (isBusy) return;
											logoFileInputRef.current?.click();
										}}
									>
										<ImagePlus className="mr-2 h-4 w-4" />
										Changer le logo
									</DropdownMenuItem>
								)}
								{type === "agent" && (
									<DropdownMenuItem
										onSelect={(event) => {
											event.preventDefault();
											if (isBusy) return;
											logoFileInputRef.current?.click();
										}}
									>
										<ImagePlus className="mr-2 h-4 w-4" />
										Changer la photo
									</DropdownMenuItem>
								)}
								<DropdownMenuItem
									onSelect={(event) => {
										event.preventDefault();
										if (!coverUrl) {
											toast("Ajoutez d'abord une couverture.", "error");
											return;
										}
										setRepositionMode((current) => {
											const next = !current;
											toast(next ? "Mode repositionnement active." : "Mode repositionnement desactive.");
											return next;
										});
									}}
								>
									<MoveVertical className="mr-2 h-4 w-4" />
									Repositionner la couverture
								</DropdownMenuItem>
								{type === "agent" && profileEditHref && (
									<DropdownMenuItem asChild>
										<Link href={profileEditHref}>
											<Pencil className="mr-2 h-4 w-4" />
											Modifier le profil
										</Link>
									</DropdownMenuItem>
								)}
								{type === "agency" && (
									<DropdownMenuItem asChild>
										<Link href="/agence">
											<Pencil className="mr-2 h-4 w-4" />
											Modifier la page agence
										</Link>
									</DropdownMenuItem>
								)}
							</DropdownMenuContent>
						</DropdownMenu>

						{repositionMode && (
							<button
								type="button"
								onClick={savePosition}
								disabled={!coverUrl || !dirty || isBusy}
								className="inline-flex items-center gap-2 rounded-lg bg-white/90 px-3 py-2 text-sm font-medium text-navy-900 shadow-sm hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
							>
								{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
								Enregistrer
							</button>
						)}
					</div>

					{coverUrl && repositionMode && (
						<div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-navy-900/70 px-3 py-1 text-xs font-medium text-white">
							<MoveVertical className="mr-1 inline h-3.5 w-3.5" />
							Glissez verticalement la cover
						</div>
					)}
				</>
			)}
		</div>
	);
}
