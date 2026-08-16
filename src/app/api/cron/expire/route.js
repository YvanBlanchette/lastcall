import { prisma } from "@/lib/prisma";
import { mail } from "@/lib/mail";
import { computeScore } from "@/lib/score";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request) {
	const header = request.headers.get("authorization");
	return header === `Bearer ${process.env.CRON_SECRET}`;
}

/**
 * À exécuter une fois par jour.
 *
 * 1. Retire les annonces dont la relâche est passée.
 * 2. Prévient les détenteurs sept jours avant.
 * 3. Recalcule le score — il dépend du temps, donc il périme tout seul.
 */
export async function GET(request) {
	if (!authorized(request)) return new Response("Non autorisé", { status: 401 });

	const now = new Date();

	const expired = await prisma.listing.updateMany({
		where: { status: "ACTIVE", releaseDate: { lt: now } },
		data: { status: "RELEASED" },
	});

	const in7days = new Date(now.getTime() + 7 * 86_400_000);
	const in6days = new Date(now.getTime() + 6 * 86_400_000);

	const expiring = await prisma.listing.findMany({
		where: { status: "ACTIVE", releaseDate: { gte: in6days, lte: in7days } },
		include: { author: true },
	});

	await Promise.allSettled(
		expiring.map((l) =>
			Promise.all([
				mail.listingExpiring(l.author, l, 7),
				prisma.notification.create({
					data: {
						userId: l.authorId,
						type: "LISTING_EXPIRING",
						title: `${l.title} — relâche dans 7 jours`,
						body: `Il reste ${l.inventoryLeft} ${l.inventoryType === "CABINS" ? "cabines" : "places"}.`,
						entityId: l.id,
					},
				}),
			]),
		),
	);

	const active = await prisma.listing.findMany({
		where: { status: "ACTIVE" },
		include: { agency: { select: { status: true } }, ownerSupplier: { select: { status: true } }, images: { select: { id: true } } },
	});

	for (const listing of active) {
		const matchingSavedSearches = await prisma.savedSearch.count({
			where: {
				alertsEnabled: true,
				OR: [{ destination: null }, { destination: { contains: listing.destination, mode: "insensitive" } }],
			},
		});
		await prisma.listing.update({
			where: { id: listing.id },
			data: { score: computeScore(listing, { matchingSavedSearches }), scoredAt: now },
		});
	}

	return Response.json({
		ok: true,
		released: expired.count,
		warned: expiring.length,
		rescored: active.length,
	});
}
