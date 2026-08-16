import Link from "next/link";
import { cn } from "@/lib/utils";

export function SectionTabs({ tabs, activeKey, basePath, className }) {
	return (
		<nav className={cn("mt-6 flex flex-wrap gap-2", className)}>
			{tabs.map((tab) => {
				const Icon = tab.icon;

				return (
					<Link
						key={tab.key}
						href={`${basePath}?tab=${tab.key}`}
						className={cn(
							"inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition",
							activeKey === tab.key
								? "border-urgent-500 bg-urgent-50 text-urgent-700"
								: "border-navy-200 bg-white text-navy-600 hover:border-navy-300 hover:text-navy-900",
						)}
					>
						{Icon && (
							<Icon
								className="h-4 w-4"
								aria-hidden
							/>
						)}
						<span>{tab.label}</span>
					</Link>
				);
			})}
		</nav>
	);
}
