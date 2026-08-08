"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { mail } from "@/lib/mail";

export async function verifyAgencyAction(agencyId, status) {
  const admin = await requireAdmin();
  if (!["VERIFIED", "REJECTED", "SUSPENDED"].includes(status)) {
    return { error: "Statut non valide." };
  }

  const agency = await prisma.agency.update({
    where: { id: agencyId },
    data: { status, verifiedAt: status === "VERIFIED" ? new Date() : null },
    include: { members: { include: { user: true } } },
  });

  // Le statut de l'agence descend sur ses conseillers : c'est lui qui ouvre
  // l'accès aux inventaires B2B et aux tarifs masqués.
  await prisma.user.updateMany({
    where: { memberships: { some: { agencyId } } },
    data: { status },
  });

  await prisma.auditLog.create({
    data: { userId: admin.id, action: `AGENCY_${status}`, entityType: "Agency", entityId: agencyId },
  });

  if (status === "VERIFIED") {
    await Promise.allSettled(agency.members.map((m) => mail.accountVerified(m.user)));
  }

  revalidatePath("/admin");
  return { ok: true };
}

export async function moderateListingAction(listingId, status) {
  const admin = await requireAdmin();
  await prisma.listing.update({ where: { id: listingId }, data: { status } });
  await prisma.auditLog.create({
    data: { userId: admin.id, action: `MODERATED_${status}`, entityType: "Listing", entityId: listingId },
  });
  revalidatePath("/admin");
  revalidatePath("/marketplace");
  return { ok: true };
}
