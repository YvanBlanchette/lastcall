"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import { Building2, Camera, Globe, MapPin, Phone, Mail, Shield, UserPlus, UserX } from "lucide-react";
import { addAgencyAgentAction, removeAgencyAgentAction, updateAgencyAction, uploadAgencyLogoAction } from "@/actions/agency";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

function statusTone(status) {
	if (status === "VERIFIED") return "success";
	if (status === "PENDING") return "warning";
	return "neutral";
}

function statusLabel(status) {
	if (status === "VERIFIED") return "Vérifié";
	if (status === "PENDING") return "En attente";
	if (status === "REJECTED") return "Refusé";
	if (status === "SUSPENDED") return "Suspendu";
	return status;
}

export function AgencyManager({ agency, members, canManage, currentUserId }) {
	const toast = useToast();
	const router = useRouter();
	const [saveState, saveAction] = useFormState(updateAgencyAction, {});
	const [addState, addAction] = useFormState(addAgencyAgentAction, {});
	const [removingId, setRemovingId] = useState(null);
	const [pendingRemove, startRemove] = useTransition();
	const [logoUrl, setLogoUrl] = useState(agency.logoUrl ?? "");
	const [uploadingLogo, setUploadingLogo] = useState(false);
	const agencyProfileHref = agency.publicIdentifier ? `/@${agency.publicIdentifier}` : `/profil-public/${agency.id}`;

	useEffect(() => {
		if (saveState?.message) {
			toast(saveState.message);
			router.refresh();
		}
	}, [saveState, toast, router]);

	useEffect(() => {
		if (addState?.message) {
			toast(addState.message);
			router.refresh();
		}
	}, [addState, toast, router]);

	async function onLogoChange(event) {
		const file = event.target.files?.[0];
		if (!file) return;

		setUploadingLogo(true);
		const fd = new FormData();
		fd.append("file", file);
		const res = await uploadAgencyLogoAction(fd);
		setUploadingLogo(false);
		event.target.value = "";

		if (res?.error) {
			toast(res.error, "error");
			return;
		}

		setLogoUrl(res.image.url);
		toast("Logo prêt. N'oubliez pas d'enregistrer.");
	}

	function removeMember(memberId) {
		setRemovingId(memberId);
		startRemove(async () => {
			const res = await removeAgencyAgentAction(memberId);
			setRemovingId(null);
			if (res?.error) {
				toast(res.error, "error");
				return;
			}
			toast("Agent retiré de l'agence.");
			router.refresh();
		});
	}

	return (
		<div className="mt-4 space-y-4">
			{/* AGENCY HEADER */}
			<Card className="p-5">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-4">
						<div className="relative">
							{logoUrl ? (
								<Image
									src={logoUrl}
									alt="Logo agence"
									width={80}
									height={80}
									className="h-20 w-20 rounded-2xl object-cover ring-1 ring-navy-200"
								/>
							) : (
								<div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-navy-100 text-navy-500 ring-1 ring-navy-200">
									<Building2
										className="h-8 w-8"
										aria-hidden
									/>
								</div>
							)}
							{canManage && (
								<label className="absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-urgent-500 text-white shadow-sm hover:bg-urgent-600">
									<Camera
										className="h-4 w-4"
										aria-hidden
									/>
									<input
										type="file"
										accept="image/*"
										className="sr-only"
										onChange={onLogoChange}
										disabled={uploadingLogo}
									/>
								</label>
							)}
						</div>

						<div>
							<h2 className="text-lg font-semibold text-navy-900">
								<Link
									href={agencyProfileHref}
									className="hover:underline"
								>
									{agency.name}
								</Link>
							</h2>
							<p className="text-sm text-navy-500">Agence professionnelle sur LastCall</p>
							<div className="mt-2 flex flex-wrap items-center gap-2">
								<Badge tone={statusTone(agency.status)}>{statusLabel(agency.status)}</Badge>
								<Badge tone="neutral">{agency.country}</Badge>
								{canManage ? <Badge tone="success">Admin</Badge> : <Badge tone="warning">Lecture seule</Badge>}
							</div>
						</div>
					</div>

					{!canManage && (
						<div className="rounded-lg bg-navy-50 px-4 py-3 text-sm text-navy-600">
							Seuls les administrateurs de l&apos;agence peuvent modifier ces informations.
						</div>
					)}
				</div>
			</Card>

			{/* AGENCY INFO FORM */}
			<Card className="p-5">
				<h3 className="font-semibold text-navy-900">Informations de l&apos;agence</h3>
				<form
					action={saveAction}
					className="mt-4 space-y-4"
				>
					<input
						type="hidden"
						name="logoUrl"
						value={logoUrl}
					/>

					<div className="grid gap-4 sm:grid-cols-2">
						<Field
							label="Identifiant public agence"
							htmlFor="publicIdentifier"
							error={saveState?.errors?.publicIdentifier}
							required
							className="sm:col-span-2"
							hint="Utilisé dans l'URL publique: /@identifiant"
						>
							<Input
								id="publicIdentifier"
								name="publicIdentifier"
								defaultValue={agency.publicIdentifier}
								disabled={!canManage}
								placeholder="ex: voyagehorizon"
								aria-invalid={Boolean(saveState?.errors?.publicIdentifier)}
							/>
						</Field>

						<Field
							label="Description de l'agence"
							htmlFor="description"
							error={saveState?.errors?.description}
							className="sm:col-span-2"
							hint="Cette description apparaîtra sur votre page agence."
						>
							<Textarea
								id="description"
								name="description"
								rows={4}
								defaultValue={agency.description}
								disabled={!canManage}
								placeholder="Présentez votre agence, vos spécialités et votre valeur ajoutée."
							/>
						</Field>

						<Field
							label="Nom de l'agence"
							htmlFor="name"
							error={saveState?.errors?.name}
							required
							className="sm:col-span-2"
						>
							<Input
								id="name"
								name="name"
								defaultValue={agency.name}
								disabled={!canManage}
								aria-invalid={Boolean(saveState?.errors?.name)}
							/>
						</Field>

						<Field
							label="Type d'identifiant"
							htmlFor="agencyIdCategory"
							error={saveState?.errors?.agencyIdCategory}
						>
							<Select
								id="agencyIdCategory"
								name="agencyIdCategory"
								defaultValue={agency.agencyIdCategory}
								disabled={!canManage}
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
							error={saveState?.errors?.agencyId}
							required
						>
							<Input
								id="agencyId"
								name="agencyId"
								defaultValue={agency.agencyId}
								disabled={!canManage}
								aria-invalid={Boolean(saveState?.errors?.agencyId)}
							/>
						</Field>

						<Field
							label="Numéro professionnel"
							htmlFor="licenseNumber"
							error={saveState?.errors?.licenseNumber}
						>
							<Input
								id="licenseNumber"
								name="licenseNumber"
								defaultValue={agency.licenseNumber}
								disabled={!canManage}
							/>
						</Field>

						<Field
							label="Réseau / consortium"
							htmlFor="consortium"
							error={saveState?.errors?.consortium}
						>
							<Input
								id="consortium"
								name="consortium"
								defaultValue={agency.consortium}
								disabled={!canManage}
							/>
						</Field>

						<Field
							label="Courriel de contact"
							htmlFor="contactEmail"
							error={saveState?.errors?.contactEmail}
						>
							<div className="relative">
								<Mail
									className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300"
									aria-hidden
								/>
								<Input
									id="contactEmail"
									name="contactEmail"
									type="email"
									defaultValue={agency.contactEmail}
									className="pl-9"
									disabled={!canManage}
								/>
							</div>
						</Field>

						<Field
							label="Téléphone de contact"
							htmlFor="contactPhone"
							error={saveState?.errors?.contactPhone}
						>
							<div className="relative">
								<Phone
									className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300"
									aria-hidden
								/>
								<Input
									id="contactPhone"
									name="contactPhone"
									defaultValue={agency.contactPhone}
									className="pl-9"
									disabled={!canManage}
								/>
							</div>
						</Field>

						<Field
							label="Site web"
							htmlFor="website"
							error={saveState?.errors?.website}
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
									defaultValue={agency.website}
									className="pl-9"
									disabled={!canManage}
								/>
							</div>
						</Field>

						<Field
							label="Ville"
							htmlFor="city"
							error={saveState?.errors?.city}
						>
							<div className="relative">
								<MapPin
									className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300"
									aria-hidden
								/>
								<Input
									id="city"
									name="city"
									defaultValue={agency.city}
									className="pl-9"
									disabled={!canManage}
								/>
							</div>
						</Field>

						<Field
							label="Province / État"
							htmlFor="province"
							error={saveState?.errors?.province}
						>
							<Input
								id="province"
								name="province"
								defaultValue={agency.province}
								disabled={!canManage}
							/>
						</Field>

						<Field
							label="Pays (2 lettres)"
							htmlFor="country"
							error={saveState?.errors?.country}
						>
							<Input
								id="country"
								name="country"
								defaultValue={agency.country}
								maxLength={2}
								disabled={!canManage}
							/>
						</Field>
					</div>

					{saveState?.errors?._ && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{saveState.errors._}</p>}

					{canManage && (
						<div className="flex justify-end">
							<SubmitButton
								variant="navy"
								pendingLabel="Enregistrement..."
							>
								Enregistrer les modifications
							</SubmitButton>
						</div>
					)}
				</form>
			</Card>

			{/* TEAM MANAGEMENT */}
			<Card className="p-5">
				<div className="flex items-center justify-between gap-3">
					<h3 className="font-semibold text-navy-900">Équipe agence</h3>
					<Badge tone="neutral">{members.length} membres</Badge>
				</div>

				<ul className="mt-4 divide-y divide-navy-100">
					{members.map((m) => (
						<li
							key={m.id}
							className="flex items-center justify-between gap-4 py-3"
						>
							<div>
								<p className="text-sm font-medium text-navy-900">
									{m.user.publicIdentifier ? (
										<Link
											href={`/@${m.user.publicIdentifier}`}
											className="hover:underline"
										>
											{m.user.firstName} {m.user.lastName}
										</Link>
									) : (
										<>
											{m.user.firstName} {m.user.lastName}
										</>
									)}
								</p>
								<p className="text-xs text-navy-500">{m.user.email}</p>
								<div className="mt-1 flex flex-wrap items-center gap-2">
									<Badge tone={m.role === "AGENCY_ADMIN" ? "success" : "neutral"}>{m.role === "AGENCY_ADMIN" ? "Admin" : "Conseiller"}</Badge>
									{m.isPrimary && <Badge tone="warning">Principal</Badge>}
									<Badge tone={statusTone(m.user.status)}>{statusLabel(m.user.status)}</Badge>
								</div>
							</div>

							{canManage && m.userId !== currentUserId && !m.isPrimary && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => removeMember(m.id)}
									disabled={pendingRemove && removingId === m.id}
								>
									<UserX
										className="h-3.5 w-3.5"
										aria-hidden
									/>
									{pendingRemove && removingId === m.id ? "Retrait..." : "Retirer"}
								</Button>
							)}
						</li>
					))}
				</ul>

				{canManage && (
					<form
						action={addAction}
						className="mt-5 rounded-xl border border-navy-200 bg-navy-50/50 p-4"
					>
						<p className="text-sm font-medium text-navy-900">Ajouter un agent existant</p>
						<p className="mt-1 text-xs text-navy-500">L&apos;utilisateur doit déjà avoir un compte LastCall.</p>

						<div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
							<Field
								label="Courriel"
								htmlFor="agentEmail"
								error={addState?.errors?.email}
								className="sm:col-span-1"
							>
								<Input
									id="agentEmail"
									name="email"
									type="email"
									placeholder="agent@agence.com"
									aria-invalid={Boolean(addState?.errors?.email)}
								/>
							</Field>

							<Field
								label="Rôle"
								htmlFor="agentRole"
								error={addState?.errors?.role}
							>
								<Select
									id="agentRole"
									name="role"
									defaultValue="ADVISOR"
								>
									<option value="ADVISOR">Conseiller</option>
									<option value="AGENCY_ADMIN">Administrateur</option>
								</Select>
							</Field>

							<div className="self-end">
								<SubmitButton
									variant="navy"
									pendingLabel="Ajout..."
								>
									<UserPlus
										className="h-4 w-4"
										aria-hidden
									/>
									Ajouter
								</SubmitButton>
							</div>
						</div>

						{addState?.errors?._ && <p className="mt-2 text-sm text-red-700">{addState.errors._}</p>}
					</form>
				)}

				{!canManage && (
					<p className="mt-4 rounded-lg bg-navy-50 px-3 py-2 text-sm text-navy-600">
						Vous pouvez consulter l&apos;équipe, mais la gestion des membres est réservée aux administrateurs d&apos;agence.
					</p>
				)}
			</Card>

			<Card className="p-4">
				<div className="flex items-start gap-2 text-sm text-navy-600">
					<Shield
						className="mt-0.5 h-4 w-4 text-navy-400"
						aria-hidden
					/>
					<p>La gestion du logo, des informations légales et des membres est protégée et journalisée dans l&apos;audit.</p>
				</div>
			</Card>
		</div>
	);
}
