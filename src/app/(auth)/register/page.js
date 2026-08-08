"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { Input, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { registerAction } from "@/actions/auth";
import Logo from "@/components/Logo";

const INITIAL_VALUES = {
	firstName: "",
	lastName: "",
	email: "",
	phone: "",
	password: "",
	agencyName: "",
	agencyIdCategory: "iata",
	agencyId: "",
	licenseNumber: "",
	consortium: "",
};

const STEP_ONE_FIELDS = ["firstName", "lastName", "email", "phone", "password"];
const STEP_TWO_FIELDS = ["agencyName", "agencyIdCategory", "agencyId", "licenseNumber", "consortium"];

export default function RegisterPage() {
	const [state, formAction] = useFormState(registerAction, {});
	const [step, setStep] = useState(1);
	const [values, setValues] = useState(INITIAL_VALUES);
	const [clientErrors, setClientErrors] = useState({});

	useEffect(() => {
		if (!state?.errors) return;

		if (STEP_TWO_FIELDS.some((field) => state.errors[field])) {
			setStep(2);
			return;
		}

		if (STEP_ONE_FIELDS.some((field) => state.errors[field])) {
			setStep(1);
		}
	}, [state]);

	function updateValue(name, value) {
		setValues((current) => ({ ...current, [name]: value }));
		setClientErrors((current) => {
			if (!current[name]) return current;
			const next = { ...current };
			delete next[name];
			return next;
		});
	}

	function validateStepOne() {
		const errors = {};

		if (values.firstName.trim().length < 2) errors.firstName = "Indiquez votre prénom.";
		if (values.lastName.trim().length < 2) errors.lastName = "Indiquez votre nom.";
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "Cette adresse courriel n'est pas valide.";
		if (values.password.length < 10) errors.password = "Le mot de passe doit contenir au moins 10 caractères.";

		return errors;
	}

	function goToStepTwo() {
		const errors = validateStepOne();
		setClientErrors(errors);

		if (Object.keys(errors).length === 0) {
			setStep(2);
		}
	}

	function fieldError(name) {
		return clientErrors[name] ?? state?.errors?.[name];
	}

	return (
		<div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-navy-100 h-[90vh]">
			{/* BRAND */}
			<div className="flex justify-center items-center mb-4">
				<Logo
					size="2xl"
					className="mx-auto"
				/>
			</div>
			<h1 className="text-xl font-bold text-navy-900">Inscrire mon agence</h1>
			<p className="mt-0.5 text-sm text-navy-500">Réservé aux professionnels du voyage. La vérification prend environ 24 h ouvrables.</p>

			{/* FORM */}
			<form
				action={formAction}
				className="mt-4 flex flex-col justify-between max-h-full"
			>
				<div className="space-y-4">
					{step === 1 ? (
						<>
							{/* STEP ONE */}
							<div className="grid gap-4 sm:grid-cols-2">
								<Field
									label="Prénom"
									htmlFor="firstName"
									error={fieldError("firstName")}
									required
								>
									<Input
										id="firstName"
										name="firstName"
										autoComplete="given-name"
										value={values.firstName}
										onChange={(event) => updateValue("firstName", event.target.value)}
									/>
								</Field>
								<Field
									label="Nom"
									htmlFor="lastName"
									error={fieldError("lastName")}
									required
								>
									<Input
										id="lastName"
										name="lastName"
										autoComplete="family-name"
										value={values.lastName}
										onChange={(event) => updateValue("lastName", event.target.value)}
									/>
								</Field>
							</div>

							<Field
								label="Courriel professionnel"
								htmlFor="email"
								error={fieldError("email")}
								required
							>
								<Input
									id="email"
									name="email"
									type="email"
									autoComplete="email"
									placeholder="vous@agence.ca"
									value={values.email}
									onChange={(event) => updateValue("email", event.target.value)}
								/>
							</Field>

							<Field
								label="Téléphone"
								htmlFor="phone"
								error={fieldError("phone")}
							>
								<Input
									id="phone"
									name="phone"
									type="tel"
									autoComplete="tel"
									value={values.phone}
									onChange={(event) => updateValue("phone", event.target.value)}
								/>
							</Field>

							<Field
								label="Mot de passe"
								htmlFor="password"
								error={fieldError("password")}
								required
								hint="Au moins 10 caractères."
							>
								<Input
									id="password"
									name="password"
									type="password"
									autoComplete="new-password"
									value={values.password}
									onChange={(event) => updateValue("password", event.target.value)}
								/>
							</Field>
						</>
					) : (
						<>
							{/* STEP TWO */}
							<Field
								label="Nom de l'agence"
								htmlFor="agencyName"
								error={fieldError("agencyName")}
								required
							>
								<Input
									id="agencyName"
									name="agencyName"
									placeholder="Voyages Horizon"
									value={values.agencyName}
									onChange={(event) => updateValue("agencyName", event.target.value)}
								/>
							</Field>

							<div className="grid gap-4 sm:grid-cols-2">
								<Field
									label="Identifiant de l'agence"
									htmlFor="agencyIdCategory"
									hint="Ou l'équivalent de votre province."
								>
									<Select
										id="agencyIdCategory"
										name="agencyIdCategory"
										value={values.agencyIdCategory}
										onChange={(event) => updateValue("agencyIdCategory", event.target.value)}
									>
										<option value="iata">IATA</option>
										<option value="clia">CLIA</option>
										<option value="tids">TIDS</option>
									</Select>
								</Field>
								<Field
									label="Identification de l'agence"
									htmlFor="agencyId"
									error={fieldError("agencyId")}
									required
								>
									<Input
										id="agencyId"
										name="agencyId"
										placeholder="Ex. 96147796, 96141550…"
										required
										value={values.agencyId}
										onChange={(event) => updateValue("agencyId", event.target.value)}
									/>
								</Field>
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								<Field
									label="Numéro OPC"
									htmlFor="licenseNumber"
									hint="Ou l'équivalent de votre province."
								>
									<Input
										id="licenseNumber"
										name="licenseNumber"
										placeholder="702000"
										value={values.licenseNumber}
										onChange={(event) => updateValue("licenseNumber", event.target.value)}
									/>
								</Field>
								<Field
									label="Réseau / consortium"
									htmlFor="consortium"
								>
									<Input
										id="consortium"
										name="consortium"
										placeholder="Ex. Ensemble, Virtuoso…"
										value={values.consortium}
										onChange={(event) => updateValue("consortium", event.target.value)}
									/>
								</Field>
							</div>
						</>
					)}

					{state?.errors?._ && (
						<p
							role="alert"
							className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
						>
							{state.errors._}
						</p>
					)}
				</div>

				<div className="flex gap-3 mt-6">
					{step === 2 && (
						<button
							type="button"
							onClick={() => setStep(1)}
							className="w-full rounded-lg border border-navy-200 px-4 py-2.5 text-sm font-medium text-navy-700 transition hover:bg-navy-50"
						>
							Retour
						</button>
					)}

					{step === 1 ? (
						<button
							type="button"
							onClick={goToStepTwo}
							className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-orange-600"
						>
							Continuer
						</button>
					) : (
						<SubmitButton
							className="w-full"
							pendingLabel="Création du compte…"
						>
							Créer mon compte
						</SubmitButton>
					)}
				</div>
			</form>

			{/* FOOTER */}
			<p className="mt-3 text-center text-sm text-navy-500">
				Déjà inscrit ?{" "}
				<Link
					href="/login"
					className="font-medium text-urgent-600 hover:underline"
				>
					Se connecter
				</Link>
			</p>
		</div>
	);
}
