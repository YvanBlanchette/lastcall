"use client";

import { useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { uploadAgencyLogoQuickAction, uploadUserAvatarQuickAction } from "@/actions/public-profile";
import { useToast } from "@/components/ui/toast";

export function PublicProfileEditor({ type }) {
	const toast = useToast();
	const [uploading, setUploading] = useState("");

	async function runUpload(kind, action, event) {
		const file = event.target.files?.[0];
		if (!file) return;
		event.target.value = "";

		setUploading(kind);
		const fd = new FormData();
		fd.append("file", file);
		const res = await action(fd);
		setUploading("");

		if (res?.error) {
			toast(res.error, "error");
			return;
		}

		toast("Image mise a jour.");
	}

	if (type === "agent") {
		return (
			<div className="flex flex-wrap gap-2">
				<label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white/90 px-3 py-2 text-sm font-medium text-navy-900 shadow-sm hover:bg-white">
					{uploading === "user-avatar" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
					Changer la photo
					<input
						type="file"
						accept="image/*"
						className="sr-only"
						onChange={(event) => runUpload("user-avatar", uploadUserAvatarQuickAction, event)}
					/>
				</label>
			</div>
		);
	}

	return (
		<div className="flex flex-wrap gap-2">
			<label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white/90 px-3 py-2 text-sm font-medium text-navy-900 shadow-sm hover:bg-white">
				{uploading === "agency-logo" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
				Changer le logo
				<input
					type="file"
					accept="image/*"
					className="sr-only"
					onChange={(event) => runUpload("agency-logo", uploadAgencyLogoQuickAction, event)}
				/>
			</label>
		</div>
	);
}
