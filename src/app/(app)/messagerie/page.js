import Link from "next/link";
import Image from "next/image";
import { Hash, MessageSquare, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAgency } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, EmptyState } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { MessageComposer } from "@/components/messaging/message-composer";
import { MessagesPanel } from "@/components/messaging/messages-panel";
import { AddContactDialog } from "@/components/messaging/add-contact-dialog";
import { CreateChannelDialog } from "@/components/messaging/create-channel-dialog";

export const metadata = { title: "Messagerie" };

const AGENCY_CHANNELS = [
	{ slug: "general", label: "# general", description: "Annonces internes et coordination" },
	{ slug: "ventes", label: "# ventes", description: "Disponibilites, leads et relaches" },
	{ slug: "operations", label: "# operations", description: "Suivi depart, docs et logistique" },
];

function channelKind(agencyId, slug) {
	return `AGENCY_CHANNEL:${agencyId}:${slug}`;
}

function parseChannelFromKind(kind) {
	if (!kind?.startsWith("AGENCY_CHANNEL:")) return null;
	const parts = kind.split(":");
	if (parts.length < 3) return null;
	const slug = parts.slice(2).join(":");
	const meta = AGENCY_CHANNELS.find((channel) => channel.slug === slug);
	const fallbackLabel = `# ${slug.replace(/-/g, " ")}`;
	return { slug, label: meta?.label ?? fallbackLabel, description: meta?.description ?? "Canal personnalisé" };
}

function renderMessageBody(body, mine, ownIdentifier) {
	const parts = String(body || "").split(/(\s+)/);
	return parts.map((part, index) => {
		const mention = part.match(/^@([a-z0-9._-]+)([.,!?;:]*)$/i);
		if (!mention) {
			return <span key={`part-${index}`}>{part}</span>;
		}

		const identifier = mention[1].toLowerCase();
		const trailing = mention[2] || "";
		const isOwnMention = ownIdentifier && identifier === ownIdentifier;
		const mentionClass = isOwnMention
			? mine
				? "rounded px-1 font-semibold text-amber-200 hover:text-amber-100"
				: "rounded bg-urgent-100 px-1 font-semibold text-urgent-700 hover:text-urgent-800"
			: mine
				? "font-semibold text-cyan-200 hover:text-cyan-100"
				: "font-semibold text-urgent-600 hover:text-urgent-700";
		return (
			<span key={`mention-${identifier}-${index}`}>
				<Link
					href={`/@${identifier}`}
					className={mentionClass}
				>
					@{identifier}
				</Link>
				{trailing}
			</span>
		);
	});
}

async function ensureAgencyChannels(agencyId) {
	const members = await prisma.agencyMember.findMany({
		where: { agencyId },
		select: { userId: true },
	});
	const memberIds = [...new Set(members.map((member) => member.userId).filter(Boolean))];
	if (!memberIds.length) return;

	for (const channel of AGENCY_CHANNELS) {
		const kind = channelKind(agencyId, channel.slug);
		let conversation = await prisma.conversation.findFirst({
			where: { kind },
			select: { id: true },
		});

		if (!conversation) {
			conversation = await prisma.conversation.create({
				data: {
					kind,
					participants: {
						createMany: {
							data: memberIds.map((userId) => ({ userId })),
							skipDuplicates: true,
						},
					},
				},
				select: { id: true },
			});
		}

		await prisma.conversationParticipant.createMany({
			data: memberIds.map((userId) => ({ conversationId: conversation.id, userId })),
			skipDuplicates: true,
		});
	}
}

