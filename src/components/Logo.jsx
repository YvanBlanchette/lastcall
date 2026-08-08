import Image from "next/image";
import Link from "next/link";

const LOGO_SIZES = {
	xs: {
		icon: "h-6 w-6",
		wordmark: "text-base",
		gap: "gap-0.5",
	},
	sm: {
		icon: "h-8 w-8",
		wordmark: "text-lg",
		gap: "gap-0.5",
	},
	md: {
		icon: "h-10 w-10",
		wordmark: "text-2xl",
		gap: "gap-0.5",
	},
	lg: {
		icon: "h-12 w-12",
		wordmark: "text-3xl",
		gap: "gap-1",
	},
	xl: {
		icon: "h-14 w-14",
		wordmark: "text-4xl",
		gap: "gap-1",
	},
	"2xl": {
		icon: "h-16 w-16",
		wordmark: "text-5xl",
		gap: "gap-1",
	},
	"3xl": {
		icon: "h-18 w-18",
		wordmark: "text-6xl",
		gap: "gap-1",
	},
	"4xl": {
		icon: "h-20 w-20",
		wordmark: "text-7xl",
		gap: "gap-1",
	},
};

const Logo = ({ size = "md", className = "" }) => {
	const scale = LOGO_SIZES[size] ?? LOGO_SIZES.md;

	return (
		<Link
			href="/"
			className={`inline-flex items-center ${scale.gap} ${className}`.trim()}
		>
			<Image
				src="/images/lastcall-icon.svg"
				alt="LastCall"
				width={40}
				height={40}
				className={`${scale.icon} shrink-0`}
			/>

			<span className={`font-bold tracking-[-0.025em] ${scale.wordmark}`}>
				Last
				<span className="ml-1 text-orange-500">Call</span>
			</span>
		</Link>
	);
};
export default Logo;
