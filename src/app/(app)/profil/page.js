import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card, EmptyState } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { ListingCard } from "@/components/listings/listing-card";
import { SectionTabs } from "@/components/ui/section-tabs";
import { FileText, MessageSquare, UserPlus2, ClipboardList, UserCircle2 } from "lucide-react";

export const metadata = { title: "Profil" };

const STATUS = {
	PENDING: ["warning", "Vérification en cours"],
	VERIFIED: ["success", "Vérifié"],
	REJECTED: ["neutral", "Refusé"],
	SUSPENDED: ["neutral", "Suspendu"],
};

const PROFILE_TABS = [
	{ key: "informations", label: "Informations", icon: UserCircle2 },
	{ key: "annonces", label: "Annonces", icon: FileText },
	{ key: "messagerie", label: "Messagerie", icon: MessageSquare },
];

function resolveTab(raw) {
	if (typeof raw !== "string") return "informations";
	return PROFILE_TABS.some((tab) => tab.key === raw) ? raw : "informations";
}

export default async function ProfilPage({ searchParams }) {
	const user = await requireUser();
	const [tone, label] = STATUS[user.status] ?? STATUS.PENDING;
	const activeTab = resolveTab(searchParams?.tab);

	const authoredListings = await prisma.listing.findMany({
		where: { authorId: user.id, status: { not: "DRAFT" } },
		include: {
			supplier: true,
			images: { take: 1, orderBy: { position: "asc" } },
			author: { select: { id: true, firstName: true, lastName: true, publicIdentifier: true } },
		},
		orderBy: { updatedAt: "desc" },
		take: 12,
	});

	const [messageParticipants, acceptedRelations, pendingRequests] = await Promise.all([
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
		prisma.agentRelation.count({
			where: {
				status: "ACCEPTED",
				OR: [{ requesterId: user.id }, { addresseeId: user.id }],
			},
		}),
		prisma.interestRequest.count({
			where: {
				listing: { authorId: user.id },
				status: "NEW",
			},
		}),
	]);

	const unreadConversations = messageParticipants.filter((participant) => {
		if (!participant.conversation.messages.length) return false;
		if (!participant.lastReadAt) return true;
		return participant.conversation.updatedAt > participant.lastReadAt;
	}).length;

	const org = user.supplier ?? user.agency ?? null;
	const isSupplierAccount = Boolean(user.supplierId);

	const initialProfile = {
		firstName: user.firstName,
		lastName: user.lastName,
		email: user.email,
		userPublicIdentifier: user.publicIdentifier ?? "",
		phone: user.phone ?? "",
		bio: user.bio ?? "",
		avatarUrl: user.avatarUrl ?? "",
		agencyName: org?.name ?? "",
		agencyPublicIdentifier: org?.publicIdentifier ?? "",
		agencyIdCategory: (user.agency?.agencyIdCategory ?? "").toLowerCase(),
		agencyId: isSupplierAccount ? (org?.id ?? "") : (user.agency?.agencyId ?? ""),
		licenseNumber: user.agency?.licenseNumber ?? "",
		consortium: user.agency?.consortium ?? "",
		website: org?.website ?? "",
		city: org?.city ?? "",
		province: org?.province ?? "",
	};

	return (
		<div className="page-shell page-shell-xl">
			<PageHeader
				title="Profil"
				description="Organisez votre présence pro par onglets: informations, annonces et messagerie."
				action={
					user.publicIdentifier ? (
						<Link
							href={`/@${user.publicIdentifier}`}
							className="text-sm font-medium text-urgent-600 hover:underline"
						>
							Voir mon profil public
						</Link>
					) : null
				}
			/>

			{/* PROFILE TABS */}
			<SectionTabs
				tabs={PROFILE_TABS}
				activeKey={activeTab}
				basePath="/profil"
			/>

			{/* PROFILE INFORMATIONS TAB */}
			{activeTab === "informations" && (
				<>
					<Card className="mt-6 p-5">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
							<div>
								<h2 className="section-title text-lg">
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
								</h2>
								<p className="section-subtitle">
									{user.agency ? (
										<Link
											href={user.agency.publicIdentifier ? `/@${user.agency.publicIdentifier}` : `/profil-public/${user.agency.id}`}
											className="hover:underline"
										>
											{user.agency?.name}
										</Link>
									) : (
										(user.agency?.name ?? "Agence non renseignée")
									)}
								</p>
								{user.bio ? (
									<p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-navy-700">{user.bio}</p>
								) : (
									<p className="mt-3 text-sm text-navy-500">Ajoutez une présentation professionnelle pour renforcer votre crédibilité.</p>
								)}
							</div>
							<div className="text-sm text-navy-600 sm:text-right">
								<p>{user.email}</p>
								{user.phone && <p>{user.phone}</p>}
							</div>
						</div>
					</Card>

					<Card className="mt-6 p-5">
						<div className="section-header">
							<h2 className="section-title">Statut du compte</h2>
							<Badge tone={tone}>{label}</Badge>
						</div>
						{user.status !== "VERIFIED" && (
							<p className="mt-2 text-sm leading-relaxed text-navy-600">
								Un administrateur vérifie votre agence sous 24 h ouvrables. D&apos;ici là, vous pouvez parcourir le marketplace et publier vos propres espaces,
								mais les inventaires réservés aux professionnels vérifiés restent masqués.
							</p>
						)}
					</Card>

					<ProfileEditor
						initialProfile={initialProfile}
						orgKind={isSupplierAccount ? "SUPPLIER" : "AGENCY"}
						statusTone={tone}
						statusLabel={label}
						memberSinceLabel={formatDate(user.createdAt)}
					/>
				</>
			)}

			{/* PROFILE LISTINGS TAB */}
			{activeTab === "annonces" && (
				<section className="mt-6">
					<div className="section-header">
						<h2 className="section-title">Annonces associées à cet agent</h2>
						<span className="text-sm text-navy-500">{authoredListings.length} publication(s)</span>
					</div>
					<div className="mt-3">
						{authoredListings.length === 0 ? (
							<EmptyState
								icon={FileText}
								title="Aucune annonce publiée"
								description="Quand vous publierez des espaces, ils apparaîtront ici comme sur un mur professionnel."
								action={
									<Link
										href="/publier"
										className="rounded-lg bg-urgent-600 px-3 py-2 text-sm font-medium text-white hover:bg-urgent-700"
									>
										Publier une annonce
									</Link>
								}
							/>
						) : (
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{authoredListings.map((listing) => (
									<ListingCard
										key={listing.id}
										listing={listing}
										compact
									/>
								))}
							</div>
						)}
					</div>
				</section>
			)}

			{/* PROFILE MESSAGING TAB */}
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
							<UserPlus2
								className="h-4 w-4 text-urgent-600"
								aria-hidden
							/>
							<h2 className="section-title">Relations</h2>
						</div>
						<p className="mt-3 text-2xl font-bold text-navy-900">{acceptedRelations}</p>
						<p className="text-sm text-navy-500">relation(s) actives</p>
						<Link
							href="/relations"
							className="mt-4 inline-block text-sm font-medium text-urgent-600 hover:underline"
						>
							Voir mes relations
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
						<p className="text-sm text-navy-500">demande(s) en attente</p>
						<Link
							href="/demandes"
							className="mt-4 inline-block text-sm font-medium text-urgent-600 hover:underline"
						>
							Gérer les demandes
						</Link>
					</Card>
				</section>
			)}
		</div>
	);
}
