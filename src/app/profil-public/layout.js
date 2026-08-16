import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function PublicProfileLayout({ children }) {
	const user = await requireUser();

	const [requests, notifications, relations, messageParticipants] = await Promise.all([
		prisma.interestRequest.count({ where: { sellerUserId: user.id, status: "NEW" } }),
		prisma.notification.count({ where: { userId: user.id, readAt: null } }),
		prisma.agentRelation.count({ where: { addresseeId: user.id, status: "PENDING" } }),
		prisma.conversationParticipant.findMany({
			where: { userId: user.id },
			select: {
				lastReadAt: true,
				conversation: {
					select: {
						updatedAt: true,
						messages: {
							where: { senderId: { not: user.id } },
							take: 1,
							orderBy: { createdAt: "desc" },
						},
					},
				},
			},
		}),
	]);

	const messages = messageParticipants.filter((p) => {
		if (!p.conversation.messages.length) return false;
		if (!p.lastReadAt) return true;
		return p.conversation.updatedAt > p.lastReadAt;
	}).length;

	const counts = { requests, notifications, relations, messages };

	return (
		<div className="flex h-screen overflow-hidden bg-navy-50/60">
			<Sidebar
				user={user}
				counts={counts}
			/>
			<div className="flex min-w-0 flex-1 flex-col">
				<Topbar
					user={user}
					counts={counts}
				/>
				<main className="flex-1 overflow-y-scroll">{children}</main>
			</div>
		</div>
	);
}
