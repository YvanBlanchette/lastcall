import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAgency } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, EmptyState } from "@/components/ui/card";
import { AgencyManager } from "@/components/agency/agency-manager";
import { ListingCard } from "@/components/listings/listing-card";
import { SectionTabs } from "@/components/ui/section-tabs";
import { FileText, MessageSquare, Users, ClipboardList, Building2 } from "lucide-react";

export const metadata = { title: "Mon agence" };

const AGENCY_TABS = [
	{ key: "informations", label: "Informations", icon: Building2 },
	{ key: "annonces", label: "Annonces", icon: FileText },
	{ key: "gestion", label: "Gestion", icon: Users },
	{ key: "messagerie", label: "Messagerie", icon: MessageSquare },
];

function resolveTab(raw) {
	if (typeof raw !== "string") return "informations";
	return AGENCY_TABS.some((tab) => tab.key === raw) ? raw : "informations";
}

export default async function AgencePage({ searchParams }) {
	const user = await requireAgency();
	const canManage = user.agencyRole === "AGENCY_ADMIN";
	const activeTab = resolveTab(searchParams?.tab);

	const [members, stats, booked, agencyListings, messageParticipants, pendingRequests] = await Promise.all([
		prisma.agencyMember.findMany({
			where: { agencyId: user.agencyId },
			include: {
				user: {
					select: {
						id: true,
						publicIdentifier: true,
						email: true,
						firstName: true,
						lastName: true,
						status: true,
					},
				},
			},
			orderBy: { joinedAt: "asc" },
		}),
		prisma.listing.groupBy({
			by: ["status"],
			where: { agencyId: user.agencyId },
			_count: true,
		}),
		prisma.interestRequest.count({
			where: { listing: { agencyId: user.agencyId }, outcomeBooked: true },
		}),
		prisma.listing.findMany({
			where: { agencyId: user.agencyId, status: { not: "DRAFT" } },
			include: {
				supplier: true,
				images: { take: 1, orderBy: { position: "asc" } },
				author: { select: { id: true, firstName: true, lastName: true, publicIdentifier: true } },
			},
			orderBy: { updatedAt: "desc" },
			take: 18,
		}),
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
		prisma.interestRequest.count({
			where: {
				listing: { agencyId: user.agencyId },
				status: "NEW",
			},
		}),
	]);

	const unreadConversations = messageParticipants.filter((participant) => {
		if (!participant.conversation.messages.length) return false;
		if (!participant.lastReadAt) return true;
		return participant.conversation.updatedAt > participant.lastReadAt;
	}).length;

	const byStatus = Object.fromEntries(stats.map((s) => [s.status, s._count]));
	const agency = await prisma.agency.findUnique({
		where: { id: user.agencyId },
		select: {
			id: true,
			name: true,
			publicIdentifier: true,
			status: true,
			logoUrl: true,
			description: true,
			contactEmail: true,
			contactPhone: true,
			agencyIdCategory: true,
			agencyId: true,
			licenseNumber: true,
			consortium: true,
			website: true,
			city: true,
			province: true,
			country: true,
		},
	});

	const agencyData = {
		...agency,
		publicIdentifier: agency?.publicIdentifier ?? "",
		agencyIdCategory: (agency?.agencyIdCategory ?? "").toLowerCase(),
		agencyId: agency?.agencyId ?? "",
		licenseNumber: agency?.licenseNumber ?? "",
		consortium: agency?.consortium ?? "",
		description: agency?.description ?? "",
		contactEmail: agency?.contactEmail ?? "",
		contactPhone: agency?.contactPhone ?? "",
		website: agency?.website ?? "",
		city: agency?.city ?? "",
		province: agency?.province ?? "",
		country: agency?.country ?? "CA",
	};
	const agencyProfileHref = agency ? (agency.publicIdentifier ? `/@${agency.publicIdentifier}` : `/profil-public/${agency.id}`) : null;

	return (
		<div className="page-shell page-shell-xl">
			<PageHeader
				title={
					agencyProfileHref ? (
						<Link
							href={agencyProfileHref}
							className="hover:underline"
						>
							{user.agency.name}
						</Link>
					) : (
						user.agency.name
					)
				}
				description="Organisez votre agence par onglets: informations, annonces, gestion et messagerie."
				action={
					agencyProfileHref ? (
						<Link
							href={agencyProfileHref}
							className="text-sm font-medium text-urgent-600 hover:underline"
						>
							Voir le profil public
						</Link>
					) : null
				}
			/>

			{/* AGENCY TABS */}
			<SectionTabs
				tabs={AGENCY_TABS}
				activeKey={activeTab}
				basePath="/agence"
			/>

			{/* AGENCY INFORMATIONS TAB */}
			{activeTab === "informations" && (
				<>
					<Card className="mt-6 p-5">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
							<div>
								<h2 className="section-title text-lg">
									{agencyProfileHref ? (
										<Link
											href={agencyProfileHref}
											className="hover:underline"
										>
											{agency?.name}
										</Link>
									) : (
										agency?.name
									)}
								</h2>
								<p className="section-subtitle">
									{agency?.city || "Ville non renseignée"}
									{agency?.province ? `, ${agency.province}` : ""}
									{agency?.country ? `, ${agency.country}` : ""}
								</p>
								{agency?.description ? (
									<p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-navy-700">{agency.description}</p>
								) : (
									<p className="mt-3 text-sm text-navy-500">Ajoutez une description pour transformer cette page en vitrine d&apos;agence.</p>
								)}
							</div>
							<div className="text-sm text-navy-600 sm:text-right">
								{agency?.contactEmail && <p>{agency.contactEmail}</p>}
								{agency?.contactPhone && <p>{agency.contactPhone}</p>}
								{agency?.website && <p>{agency.website}</p>}
							</div>
						</div>
					</Card>

					<div className="mt-6 grid gap-4 sm:grid-cols-3">
						{[
							["Annonces actives", byStatus.ACTIVE ?? 0],
							["Complètes ou relâchées", (byStatus.SOLD_OUT ?? 0) + (byStatus.RELEASED ?? 0)],
							["Réservations déclarées", booked],
						].map(([label, value]) => (
							<Card
								key={label}
								className="p-4"
							>
								<p className="text-2xl font-bold text-navy-900">{value}</p>
								<p className="text-sm text-navy-600">{label}</p>
							</Card>
						))}
					</div>
				</>
			)}

			{/* AGENCY LISTINGS TAB */}
			{activeTab === "annonces" && (
				<>
					<section className="mt-6">
						<div className="section-header">
							<h2 className="section-title">Annonces associées à l&apos;agence</h2>
							<span className="text-sm text-navy-500">{agencyListings.length} publication(s)</span>
						</div>
						<div className="mt-3">
							{agencyListings.length === 0 ? (
								<EmptyState
									icon={FileText}
									title="Aucune annonce publiée"
									description="Les annonces de vos agents apparaîtront ici dans un flux unique, façon page agence."
								/>
							) : (
								<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
									{agencyListings.map((listing) => (
										<div
											key={listing.id}
											className="space-y-2"
										>
											<ListingCard
												listing={listing}
												compact
											/>
											<p className="px-1 text-xs text-navy-500">
												Publié par{" "}
												{listing.author?.publicIdentifier ? (
													<Link
														href={`/@${listing.author.publicIdentifier}`}
														className="font-medium text-urgent-600 hover:underline"
													>
														{listing.author?.firstName} {listing.author?.lastName}
													</Link>
												) : (
													<>
														{listing.author?.firstName} {listing.author?.lastName}
													</>
												)}
											</p>
										</div>
									))}
								</div>
							)}
						</div>
					</section>

					<p className="mt-6 text-center text-sm text-navy-500">
						<Link
							href="/publier"
							className="font-medium text-urgent-600 hover:underline"
						>
							Publier un nouvel espace
						</Link>
					</p>
				</>
			)}

			{/* AGENCY MANAGEMENT TAB */}
			{activeTab === "gestion" && (
				<AgencyManager
					agency={agencyData}
					members={members}
					canManage={canManage}
					currentUserId={user.id}
				/>
			)}

			{/* AGENCY MESSAGING TAB */}
			{activeTab === "messagerie" && (
				<section className="mt-6 grid gap-4 lg:grid-cols-3">
					<Card className="p-5">
						<div className="flex items-center gap-2">
							<MessageSquare
								className="h-4 w-4 text-urgent-600"
								aria-hidden
							/>
							<h2 className="section-title">Conversations</h2>
						</div>
						<p className="mt-3 text-2xl font-bold text-navy-900">{unreadConversations}</p>
						<p className="text-sm text-navy-500">conversation(s) avec messages non lus</p>
						<Link
							href="/messagerie"
							className="mt-4 inline-block text-sm font-medium text-urgent-600 hover:underline"
						>
							Ouvrir la messagerie
						</Link>
					</Card>

					<Card className="p-5">
						<div className="flex items-center gap-2">
							<Users
								className="h-4 w-4 text-urgent-600"
								aria-hidden
							/>
							<h2 className="section-title">Équipe</h2>
						</div>
						<p className="mt-3 text-2xl font-bold text-navy-900">{members.length}</p>
						<p className="text-sm text-navy-500">membre(s) d&apos;agence</p>
						<Link
							href="/agence?tab=gestion"
							className="mt-4 inline-block text-sm font-medium text-urgent-600 hover:underline"
						>
							Gérer l&apos;équipe
						</Link>
					</Card>

					<Card className="p-5">
						<div className="flex items-center gap-2">
							<ClipboardList
								className="h-4 w-4 text-urgent-600"
								aria-hidden
							/>
							<h2 className="section-title">Demandes</h2>
						</div>
						<p className="mt-3 text-2xl font-bold text-navy-900">{pendingRequests}</p>
						<p className="text-sm text-navy-500">demande(s) en attente pour l&apos;agence</p>
						<Link
							href="/demandes"
							className="mt-4 inline-block text-sm font-medium text-urgent-600 hover:underline"
						>
							Traiter les demandes
						</Link>
					</Card>
				</section>
			)}
		</div>
	);
}
