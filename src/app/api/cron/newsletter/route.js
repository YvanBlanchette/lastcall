import { prisma } from "@/lib/prisma";
import { mail } from "@/lib/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Infolettre automatique, deux fois par semaine (mardi et vendredi).
 * Le contenu est dérivé de la base, jamais rédigé à la main : chaque section
 * est une requête, et une section vide disparaît d'elle-même.
 */
export async function GET(request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Non autorisé", { status: 401 });
  }

  const now = new Date();
  const since = new Date(now.getTime() - 4 * 86_400_000);
  const in30days = new Date(now.getTime() + 30 * 86_400_000);

  const include = { supplier: { select: { name: true } } };
  const base = { status: "ACTIVE", visibility: { in: ["B2B_ONLY", "MEMBERS_ONLY", "PUBLIC"] } };

  const [fresh, urgent, french, solo] = await Promise.all([
    prisma.listing.findMany({
      where: { ...base, publishedAt: { gte: since } },
      orderBy: { score: "desc" }, take: 6, include,
    }),
    prisma.listing.findMany({
      where: { ...base, releaseDate: { gte: now, lte: in30days } },
      orderBy: { releaseDate: "asc" }, take: 6, include,
    }),
    prisma.listing.findMany({
      where: { ...base, language: "fr", publishedAt: { gte: since } },
      orderBy: { score: "desc" }, take: 4, include,
    }),
    prisma.listing.findMany({
      where: { ...base, soloAvailable: true },
      orderBy: { score: "desc" }, take: 4, include,
    }),
  ]);

  const sections = [
    { title: "Nouveaux espaces", listings: fresh },
    { title: "Relâches imminentes", listings: urgent },
    { title: "Départs francophones", listings: french },
    { title: "Cabines et chambres solo", listings: solo },
  ].filter((s) => s.listings.length > 0);

  if (sections.length === 0) {
    return Response.json({ ok: true, skipped: "aucun inventaire à annoncer" });
  }

  const recipients = await prisma.user.findMany({
    where: { status: "VERIFIED" },
    select: { id: true, email: true, firstName: true },
  });

  const results = await Promise.allSettled(recipients.map((u) => mail.newsletter(u, sections)));
  const sent = results.filter((r) => r.status === "fulfilled").length;

  await prisma.emailCampaign.create({
    data: {
      type: "NEWSLETTER",
      subject: "Cette semaine sur LastCall",
      listingIds: sections.flatMap((s) => s.listings.map((l) => l.id)),
      sentAt: now,
      recipients: sent,
    },
  });

  return Response.json({ ok: true, sent, sections: sections.length });
}
