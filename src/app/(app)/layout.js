import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function AppLayout({ children }) {
  const user = await requireUser();

  const [requests, notifications] = await Promise.all([
    prisma.interestRequest.count({ where: { sellerUserId: user.id, status: "NEW" } }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);

  const counts = { requests, notifications };

  return (
    <div className="flex min-h-screen bg-navy-50/60">
      <Sidebar user={user} counts={counts} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} counts={counts} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
