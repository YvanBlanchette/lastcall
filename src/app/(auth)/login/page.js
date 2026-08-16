"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFormState } from "react-dom";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { loginAction } from "@/actions/auth";
import Logo from "@/components/Logo";

function LoginPageForm() {
	const [state, formAction] = useFormState(loginAction, {});
	const next = useSearchParams().get("suivant") ?? "";

	return (
		<div className="w-[70%] rounded-xl bg-white p-8 shadow-sm ring-1 ring-navy-100">
			<div className="flex flex-col items-center justify-center mb-4">
				<Logo
					size="2xl"
					className="mx-auto"
				/>
			</div>
			<h1 className="text-xl font-bold text-navy-900">Se connecter</h1>
			<p className="mt-1 text-sm text-navy-500">Accédez au marketplace et à vos annonces.</p>

			<form
				action={formAction}
				className="mt-6 space-y-4"
			>
				<input
					type="hidden"
					name="suivant"
					value={next}
				/>

				<Field
					label="Courriel professionnel"
					htmlFor="email"
					error={state?.errors?.email}
					required
				>
					<Input
						id="email"
						name="email"
						type="email"
						autoComplete="email"
						placeholder="vous@agence.ca"
					/>
				</Field>

				<Field
					label="Mot de passe"
					htmlFor="password"
					error={state?.errors?.password}
					required
				>
					<Input
						id="password"
						name="password"
						type="password"
						autoComplete="current-password"
					/>
				</Field>

				{state?.errors?._ && (
					<p
						role="alert"
						className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
					>
						{state.errors._}
					</p>
				)}

				<SubmitButton
					className="w-full"
					pendingLabel="Connexion…"
				>
					Se connecter
				</SubmitButton>
			</form>

			<p className="mt-6 text-center text-sm text-navy-500">
				Pas encore de compte ?{" "}
				<Link
					href="/register"
					className="font-medium text-urgent-600 hover:underline"
				>
					Inscrire mon agence
				</Link>
			</p>
		</div>
	);
}

export default function LoginPage() {
	return (
		<Suspense fallback={<div className="w-[70%] rounded-xl bg-white p-8 shadow-sm ring-1 ring-navy-100" />}>
			<LoginPageForm />
		</Suspense>
	);
}
