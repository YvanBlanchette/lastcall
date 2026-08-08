"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { savedSearchSchema, fieldErrors } from "@/lib/validators";

export async function createSavedSearchAction(_prev, formData) {
  const user = await requireUser();
  const raw = Object.fromEntries(formData);
  raw.soloOnly = formData.get("soloOnly") === "on" || formData.get("soloOnly") === "true";
  raw.guaranteedOnly = formData.get("guaranteedOnly") === "on" || formData.get("guaranteedOnly") === "true";
  raw.alertsEnabled = formData.get("alertsEnabled") !== "false";

  const parsed = savedSearchSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;

  await prisma.savedSearch.create({
    data: {
      userId: user.id,
      name: d.name,
      destination: d.destination || null,
      travelType: d.travelType || null,
      language: d.language || null,
      departureCity: d.departureCity || null,
      supplierId: d.supplierId || null,
      dateFrom: d.dateFrom ?? null,
      dateTo: d.dateTo ?? null,
      priceMax: d.priceMax ?? null,
      soloOnly: d.soloOnly,
      guaranteedOnly: d.guaranteedOnly,
      alertsEnabled: d.alertsEnabled,
      rawFilters: raw.rawFilters ? JSON.parse(raw.rawFilters) : null,
    },
  });

  revalidatePath("/recherches");
  return { ok: true };
}

export async function toggleAlertAction(id, enabled) {
  const user = await requireUser();
  await prisma.savedSearch.updateMany({
    where: { id, userId: user.id },
    data: { alertsEnabled: enabled },
  });
  revalidatePath("/recherches");
}

export async function deleteSavedSearchAction(id) {
  const user = await requireUser();
  await prisma.savedSearch.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/recherches");
}

/**
 * Journalise chaque recherche, y compris celles sans résultat.
 * `resultCount = 0` est le signal de demande non satisfaite : il alimente
 * LastCall Intelligence et ne peut pas être reconstitué rétroactivement.
 */
export async function logSearchEvent({ userId, agencyId, query, filters, resultCount }) {
  try {
    await prisma.searchEvent.create({
      data: {
        userId: userId ?? null,
        agencyId: agencyId ?? null,
        query: query || null,
        filters: filters ?? null,
        resultCount,
      },
    });
  } catch {
    /* jamais bloquant */
  }
}
