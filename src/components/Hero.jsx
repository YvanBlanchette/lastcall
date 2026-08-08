import { ArrowRight, Check, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import Image from "next/image";

const OFFERS = [
	{
		title: "Méditerranée & îles grecques",
		category: "Croisière",
		date: "18 sept. 2027",
		availability: "8 cabines",
		price: "2 949 $",
		image: "/images/greek-isles-celebrity.webp",
	},
	{
		title: "Alaska · Inside Passage",
		category: "Croisière",
		date: "12 juin 2027",
		availability: "4 cabines",
		price: "3 295 $",
		image: "/images/alaska-princess.webp",
	},
];

const Hero = () => {
	return (
		<div className="relative mx-auto grid min-h-[760px] max-w-7xl items-center gap-14 px-6 pb-24 pt-12 lg:grid-cols-[0.94fr_1.06fr] lg:gap-20">
			{/* LEFT */}
			<div className="relative z-10 max-w-2xl">
				<div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-black/[0.05]">
					<span className="relative flex h-2 w-2">
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-40" />
						<span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
					</span>
					Marketplace B2B pour les professionnels du voyage
				</div>

				<h1 className="mt-8 text-[3.7rem] font-bold leading-[0.96] tracking-[-0.06em] text-slate-950 sm:text-[4.8rem] lg:text-[5.3rem]">
					Des places
					<br />
					à vendre?
					<br />
					<span className="text-orange-500">Faites-les circuler.</span>
				</h1>

				<p className="mt-7 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
					Publiez votre inventaire de groupe en quelques minutes et rendez-le visible aux conseillers qui cherchent déjà ce type de voyage.
				</p>

				{/* CTA */}
				<div className="mt-9 flex flex-col gap-3 sm:flex-row">
					<Button
						asChild
						size="lg"
						className="h-12 rounded-xl bg-orange-500 px-6 font-semibold text-white shadow-lg shadow-orange-500/15 transition-all hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-500/20"
					>
						<Link href="/register">
							Publier une offre
							<ArrowRight className="ml-2 h-4 w-4" />
						</Link>
					</Button>

					<Button
						asChild
						size="lg"
						variant="outline"
						className="h-12 rounded-xl border-slate-200 bg-white px-6 font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
					>
						<Link href="/login">Voir la marketplace</Link>
					</Button>
				</div>

				{/* TRUST */}
				<div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
					<div className="flex items-center gap-2">
						<Check className="h-4 w-4 text-orange-500" />
						Gratuit pour publier
					</div>

					<div className="flex items-center gap-2">
						<Check className="h-4 w-4 text-orange-500" />
						100 % B2B
					</div>

					<div className="flex items-center gap-2">
						<Check className="h-4 w-4 text-orange-500" />
						Aucune commission prélevée
					</div>
				</div>
			</div>

			{/* =====================================================
					    MARKETPLACE PREVIEW
					===================================================== */}
			<div className="relative mx-auto w-full max-w-[650px]">
				{/* Glow */}
				<div
					className="absolute -bottom-12 left-10 right-10 h-40 rounded-full bg-slate-300/40 blur-3xl"
					aria-hidden="true"
				/>

				{/* Browser / App shell */}
				<div className="relative rounded-[1.5rem] bg-white p-3 shadow-[0_35px_90px_-25px_rgba(15,23,42,0.20)] ring-1 ring-black/[0.05]">
					<div className="overflow-hidden rounded-[1.55rem] bg-[#f6f6f4]">
						{/* APP TOP */}
						<div className="flex items-center justify-between border-b border-black/[0.05] bg-white px-5 py-4">
							<div className="flex items-center gap-0">
								<Image
									src="/images/lastcall-icon.svg"
									alt=""
									width={19}
									height={19}
									className="h-8 w-8"
								/>

								<div>
									<p className="text-xs font-extrabold text-marine-500 opacity-60">
										Last<span className="text-orange-500">Call</span>
									</p>
									<p className="text-[10px] font-semibold text-marine-500 opacity-50">Marketplace</p>
								</div>
							</div>

							<div className="h-8 w-8 rounded-full bg-slate-100">
								<Image
									src="/images/avatar.webp"
									alt=""
									width={32}
									height={32}
									className="h-8 w-8 rounded-full object-cover"
								/>
							</div>
						</div>

						{/* CONTENT */}
						<div className="p-4 sm:p-5">
							<div className="flex items-end justify-between gap-4">
								<div>
									<p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Inventaire</p>

									<h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-slate-950">Places disponibles</h2>
								</div>

								<button className="rounded-xl bg-slate-950 px-4 py-2.5 text-[11px] font-semibold text-white shadow-sm">+ Publier</button>
							</div>

							{/* SEARCH */}
							<div className="mt-5 flex items-center gap-3 rounded-xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-black/[0.04]">
								<Search className="h-4 w-4 shrink-0 text-slate-400" />

								<span className="flex-1 truncate text-xs text-slate-400">Destination, date, croisière...</span>

								<span className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-medium text-slate-500">Filtres</span>
							</div>

							{/* OFFER CARDS */}
							<div className="mt-4 grid gap-3 sm:grid-cols-2">
								{OFFERS.map((offer) => (
									<div
										key={offer.title}
										className="cursor-pointer group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.05] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/[0.07]"
									>
										<div className="relative h-40 overflow-hidden">
											<Image
												src={offer.image}
												alt={offer.title}
												fill
												sizes="(min-width: 640px) 300px, 90vw"
												className="object-cover"
											/>

											<div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

											<div className="absolute left-3 top-3">
												<span className="rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-semibold text-slate-700 shadow-sm backdrop-blur">
													Groupe confirmé
												</span>
											</div>
										</div>

										<div className="p-4">
											<p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-orange-500">{offer.category}</p>

											<h3 className="mt-1.5 min-h-[40px] text-sm font-bold leading-5 text-slate-900">{offer.title}</h3>

											<p className="mt-1 text-[11px] text-slate-400">{offer.date}</p>

											<div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3">
												<div>
													<p className="text-[9px] text-slate-400">Disponible</p>

													<p className="mt-0.5 text-xs font-semibold text-slate-700">{offer.availability}</p>
												</div>

												<div className="text-right">
													<p className="text-[9px] text-slate-400">À partir de</p>

													<p className="mt-0.5 text-sm font-bold text-orange-500">{offer.price}</p>
												</div>
											</div>
										</div>
									</div>
								))}
							</div>

							{/* PUBLISH PROMPT */}
							<div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-orange-200/60 bg-orange-50/70 px-4 py-3">
								<div>
									<p className="text-xs font-semibold text-orange-800">Vous avez encore de la place?</p>

									<p className="mt-0.5 text-[10px] text-orange-700/65">Publiez votre groupe en moins de 2 minutes.</p>
								</div>

								<ArrowRight className="h-4 w-4 shrink-0 text-orange-500" />
							</div>
						</div>
					</div>
				</div>

				{/* FLOATING CARD */}
				<div className="absolute -bottom-7 -left-6 hidden rounded-2xl bg-white px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.13)] ring-1 ring-black/[0.04] sm:block">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
							<Sparkles className="h-4 w-4 text-orange-500" />
						</div>

						<div>
							<p className="text-[10px] text-slate-400">Nouvelle correspondance</p>

							<p className="mt-0.5 text-xs font-semibold text-slate-800">3 conseillers intéressés</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
export default Hero;
