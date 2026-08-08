import { prisma } from "@/lib/prisma";
import { requireAgency } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { PublishWizard } from "@/components/publish/wizard";

export const metadata = { title: "Publier un espace" };

export default async function PublierPage({ searchParams }) {
	const user = await requireAgency();

	const editParam = Array.isArray(searchParams?.edit) ? searchParams.edit[0] : searchParams?.edit;
	const editId = typeof editParam === "string" ? editParam.trim() : "";

	const [suppliers, cityRows, listingToEdit] = await Promise.all([
		prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
		prisma.listing.findMany({
			where: { agencyId: user.agencyId },
			select: { departureCity: true },
			distinct: ["departureCity"],
			take: 20,
		}),
		editId
			? prisma.listing.findFirst({
					where: { id: editId, agencyId: user.agencyId },
					include: {
						images: { orderBy: { position: "asc" } },
						supplier: true,
					},
				})
			: Promise.resolve(null),
	]);

	const cities = Array.from(new Set(["Montréal", "Québec", "Toronto", "Vancouver", "Ottawa", "Halifax", ...cityRows.map((c) => c.departureCity)]));

	return (
		<div className="mx-auto max-w-2xl px-6 py-8">
			<PageHeader
				title={listingToEdit ? "Modifier une annonce" : "Publier un espace"}
				description={
					listingToEdit
						? "Mettez à jour votre offre puis republiez-la en quelques clics."
						: "Moins de deux minutes. Vous pouvez revenir en arrière sans rien perdre."
				}
			/>
			<div className="mt-6">
				<PublishWizard
					suppliers={suppliers}
					cities={cities}
					initialListing={listingToEdit}
				/>
			</div>
		</div>
	);
}
