import Link from "next/link";
import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAgency } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, EmptyState } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { sendRelationRequestAction, respondRelationRequestAction, removeRelationAction } from "@/actions/relations";

export const metadata = { title: "Relations" };

function label(status) {
	if (status === "ACCEPTED") return ["success", "Connecté"];
	if (status === "PENDING") return ["warning", "En attente"];
	if (status === "DECLINED") return ["neutral", "Refusé"];
	return ["neutral", status];
}

export default async function RelationsPage() {
	const user = await requireAgency();

	const [receivedPending, sentPending, accepted] = await Promise.all([
		prisma.agentRelation.findMany({
			where: { addresseeId: user.id, status: "PENDING" },
			include: { requester: true },
			orderBy: { createdAt: "desc" },
		}),
		prisma.agentRelation.findMany({
			where: { requesterId: user.id, status: "PENDING" },
			include: { addressee: true },
			orderBy: { createdAt: "desc" },
		}),
		prisma.agentRelation.findMany({
			where: {
				status: "ACCEPTED",
				OR: [{ requesterId: user.id }, { addresseeId: user.id }],
			},
			include: {
				requester: true,
				addressee: true,
				conversation: true,
			},
			orderBy: { updatedAt: "desc" },
		}),
	]);

	return (
		<div className="page-shell page-shell-lg">
			<PageHeader
				title="Relations"
				description="Ajoutez des agents professionnels à votre réseau pour échanger plus vite."
			/>

			<Card className="mt-6 p-5">
				<h2 className="section-title">Ajouter un agent</h2>
				<p className="section-subtitle">Envoyez une demande avec son courriel LastCall.</p>
				<form
					action={sendRelationRequestAction}
					className="mt-3 flex gap-2"
				>
					<Input
						name="email"
						type="email"
						placeholder="agent@agence.com"
						required
					/>
					<SubmitButton pendingLabel="Envoi...">Envoyer</SubmitButton>
				</form>
			</Card>

			<section className="mt-6 grid gap-4 lg:grid-cols-2">
				<Card className="p-5">
					<h2 className="section-title">Demandes reçues</h2>
					<div className="mt-3 space-y-3">
						{receivedPending.length === 0 ? (
							<p className="text-sm text-navy-500">Aucune demande en attente.</p>
						) : (
							receivedPending.map((rel) => (
								<div
									key={rel.id}
									className="rounded-lg border border-navy-100 p-3"
								>
									<p className="text-sm font-medium text-navy-900">
										{rel.requester.publicIdentifier ? (
											<Link
												href={`/@${rel.requester.publicIdentifier}`}
												className="hover:underline"
											>
												{rel.requester.firstName} {rel.requester.lastName}
											</Link>
										) : (
											<>
												{rel.requester.firstName} {rel.requester.lastName}
											</>
										)}
									</p>
									<p className="text-xs text-navy-500">{rel.requester.email}</p>
									{rel.requestMessage && <p className="mt-1 text-xs text-navy-600">&quot;{rel.requestMessage}&quot;</p>}
									<div className="mt-2 flex gap-2">
										<form action={respondRelationRequestAction.bind(null, rel.id, "accept")}>
											<SubmitButton
												size="sm"
												pendingLabel="..."
											>
												Accepter
											</SubmitButton>
										</form>
										<form action={respondRelationRequestAction.bind(null, rel.id, "decline")}>
											<SubmitButton
												size="sm"
												variant="outline"
												pendingLabel="..."
											>
												Refuser
											</SubmitButton>
										</form>
									</div>
								</div>
							))
						)}
					</div>
				</Card>

				<Card className="p-5">
					<h2 className="section-title">Demandes envoyées</h2>
					<div className="mt-3 space-y-3">
						{sentPending.length === 0 ? (
							<p className="text-sm text-navy-500">Aucune demande envoyée en attente.</p>
						) : (
							sentPending.map((rel) => (
								<div
									key={rel.id}
									className="rounded-lg border border-navy-100 p-3"
								>
									<p className="text-sm font-medium text-navy-900">
										{rel.addressee.publicIdentifier ? (
											<Link
												href={`/@${rel.addressee.publicIdentifier}`}
												className="hover:underline"
											>
												{rel.addressee.firstName} {rel.addressee.lastName}
											</Link>
										) : (
											<>
												{rel.addressee.firstName} {rel.addressee.lastName}
											</>
										)}
									</p>
									<p className="text-xs text-navy-500">{rel.addressee.email}</p>
									{rel.requestMessage && <p className="mt-1 text-xs text-navy-600">&quot;{rel.requestMessage}&quot;</p>}
									<div className="mt-2">
										<Badge tone="warning">En attente</Badge>
									</div>
								</div>
							))
						)}
					</div>
				</Card>
			</section>

			<section className="mt-6">
				<h2 className="section-title">Vos relations</h2>
				<div className="mt-3 space-y-3">
					{accepted.length === 0 ? (
						<EmptyState
							icon={Users}
							title="Aucune relation active"
							description="Ajoutez des agents pour ouvrir un canal direct dans la messagerie."
						/>
					) : (
						accepted.map((rel) => {
							const peer = rel.requesterId === user.id ? rel.addressee : rel.requester;
							const [tone, text] = label(rel.status);
							return (
								<Card
									key={rel.id}
									className="p-4"
								>
									<div className="flex flex-wrap items-center justify-between gap-3">
										<div>
											<p className="text-sm font-medium text-navy-900">
												{peer.publicIdentifier ? (
													<Link
														href={`/@${peer.publicIdentifier}`}
														className="hover:underline"
													>
														{peer.firstName} {peer.lastName}
													</Link>
												) : (
													<>
														{peer.firstName} {peer.lastName}
													</>
												)}
											</p>
											<p className="text-xs text-navy-500">{peer.email}</p>
										</div>
										<div className="flex items-center gap-2">
											<Badge tone={tone}>{text}</Badge>
											{rel.conversation && (
												<Link
													href={`/messagerie?c=${rel.conversation.id}`}
													className="text-xs font-medium text-urgent-600 hover:underline"
												>
													Ouvrir la conversation
												</Link>
											)}
											<form action={removeRelationAction.bind(null, rel.id)}>
												<SubmitButton
													size="sm"
													variant="ghost"
													pendingLabel="..."
												>
													Retirer
												</SubmitButton>
											</form>
										</div>
									</div>
								</Card>
							);
						})
					)}
				</div>
			</section>
		</div>
	);
}