export default async function MessageriePage({ searchParams }) {
	const user = await requireAgency();
	const canCreateAgencyChannels = user.role === "PLATFORM_ADMIN" || user.agencyRole === "AGENCY_ADMIN";
	await ensureAgencyChannels(user.agencyId);
	const selectedConversationId = Array.isArray(searchParams?.c) ? searchParams.c[0] : searchParams?.c;
	const q = String(Array.isArray(searchParams?.q) ? searchParams.q[0] : searchParams?.q || "").trim();
	const query = q.toLowerCase();
	const rawSidebarTab = String(Array.isArray(searchParams?.vt) ? searchParams.vt[0] : searchParams?.vt || "direct").toLowerCase();
	const sidebarTab = rawSidebarTab === "channels" ? "channels" : "direct";

	const [conversations, contactCandidatesRaw, agencyMembersRaw] = await Promise.all([
		prisma.conversation.findMany({
			where: { participants: { some: { userId: user.id } } },
			include: {
				relation: true,
				participants: {
					select: {
						userId: true,
						lastReadAt: true,
						user: {
							select: {
								id: true,
								firstName: true,
								lastName: true,
								email: true,
								publicIdentifier: true,
							},
						},
					},
				},
				messages: {
					orderBy: { createdAt: "desc" },
					take: 1,
				},
			},
			orderBy: { updatedAt: "desc" },
		}),
		prisma.user.findMany({
			where: {
				id: { not: user.id },
				memberships: { some: {} },
			},
			select: {
				id: true,
				firstName: true,
				lastName: true,
				email: true,
				publicIdentifier: true,
				memberships: {
					select: {
						agency: { select: { id: true, name: true, publicIdentifier: true } },
						isPrimary: true,
					},
					orderBy: { isPrimary: "desc" },
					take: 1,
				},
			},
			orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
			take: 200,
		}),
		prisma.agencyMember.findMany({
			where: { agencyId: user.agencyId },
			select: {
				user: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						publicIdentifier: true,
					},
				},
			},
		}),
	]);

	const contactCandidates = contactCandidatesRaw.map((candidate) => ({
		id: candidate.id,
		firstName: candidate.firstName,
		lastName: candidate.lastName,
		email: candidate.email,
		publicIdentifier: candidate.publicIdentifier,
		agencyName: candidate.memberships[0]?.agency?.name ?? "",
		agencyPublicIdentifier: candidate.memberships[0]?.agency?.publicIdentifier ?? "",
		agencyId: candidate.memberships[0]?.agency?.id ?? "",
	}));

	const mentionCandidates = Array.from(
		new Map(
			agencyMembersRaw
				.map((member) => member.user)
				.filter((member) => member?.publicIdentifier)
				.map((member) => [
					member.publicIdentifier,
					{
						id: member.id,
						publicIdentifier: member.publicIdentifier,
						name: `${member.firstName} ${member.lastName}`,
					},
				]),
		).values(),
	);

	const active = conversations.find((c) => c.id === selectedConversationId) ?? conversations[0] ?? null;
	const ownIdentifier = user.publicIdentifier?.toLowerCase() || "";

	const filteredConversations = query
		? conversations.filter((conversation) => {
				const channelMeta = parseChannelFromKind(conversation.kind);
				const peer = conversation.participants.find((p) => p.userId !== user.id)?.user;
				const last = conversation.messages[0];
				const normalizedQuery = query.replace(/^@+/, "");
				const haystack = [channelMeta?.label, channelMeta?.slug, peer?.firstName, peer?.lastName, peer?.email, peer?.publicIdentifier, last?.body]
					.filter(Boolean)
					.join(" ")
					.toLowerCase();
				return haystack.includes(normalizedQuery);
			})
		: conversations;

	let channelConversations = filteredConversations.filter((conversation) => Boolean(parseChannelFromKind(conversation.kind)));
	let directConversations = filteredConversations.filter((conversation) => !parseChannelFromKind(conversation.kind));

	let fullMessages = [];
	if (active) {
		fullMessages = await prisma.conversationMessage.findMany({
			where: { conversationId: active.id },
			include: { sender: true },
			orderBy: { createdAt: "asc" },
			take: 200,
		});

		await prisma.conversationParticipant.updateMany({
			where: { conversationId: active.id, userId: user.id },
			data: { lastReadAt: new Date() },
		});
	}

	const unreadEntries = await Promise.all(
		conversations.map(async (conversation) => {
			if (active?.id === conversation.id) return [conversation.id, 0];
			const myParticipant = conversation.participants.find((participant) => participant.userId === user.id);
			const unread = await prisma.conversationMessage.count({
				where: {
					conversationId: conversation.id,
					senderId: { not: user.id },
					...(myParticipant?.lastReadAt ? { createdAt: { gt: myParticipant.lastReadAt } } : {}),
				},
			});
			return [conversation.id, unread];
		}),
	);
	const unreadByConversationId = new Map(unreadEntries);

	const mentionUnreadEntries = ownIdentifier
		? await Promise.all(
				conversations.map(async (conversation) => {
					if (active?.id === conversation.id) return [conversation.id, 0];
					const myParticipant = conversation.participants.find((participant) => participant.userId === user.id);
					const mentionUnread = await prisma.conversationMessage.count({
						where: {
							conversationId: conversation.id,
							senderId: { not: user.id },
							body: { contains: `@${ownIdentifier}`, mode: "insensitive" },
							...(myParticipant?.lastReadAt ? { createdAt: { gt: myParticipant.lastReadAt } } : {}),
						},
					});
					return [conversation.id, mentionUnread];
				}),
			)
		: conversations.map((conversation) => [conversation.id, 0]);
	const mentionUnreadByConversationId = new Map(mentionUnreadEntries);

	const sortByUnreadThenActivity = (a, b) => {
		const unreadDiff = (unreadByConversationId.get(b.id) ?? 0) - (unreadByConversationId.get(a.id) ?? 0);
		if (unreadDiff !== 0) return unreadDiff;
		return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
	};
	channelConversations = [...channelConversations].sort(sortByUnreadThenActivity);
	directConversations = [...directConversations].sort(sortByUnreadThenActivity);

	const visibleConversations = sidebarTab === "channels" ? channelConversations : directConversations;

	const tabHref = (tab) => {
		const params = new URLSearchParams();
		params.set("vt", tab);
		if (active?.id) params.set("c", active.id);
		if (q) params.set("q", q);
		return `/messagerie?${params.toString()}`;
	};

	const conversationHref = (conversationId) => {
		const params = new URLSearchParams();
		params.set("c", conversationId);
		params.set("vt", sidebarTab);
		if (q) params.set("q", q);
		return `/messagerie?${params.toString()}`;
	};

	return (
		<div className="page-shell page-shell-xl">
			<PageHeader
				title="Messagerie"
				description="Discutez avec vos relations et vos mises en relation confirmées."
			/>

			<div className="mt-6 grid gap-4 lg:grid-cols-[56px_320px_1fr]">
				<div className="flex flex-row gap-2 lg:flex-col">
					<Link
						href={tabHref("direct")}
						title="Conversations directes"
						aria-label="Conversations directes"
						className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition ${sidebarTab === "direct" ? "border-navy-200 bg-white text-navy-900 shadow-sm" : "border-transparent bg-navy-50 text-navy-500 hover:bg-navy-100"}`}
					>
						<Users className="h-5 w-5" />
					</Link>
					<Link
						href={tabHref("channels")}
						title="Canaux d'agence"
						aria-label="Canaux d'agence"
						className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition ${sidebarTab === "channels" ? "border-navy-200 bg-white text-navy-900 shadow-sm" : "border-transparent bg-navy-50 text-navy-500 hover:bg-navy-100"}`}
					>
						<Hash className="h-5 w-5" />
					</Link>
				</div>

				<Card className="overflow-hidden p-3">
					<div className="px-2 pb-3">
						<h2 className="pb-2 text-sm font-semibold text-navy-900">Conversations</h2>
						<div className="space-y-2">
							{sidebarTab === "channels" && canCreateAgencyChannels && <CreateChannelDialog />}
							{sidebarTab === "direct" && <AddContactDialog candidates={contactCandidates} />}
						</div>
					</div>
					<form
						action="/messagerie"
						className="px-2 pb-2"
					>
						{active && (
							<input
								type="hidden"
								name="c"
								value={active.id}
							/>
						)}
						<input
							type="hidden"
							name="vt"
							value={sidebarTab}
						/>
						<Input
							name="q"
							defaultValue={q}
							placeholder="Rechercher un agent ou un message"
						/>
					</form>

					<div className="space-y-3">
						{visibleConversations.length === 0 ? (
							<p className="px-2 py-3 text-sm text-navy-500">Aucune conversation pour le moment.</p>
						) : (
							<div>
								<p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-navy-400">
									{sidebarTab === "channels" ? "Canaux d'agence" : "Conversations directes"}
								</p>
								<div className="space-y-1">
									{visibleConversations.map((conversation) => {
										const isChannel = sidebarTab === "channels";
										const channelMeta = parseChannelFromKind(conversation.kind);
										const peer = conversation.participants.find((p) => p.userId !== user.id)?.user;
										const last = conversation.messages[0];
										const unread = unreadByConversationId.get(conversation.id) ?? 0;
										const mentionUnread = mentionUnreadByConversationId.get(conversation.id) ?? 0;
										const selected = active?.id === conversation.id;
										const unreadDisplay = selected ? 0 : unread;
										const mentionDisplay = selected ? 0 : mentionUnread;
										return (
											<div
												key={conversation.id}
												className={`block rounded-lg px-3 py-2 ${selected ? "bg-navy-100" : "hover:bg-navy-50"}`}
											>
												<div className="flex items-center justify-between gap-2">
													<p className="truncate text-sm font-medium text-navy-900">
														{isChannel ? (
															channelMeta?.label || "# canal"
														) : peer?.publicIdentifier ? (
															<Link
																href={`/@${peer.publicIdentifier}`}
																className="hover:underline"
															>
																{peer.firstName} {peer.lastName}
															</Link>
														) : peer ? (
															`${peer.firstName} ${peer.lastName}`
														) : (
															"Conversation"
														)}
													</p>
													<div className="flex items-center gap-1">
														{mentionDisplay > 0 && (
															<span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">
																@
															</span>
														)}
														{unreadDisplay > 0 && (
															<span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-urgent-500 px-1 text-[10px] font-semibold text-white">
																{unreadDisplay}
															</span>
														)}
													</div>
												</div>
												<p className="truncate text-xs text-navy-500">{isChannel ? channelMeta?.description || "Canal" : (peer?.email ?? "")}</p>
												<Link
													href={conversationHref(conversation.id)}
													className="mt-1 inline-block text-xs font-medium text-urgent-600 hover:underline"
												>
													Ouvrir
												</Link>
												{last && (
													<p className="mt-1 truncate text-xs text-navy-400">
														{last.senderId === user.id ? "Vous: " : ""}
														{last.body || (last.imageUrl ? "Image" : "")}
													</p>
												)}
											</div>
										);
									})}
								</div>
							</div>
						)}
					</div>
				</Card>

				<Card className="flex min-h-[520px] flex-col p-0">
					{!active ? (
						<div className="p-6">
							<EmptyState
								icon={MessageSquare}
								title="Aucune conversation sélectionnée"
								description="Acceptez une relation ou une mise en relation pour ouvrir un canal direct."
							/>
						</div>
					) : (
						<>
							{(() => {
								const channelMeta = parseChannelFromKind(active.kind);
								if (channelMeta) {
									return (
										<div className="border-b border-navy-100 px-5 py-4">
											<p className="text-sm font-semibold text-navy-900">{channelMeta.label}</p>
											<p className="text-xs text-navy-500">Canal de votre agence</p>
										</div>
									);
								}

								return (
									<div className="border-b border-navy-100 px-5 py-4">
										<p className="text-sm font-semibold text-navy-900">
											{(() => {
												const peer = active.participants.find((p) => p.userId !== user.id)?.user;
												if (!peer) return "Conversation";
												if (!peer.publicIdentifier) return `${peer.firstName} ${peer.lastName}`;
												return (
													<Link
														href={`/@${peer.publicIdentifier}`}
														className="hover:underline"
													>
														{peer.firstName} {peer.lastName}
													</Link>
												);
											})()}
										</p>
										<p className="text-xs text-navy-500">{active.participants.find((p) => p.userId !== user.id)?.user?.email}</p>
									</div>
								);
							})()}

							<MessagesPanel
								conversationId={active.id}
								messageCount={fullMessages.length}
							>
								{fullMessages.length === 0 ? (
									<p className="text-sm text-navy-500">Démarrez la conversation avec un premier message.</p>
								) : (
									fullMessages.map((m) => {
										const mine = m.senderId === user.id;
										return (
											<div
												key={m.id}
												className={`flex ${mine ? "justify-end" : "justify-start"}`}
											>
												<div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-navy-900 text-white" : "bg-navy-100 text-navy-800"}`}>
													{m.body && <p className="whitespace-pre-line">{renderMessageBody(m.body, mine, ownIdentifier)}</p>}
													{m.imageUrl && (
														<Image
															src={m.imageUrl}
															alt="Pièce jointe"
															width={512}
															height={512}
															className="mt-2 max-h-64 rounded-lg object-cover"
														/>
													)}
													<p className={`mt-1 text-[10px] ${mine ? "text-navy-300" : "text-navy-500"}`}>{formatDate(m.createdAt)}</p>
												</div>
											</div>
										);
									})
								)}
							</MessagesPanel>

							<MessageComposer
								conversationId={active.id}
								mentionCandidates={mentionCandidates}
							/>
						</>
					)}
				</Card>
			</div>
		</div>
	);
}
