import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, Clock, Eye, Search, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";

export const metadata = {
	title: "LastCall — Faites circuler votre inventaire de groupe",
	description: "La marketplace B2B où les professionnels du voyage publient, recherchent et redistribuent les dernières places de leurs groupes confirmés.",
};

const FEATURES = [
	{
		icon: Clock,
		title: "Publiez en moins de deux minutes",
		body: "Les informations essentielles, rien de plus. Un parcours simple pensé pour les conseillers.",
	},
	{
		icon: Eye,
		title: "Rejoignez le bon réseau",
		body: "Votre inventaire devient visible auprès des professionnels qui pourraient déjà avoir le bon client.",
	},
	{
		icon: Search,
		title: "Trouvez avant de recommencer",
		body: "Avant de repartir de zéro, découvrez les groupes confirmés qui ont encore de la disponibilité.",
	},
	{
		icon: ShieldCheck,
		title: "Gardez votre façon de travailler",
		body: "Publier est gratuit. LastCall facilite la connexion sans s’interposer dans votre commission.",
	},
];

const STEPS = [
	{
		number: "01",
		title: "Ajoutez votre groupe",
		body: "Les informations essentielles seulement.",
	},
	{
		number: "02",
		title: "Publiez",
		body: "Votre offre devient visible dans la marketplace.",
	},
	{
		number: "03",
		title: "Recevez de l’intérêt",
		body: "Les conseillers trouvent l’inventaire qui leur manque.",
	},
];

export default function LandingPage() {
	return (
		<main className="min-h-screen overflow-hidden bg-[#f8f8f6] text-slate-950">
			{/* =========================================================
			    HERO
			========================================================= */}
			<section className="relative overflow-hidden">
				{/* Soft background atmosphere */}
				<div
					className="pointer-events-none absolute inset-0"
					aria-hidden="true"
				>
					<div className="absolute -left-48 -top-48 h-[36rem] w-[36rem] rounded-full bg-orange-200/25 blur-[120px]" />
					<div className="absolute -right-48 top-20 h-[40rem] w-[40rem] rounded-full bg-slate-200/60 blur-[130px]" />
				</div>

				{/* HEADER */}
				<Navbar />
				{/* HERO CONTENT */}
				<Hero />
			</section>

			{/* =========================================================
			    SIMPLE BY DESIGN
			========================================================= */}
			<section className="bg-white py-24">
				<div className="mx-auto max-w-7xl px-6">
					<div className="grid gap-14 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
						<div className="max-w-md">
							<p className="text-sm font-semibold text-orange-500">Pensé pour être utilisé</p>

							<h2 className="mt-4 text-4xl font-bold leading-[1.05] tracking-[-0.045em] text-slate-950 sm:text-5xl">
								Moins de friction.
								<br />
								Plus de circulation.
							</h2>

							<p className="mt-5 text-base leading-7 text-slate-500">
								LastCall doit être assez simple pour devenir un réflexe, pas une autre plateforme qu’on remet à plus tard.
							</p>
						</div>

						<div className="grid gap-4 sm:grid-cols-3">
							{STEPS.map((step) => (
								<div
									key={step.number}
									className="rounded-[1.5rem] bg-[#f8f8f6] p-6 ring-1 ring-black/[0.035]"
								>
									<div className="text-xs font-bold text-orange-500">{step.number}</div>

									<h3 className="mt-10 text-base font-bold text-slate-950">{step.title}</h3>

									<p className="mt-2 text-sm leading-6 text-slate-500">{step.body}</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* =========================================================
			    WHY LASTCALL
			========================================================= */}
			<section className="border-y border-slate-200/70 bg-[#f8f8f6] py-24">
				<div className="mx-auto max-w-7xl px-6">
					<div className="max-w-2xl">
						<p className="text-sm font-semibold text-orange-500">Un réseau plus efficace</p>

						<h2 className="mt-4 text-4xl font-bold leading-[1.05] tracking-[-0.045em] text-slate-950 sm:text-5xl">Le client existe peut-être déjà.</h2>

						<p className="mt-5 text-lg leading-8 text-slate-500">
							Il est simplement chez un autre conseiller. LastCall aide les deux côtés du réseau à se trouver.
						</p>
					</div>

					<div className="mt-14 grid gap-px overflow-hidden rounded-[1.75rem] bg-slate-200/70 ring-1 ring-slate-200/70 sm:grid-cols-2 lg:grid-cols-4">
						{FEATURES.map((feature) => (
							<div
								key={feature.title}
								className="group bg-white p-7 transition-colors hover:bg-[#fffdf9]"
							>
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 transition-colors group-hover:bg-orange-500">
									<feature.icon className="h-4.5 w-4.5 text-orange-500 transition-colors group-hover:text-white" />
								</div>

								<h3 className="mt-7 text-base font-bold tracking-[-0.02em] text-slate-950">{feature.title}</h3>

								<p className="mt-3 text-sm leading-6 text-slate-500">{feature.body}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* =========================================================
			    FINAL CTA
			========================================================= */}
			<section className="bg-white px-6 py-20">
				<div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-slate-950 px-8 py-14 text-white sm:px-12 sm:py-16 lg:px-16">
					{/* subtle glow */}
					<div
						className="absolute -right-24 -top-32 h-[28rem] w-[28rem] rounded-full bg-orange-500/20 blur-[100px]"
						aria-hidden="true"
					/>

					<div className="relative flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
						<div className="max-w-3xl">
							<p className="text-sm font-semibold text-orange-400">Avant de relâcher votre inventaire</p>

							<h2 className="mt-5 text-4xl font-bold leading-[1.03] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
								Donnez au réseau
								<br />
								une dernière chance.
							</h2>

							<p className="mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
								Publiez gratuitement vos dernières places et rendez-les visibles aux professionnels qui pourraient déjà avoir le bon client.
							</p>
						</div>

						<Button
							asChild
							size="lg"
							className="h-12 shrink-0 rounded-xl bg-orange-500 px-6 font-semibold text-white shadow-lg shadow-orange-950/20 hover:bg-orange-600"
						>
							<Link href="/register">
								Publier ma première offre
								<ArrowRight className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* =========================================================
			    FOOTER
			========================================================= */}
			<footer className="bg-white px-6 pb-10">
				<div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-slate-200 py-7 text-xs text-slate-400 sm:flex-row">
					<Link
						href="/"
						className="flex items-center gap-2"
					>
						<Image
							src="/images/lastcall-icon--dark.svg"
							alt=""
							width={24}
							height={24}
							className="h-5 w-5"
						/>

						<span className="font-semibold text-slate-600">
							Last
							<span className="text-orange-500">Call</span>
						</span>
					</Link>

					<p>La marketplace B2B des professionnels du voyage.</p>

					<p>© {new Date().getFullYear()} LastCall</p>
				</div>
			</footer>
		</main>
	);
}
