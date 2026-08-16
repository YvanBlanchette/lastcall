import Link from "next/link";
import { Bell, MessageSquareQuote } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Alertes" };

const HREF = {
	NEW_MATCH: (id) => `/listing/${id}`,
	REQUEST_RECEIVED: () => "/demandes",
	REQUEST_ANSWERED: () => "/demandes",
	LISTING_EXPIRING: () => "/mes-annonces",
};

export default async function AlertesPage() {
	const user = await requireUser();

	const notifications = await prisma.notification.findMany({
		where: { userId: user.id },
		orderBy: { createdAt: "desc" },
		take: 50,
	});

	// Consulter la page vaut lecture : le badge ne doit pas rester allumé.
	await prisma.notification.updateMany({
		where: { userId: user.id, readAt: null },
		data: { readAt: new Date() },
	});

	return (
		<div className="page-shell page-shell-sm">
			<PageHeader
				title="Alertes"
				description="Ce qui a bougé sur vos recherches et vos annonces."
			/>

			<div className="mt-6 space-y-2">
				{notifications.length === 0 ? (
					<EmptyState
						icon={Bell}
						title="Aucune alerte pour l'instant"
						description="Enregistrez une recherche : vous serez averti dès qu'un espace correspondant est publié."
						action={
							<Button asChild>
								<Link href="/marketplace">Ouvrir le marketplace</Link>
							</Button>
						}
					/>
				) : (
					notifications.map((n) => (
						<Card
							key={n.id}
							className="p-4"
						>
							<Link
								href={(HREF[n.type] ?? (() => "/accueil"))(n.entityId)}
								className="block"
							>
								<div className="flex items-start justify-between gap-3">
									<p className="text-sm font-medium text-navy-900">{n.title}</p>
									{n.type === "RELATION_REQUEST" && n.body?.startsWith("MESSAGE:") && (
										<Badge tone="warning">
											<MessageSquareQuote
												className="h-3 w-3"
												aria-hidden
											/>{" "}
											Message joint
										</Badge>
									)}
								</div>
								{n.body && !n.body.startsWith("MESSAGE:") && <p className="mt-0.5 text-sm text-navy-500">{n.body}</p>}
								{n.body?.startsWith("MESSAGE:") && <p className="mt-1 text-sm text-navy-600">&quot;{n.body.replace("MESSAGE:", "").trim()}&quot;</p>}
								<p className="mt-1 text-xs text-navy-400">{formatDate(n.createdAt)}</p>
							</Link>
						</Card>
					))
				)}
			</div>
		</div>
	);
}
