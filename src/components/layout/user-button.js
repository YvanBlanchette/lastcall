"use client";

import Link from "next/link";
import { Building2, ChevronDown, LogOut, Mail, User } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(firstName, lastName) {
	return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

export function UserButton({ user }) {
	const fallback = initials(user.firstName, user.lastName);
	const userProfileHref = user.publicIdentifier ? `/@${user.publicIdentifier}` : `/profil-public/${user.id}`;
	const agencyProfileHref = user.agency ? (user.agency.publicIdentifier ? `/@${user.agency.publicIdentifier}` : `/profil-public/${user.agency.id}`) : null;
	const agencyMenuHref = agencyProfileHref ?? "/agence";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="flex items-center gap-2 rounded-full border border-navy-200 bg-white px-1.5 py-1 text-left hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
					aria-label="Ouvrir le menu utilisateur"
				>
					<Avatar className="h-8 w-8">
						<AvatarImage
							src={user.avatarUrl ?? undefined}
							alt={`${user.firstName} ${user.lastName}`}
						/>
						<AvatarFallback>{fallback}</AvatarFallback>
					</Avatar>
					<ChevronDown
						className="mr-1 h-4 w-4 text-navy-400"
						aria-hidden
					/>
				</button>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				align="end"
				className="w-64"
			>
				<DropdownMenuLabel className="pb-2">
					<p className="truncate text-sm font-semibold text-navy-900">
						{user.publicIdentifier ? (
							<Link
								href={`/@${user.publicIdentifier}`}
								className="hover:underline"
							>
								{user.firstName} {user.lastName}
							</Link>
						) : (
							<>
								{user.firstName} {user.lastName}
							</>
						)}
					</p>
					<p className="truncate text-xs font-normal text-navy-500">{user.email}</p>
					<p className="truncate pt-1 text-xs font-normal text-navy-500">
						{agencyProfileHref ? (
							<Link
								href={agencyProfileHref}
								className="hover:underline"
							>
								{user.agency?.name}
							</Link>
						) : (
							(user.agency?.name ?? "Sans agence")
						)}
					</p>
				</DropdownMenuLabel>

				<DropdownMenuSeparator />

				<DropdownMenuItem asChild>
					<Link
						href={userProfileHref}
						className="cursor-pointer focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
					>
						<User
							className="mr-2 h-4 w-4"
							aria-hidden
						/>
						Profil
					</Link>
				</DropdownMenuItem>

				<DropdownMenuItem asChild>
					<Link
						href={agencyMenuHref}
						className="cursor-pointer focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
					>
						<Building2
							className="mr-2 h-4 w-4"
							aria-hidden
						/>
						Agence
					</Link>
				</DropdownMenuItem>

				<DropdownMenuItem asChild>
					<Link
						href="/messagerie"
						className="cursor-pointer focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
					>
						<Mail
							className="mr-2 h-4 w-4"
							aria-hidden
						/>
						Messagerie
					</Link>
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				<DropdownMenuItem asChild>
					<form
						action={logoutAction}
						className="w-full"
					>
						<button
							type="submit"
							className="flex w-full items-center text-left focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
						>
							<LogOut
								className="mr-2 h-4 w-4"
								aria-hidden
							/>
							Se déconnecter
						</button>
					</form>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
