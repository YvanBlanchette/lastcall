"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
	Home,
	Store,
	PlusCircle,
	FileText,
	Inbox,
	Bookmark,
	Upload,
	Building2,
	User,
	HelpCircle,
	Menu,
	X,
	ShieldCheck,
	Users,
	MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "../Logo";

const NAV = [
	{ href: "/accueil", label: "Tableau de bord", icon: Home },
	{ href: "/marketplace", label: "Marketplace", icon: Store },
	// { href: "/publier", label: "Publier un espace", icon: PlusCircle },
	{ href: "/mes-annonces", label: "Annonces", icon: FileText },
	{ href: "/demandes", label: "Demandes", icon: Inbox, badgeKey: "requests" },
	{ href: "/relations", label: "Relations", icon: Users, badgeKey: "relations", agencyOnly: true },
	// { href: "/messagerie", label: "Messagerie", icon: MessageSquare, badgeKey: "messages" },
	{ href: "/recherches", label: "Recherches", icon: Bookmark, agencyOnly: true },
	// { href: "/imports", label: "Imports", icon: Upload },
	// { href: "/agence", label: "Agence", icon: Building2 },
	// { href: "/profil", label: "Profil", icon: User },
];

export function Sidebar({ user, counts = {} }) {
	const pathname = usePathname();
	const [open, setOpen] = useState(false);

	const isSupplier = Boolean(user.supplierId);
	const baseNav = isSupplier ? NAV.filter((item) => !item.agencyOnly) : NAV;
	const items = user.role === "PLATFORM_ADMIN" ? [...baseNav, { href: "/admin", label: "Administration", icon: ShieldCheck }] : baseNav;

	return (
		<>
			<button
				onClick={() => setOpen(true)}
				className="fixed left-4 top-3.5 z-30 rounded-lg p-2 text-navy-600 lg:hidden"
				aria-label="Ouvrir le menu"
			>
				<Menu className="h-5 w-5" />
			</button>

			{open && (
				<div
					className="fixed inset-0 z-40 bg-navy-900/50 lg:hidden"
					onClick={() => setOpen(false)}
					aria-hidden
				/>
			)}

			<aside
				className={"fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between h-full bg-navy-900 p-4 transition-transform lg:static lg:translate-x-0"}
			>
				<div className="flex min-h-0 flex-1 flex-col">
					<div className="shrink-0 flex items-center justify-center mb-6 pt-2">
						<Logo
							theme="dark"
							size="md"
						/>
						{/* <button
						onClick={() => setOpen(false)}
						className="text-navy-300 lg:hidden"
						aria-label="Fermer le menu"
					>
						<X className="h-5 w-5" />
					</button> */}
					</div>

					<nav
						className="mt-4 flex-1 space-y-0.5 overflow-y-auto"
						aria-label="Navigation principale"
					>
						{items.map((item) => {
							const active = pathname === item.href || pathname.startsWith(item.href + "/");
							const count = item.badgeKey ? counts[item.badgeKey] : 0;
							return (
								<Link
									key={item.href}
									href={item.href}
									onClick={() => setOpen(false)}
									aria-current={active ? "page" : undefined}
									className={cn(
										"flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
										"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-urgent-500",
										active ? "bg-urgent-500 font-semibold text-white" : "text-navy-200 hover:bg-navy-800 hover:text-white",
									)}
								>
									<item.icon
										className="h-4 w-4 shrink-0"
										aria-hidden
									/>
									<span className="truncate">{item.label}</span>
									{count > 0 && <span className="ml-auto rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{count}</span>}
								</Link>
							);
						})}
					</nav>
				</div>

				<div className="mt-4 shrink-0">
					<div className="mt-4 border-t border-navy-300 pt-4">
						{user.status !== "VERIFIED" && (
							<p className="mt-3 rounded-lg bg-navy-800 p-2.5 text-xs leading-relaxed text-navy-200">
								{isSupplier
									? "Votre compte fournisseur est en cours de vérification. Vos annonces seront visibles par le réseau dès l'approbation."
									: "Votre agence est en cours de vérification. Les inventaires réservés aux professionnels vérifiés restent masqués d'ici là."}
							</p>
						)}
					</div>

					<Link
						href="/aide"
						className="mt-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-navy-300 hover:text-white"
					>
						<HelpCircle
							className="h-4 w-4"
							aria-hidden
						/>{" "}
						Aide
					</Link>
				</div>
			</aside>
		</>
	);
}
