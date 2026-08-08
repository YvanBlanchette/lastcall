import { prisma } from "@/lib/prisma";
import { requireAgency } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { PublishWizard } from "@/components/publish/wizard";

export const metadata = { title: "Publier un espace" };

export default async function PublierPage() {
  const user = await requireAgency();

  const [suppliers, cityRows] = await Promise.all([
    prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.listing.findMany({
      where: { agencyId: user.agencyId },
      select: { departureCity: true },
      distinct: ["departureCity"],
      take: 20,
    }),
  ]);

  const cities = Array.from(
    new Set([
      "Montréal", "Québec", "Toronto", "Vancouver", "Ottawa", "Halifax",
      ...cityRows.map((c) => c.departureCity),
    ])
  );

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <PageHeader
        title="Publier un espace"
        description="Moins de deux minutes. Vous pouvez revenir en arrière sans rien perdre."
      />
      <div className="mt-6">
        <PublishWizard suppliers={suppliers} cities={cities} />
      </div>
    </div>
  );
}
