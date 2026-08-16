"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useFormState } from "react-dom";
import { Camera, Building2, BadgeCheck, Mail, Phone, MapPin, Globe } from "lucide-react";
import { updateProfileAction, uploadProfilePhotoAction } from "@/actions/profile";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

function initials(firstName, lastName) {
	return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

export function ProfileEditor({ initialProfile, statusTone, statusLabel, memberSinceLabel, orgKind = "AGENCY" }) {
	const isSupplier = orgKind === "SUPPLIER";
	const [state, formAction] = useFormState(updateProfileAction, {});
	const toast = useToast();

	const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl ?? "");
	const [uploading, setUploading] = useState(false);
	const agencyProfileHref = initialProfile.agencyPublicIdentifier
		? `/@${initialProfile.agencyPublicIdentifier}`
		: initialProfile.agencyId
			? `/profil-public/${initialProfile.agencyId}`
			: null;

	useEffect(() => {
		if (state?.message) toast(state.message);
	}, [state, toast]);

	const displayInitials = useMemo(() => initials(initialProfile.firstName, initialProfile.lastName), [initialProfile.firstName, initialProfile.lastName]);

	async function handleAvatarUpload(event) {
		const file = event.target.files?.[0];
		if (!file) return;

		setUploading(true);
		const fd = new FormData();
		fd.append("file", file);
		const res = await uploadProfilePhotoAction(fd);
		setUploading(false);
		event.target.value = "";

		if (res?.error) {
			toast(res.error, "error");
			return;
		}

		setAvatarUrl(res.image.url);
		toast("Photo de profil mise à jour.");
	}

	return (
		<form
			action={formAction}
			className="mt-6 space-y-4"
		>
			<input
				type="hidden"
				name="avatarUrl"
				value={avatarUrl}
			/>

			<Card className="p-5">
				<div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-4">
						<div className="relative">
							{avatarUrl ? (
								<Image
									src={avatarUrl}
									alt="Photo de profil"
									width={80}
									height={80}
									className="h-20 w-20 rounded-2xl object-cover ring-1 ring-navy-200"
								/>
							) : (
								<div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-navy-900 text-xl font-bold text-white ring-1 ring-navy-200">
									{displayInitials}
								</div>
							)}
							<label className="absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-urgent-500 text-white shadow-sm hover:bg-urgent-600">
								<Camera
									className="h-4 w-4"
									aria-hidden
								/>
								<input
									type="file"
									accept="image/*"
									className="sr-only"
									onChange={handleAvatarUpload}
									disabled={uploading}
								/>
							</label>
						</div>

						<div>
							<p className="text-lg font-semibold text-navy-900">
								{initialProfile.userPublicIdentifier ? (
									<Link
										href={`/@${initialProfile.userPublicIdentifier}`}
										className="hover:underline"
									>
										{initialProfile.firstName} {initialProfile.lastName}
									</Link>
								) : (
									<>
										{initialProfile.firstName} {initialProfile.lastName}
									</>
								)}
							</p>
							<p className="text-sm text-navy-500">
								{agencyProfileHref ? (
									<Link
										href={agencyProfileHref}
										className="hover:underline"
									>
										{initialProfile.agencyName}
									</Link>
								) : (
									initialProfile.agencyName
								)}
							</p>
							<div className="mt-2 flex items-center gap-2">
								<Badge tone={statusTone}>{statusLabel}</Badge>
								<span className="text-xs text-navy-400">Membre depuis {memberSinceLabel}</span>
							</div>
						</div>
					</div>

					<div className="rounded-xl bg-navy-50 px-4 py-3 text-sm text-navy-600">
						<p className="font-medium text-navy-800">Profil professionnel</p>
						<p className="mt-1 max-w-xs">Complétez vos informations pour renforcer la confiance des agences partenaires.</p>
					</div>
				</div>
			</Card>

			<Card className="p-5">
				<h2 className="text-base font-semibold text-navy-900">Informations personnelles</h2>
				<div className="mt-4 grid gap-4 sm:grid-cols-2">
					<Field
						label="Identifiant public agent"
						htmlFor="userPublicIdentifier"
						error={state?.errors?.userPublicIdentifier}
						required
						className="sm:col-span-2"
						hint="Utilisé dans l'URL publique: /@identifiant"
					>
						<Input
							id="userPublicIdentifier"
							name="userPublicIdentifier"
							defaultValue={initialProfile.userPublicIdentifier}
							placeholder="ex: marie_duval"
							aria-invalid={Boolean(state?.errors?.userPublicIdentifier)}
						/>
					</Field>

					<Field
						label="Prénom"
						htmlFor="firstName"
						error={state?.errors?.firstName}
						required
					>
						<Input
							id="firstName"
							name="firstName"
							defaultValue={initialProfile.firstName}
							aria-invalid={Boolean(state?.errors?.firstName)}
						/>
					</Field>
					<Field
						label="Nom"
						htmlFor="lastName"
						error={state?.errors?.lastName}
						required
					>
						<Input
							id="lastName"
							name="lastName"
							defaultValue={initialProfile.lastName}
							aria-invalid={Boolean(state?.errors?.lastName)}
						/>
					</Field>
					<Field
						label="Courriel"
						htmlFor="email"
						error={state?.errors?.email}
						required
					>
						<div className="relative">
							<Mail
								className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300"
								aria-hidden
							/>
							<Input
								id="email"
								name="email"
								type="email"
								defaultValue={initialProfile.email}
								className="pl-9"
								aria-invalid={Boolean(state?.errors?.email)}
							/>
						</div>
					</Field>
					<Field
						label="Téléphone"
						htmlFor="phone"
						error={state?.errors?.phone}
					>
						<div className="relative">
							<Phone
								className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300"
								aria-hidden
							/>
							<Input
								id="phone"
								name="phone"
								defaultValue={initialProfile.phone}
								className="pl-9"
								aria-invalid={Boolean(state?.errors?.phone)}
							/>
						</div>
					</Field>
					<Field
						label="Présentation professionnelle"
						htmlFor="bio"
						error={state?.errors?.bio}
						className="sm:col-span-2"
						hint="Décrivez votre expertise, vos destinations favorites et votre approche client."
					>
						<Textarea
							id="bio"
							name="bio"
							rows={4}
							defaultValue={initialProfile.bio}
							placeholder="Ex. Conseiller spécialisé en croisières premium et voyages de groupe en Méditerranée."
							aria-invalid={Boolean(state?.errors?.bio)}
						/>
					</Field>
				</div>
			</Card>

			<Card className="p-5">
				<h2 className="text-base font-semibold text-navy-900">{isSupplier ? "Identité fournisseur" : "Identité agence"}</h2>
				<div className="mt-4 grid gap-4 sm:grid-cols-2">
					<Field
						label={isSupplier ? "Identifiant public fournisseur" : "Identifiant public agence"}
						htmlFor="agencyPublicIdentifier"
						error={state?.errors?.agencyPublicIdentifier}
						required
						className="sm:col-span-2"
						hint="Utilisé dans l'URL publique: /@identifiant"
					>
						<Input
							id="agencyPublicIdentifier"
							name="agencyPublicIdentifier"
							defaultValue={initialProfile.agencyPublicIdentifier}
							placeholder="ex: voyagehorizon"
							aria-invalid={Boolean(state?.errors?.agencyPublicIdentifier)}
						/>
					</Field>

					<Field
						label={isSupplier ? "Nom de l'entreprise" : "Nom de l'agence"}
						htmlFor="agencyName"
						error={state?.errors?.agencyName}
						required
						className="sm:col-span-2"
					>
						<div className="relative">
							<Building2
								className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300"
								aria-hidden
							/>
							<Input
								id="agencyName"
								name="agencyName"
								defaultValue={initialProfile.agencyName}
								className="pl-9"
								aria-invalid={Boolean(state?.errors?.agencyName)}
							/>
						</div>
					</Field>

					{!isSupplier && (
						<>
							<Field
								label="Type d'identifiant"
								htmlFor="agencyIdCategory"
								error={state?.errors?.agencyIdCategory}
							>
								<Select
									id="agencyIdCategory"
									name="agencyIdCategory"
									defaultValue={initialProfile.agencyIdCategory}
									aria-invalid={Boolean(state?.errors?.agencyIdCategory)}
								>
									<option value="">Sélectionner</option>
									<option value="iata">IATA</option>
									<option value="clia">CLIA</option>
									<option value="tids">TIDS</option>
								</Select>
							</Field>

							<Field
								label="Identifiant agence"
								htmlFor="agencyId"
								error={state?.errors?.agencyId}
								required
							>
								<div className="relative">
									<BadgeCheck
										className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300"
										aria-hidden
									/>
									<Input
										id="agencyId"
										name="agencyId"
										defaultValue={initialProfile.agencyId}
										className="pl-9"
										aria-invalid={Boolean(state?.errors?.agencyId)}
									/>
								</div>
							</Field>

							<Field
								label="Numéro professionnel"
								htmlFor="licenseNumber"
								error={state?.errors?.licenseNumber}
							>
								<Input
									id="licenseNumber"
									name="licenseNumber"
									defaultValue={initialProfile.licenseNumber}
									aria-invalid={Boolean(state?.errors?.licenseNumber)}
								/>
							</Field>

							<Field
								label="Réseau / consortium"
								htmlFor="consortium"
								error={state?.errors?.consortium}
							>
								<Input
									id="consortium"
									name="consortium"
									defaultValue={initialProfile.consortium}
									aria-invalid={Boolean(state?.errors?.consortium)}
								/>
							</Field>
						</>
					)}
				</div>
			</Card>

			<Card className="p-5">
				<h2 className="text-base font-semibold text-navy-900">{isSupplier ? "Coordonnées fournisseur" : "Coordonnées agence"}</h2>
				<div className="mt-4 grid gap-4 sm:grid-cols-2">
					<Field
						label="Site web"
						htmlFor="website"
						error={state?.errors?.website}
						hint="Exemple: https://monagence.com"
					>
						<div className="relative">
							<Globe
								className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300"
								aria-hidden
							/>
							<Input
								id="website"
								name="website"
								defaultValue={initialProfile.website}
								className="pl-9"
								aria-invalid={Boolean(state?.errors?.website)}
							/>
						</div>
					</Field>

					<Field
						label="Ville"
						htmlFor="city"
						error={state?.errors?.city}
					>
						<div className="relative">
							<MapPin
								className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300"
								aria-hidden
							/>
							<Input
								id="city"
								name="city"
								defaultValue={initialProfile.city}
								className="pl-9"
								aria-invalid={Boolean(state?.errors?.city)}
							/>
						</div>
					</Field>

					<Field
						label="Province / État"
						htmlFor="province"
						error={state?.errors?.province}
					>
						<Input
							id="province"
							name="province"
							defaultValue={initialProfile.province}
							aria-invalid={Boolean(state?.errors?.province)}
						/>
					</Field>
				</div>
			</Card>

			{state?.errors?._ && <Card className="border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700 ring-0">{state.errors._}</Card>}

			<div className="flex items-center justify-end gap-2 pb-2">
				<Button
					type="button"
					variant="ghost"
					onClick={() => window.location.reload()}
				>
					Annuler
				</Button>
				<SubmitButton
					variant="navy"
					pendingLabel="Enregistrement..."
				>
					Enregistrer les modifications
				</SubmitButton>
			</div>
		</form>
	);
}
