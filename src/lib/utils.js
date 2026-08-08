import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const DATE_FMT = new Intl.DateTimeFormat("fr-CA", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatDate(date) {
  if (!date) return "—";
  return DATE_FMT.format(new Date(date));
}

export function formatMoney(amount, currency = "CAD") {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

/** Jours restants avant la date de relâche. Négatif = déjà passée. */
export function daysUntil(date) {
  if (!date) return null;
  const ms = new Date(date).getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

/** Formule les libellés d'inventaire sans jamais écrire « 1 cabines ». */
export function inventoryLabel(count, type) {
  const noun = type === "CABINS" ? "cabine" : "place";
  return `${count} ${noun}${count > 1 ? "s" : ""} restante${count > 1 ? "s" : ""}`;
}

export function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
