import Link from "next/link";
import { Bell, Mail } from "lucide-react";
import { logoutAction } from "@/actions/auth";

export function Topbar({ user, counts = {} }) {
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-navy-100 bg-white/90 px-6 backdrop-blur">
      <div className="ml-auto flex items-center gap-4">
        <Link href="/alertes" className="relative text-navy-500 hover:text-navy-900" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {counts.notifications > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-urgent-500 px-1 text-[9px] font-bold text-white">
              {counts.notifications}
            </span>
          )}
        </Link>

        <Link href="/demandes" className="relative text-navy-500 hover:text-navy-900" aria-label="Demandes reçues">
          <Mail className="h-5 w-5" />
          {counts.requests > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {counts.requests}
            </span>
          )}
        </Link>

        <form action={logoutAction}>
          <button
            type="submit"
            className="text-sm font-medium text-navy-500 hover:text-navy-900"
          >
            Se déconnecter
          </button>
        </form>

        <div
          className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white"
          title={`${user.firstName} ${user.lastName}`}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
