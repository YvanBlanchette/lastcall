import { cn } from "@/lib/utils";

const TONES = {
  new: "bg-urgent-500 text-white",
  guaranteed: "bg-navy-900 text-white",
  urgent: "bg-red-600 text-white",
  french: "bg-blue-600 text-white",
  solo: "bg-violet-600 text-white",
  neutral: "bg-navy-100 text-navy-600",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
};

export function Badge({ tone = "neutral", className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Badges dérivés de l'annonce elle-même — jamais saisis à la main. */
export function listingBadges(listing, daysLeft) {
  const out = [];
  const ageDays = (Date.now() - new Date(listing.publishedAt ?? listing.createdAt).getTime()) / 86_400_000;

  if (daysLeft !== null && daysLeft <= 21) out.push({ tone: "urgent", label: "Release bientôt" });
  else if (ageDays <= 3) out.push({ tone: "new", label: "Nouveau" });
  if (listing.guaranteed) out.push({ tone: "guaranteed", label: "Départ garanti" });
  if (listing.language === "fr") out.push({ tone: "french", label: "Francophone" });
  if (listing.soloAvailable) out.push({ tone: "solo", label: "Solo disponible" });

  return out;
}
