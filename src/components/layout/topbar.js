import Link from "next/link";
import { Bell } from "lucide-react";
import { UserButton } from "@/components/layout/user-button";

export function Topbar({ user, counts = {} }) {
	return (
		<header className="sticky top-0 z-20 flex h-[80px] items-center gap-4 border-b border-navy-100 bg-white/90 px-6 backdrop-blur">
			<div className="ml-auto flex items-center gap-4">
				<Link
					href="/alertes"
					className="relative text-navy-500 hover:text-navy-900"
					aria-label="Notifications"
				>
					<Bell className="h-5 w-5" />
					{counts.notifications > 0 && (
						<span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-urgent-500 px-1 text-[9px] font-bold text-white">
							{counts.notifications}
						</span>
					)}
				</Link>

				<UserButton user={user} />
			</div>
		</header>
	);
}
