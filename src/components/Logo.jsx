import Image from "next/image";
import Link from "next/link";

const LOGO_SIZES = {
	xs: {
		icon: "h-6 w-auto",
	},
	sm: {
		icon: "h-8 w-auto",
	},
	md: {
		icon: "h-10 w-auto",
	},
	lg: {
		icon: "h-12 w-auto",
	},
	xl: {
		icon: "h-14 w-auto",
	},
	"2xl": {
		icon: "h-16 w-auto",
	},
	"3xl": {
		icon: "h-18 w-auto",
	},
	"4xl": {
		icon: "h-20 w-auto",
	},
};

const Logo = ({ size = "md", className = "", theme = "light" }) => {
	const scale = LOGO_SIZES[size] ?? LOGO_SIZES.md;

	const logoSrc = theme === "dark" ? "/images/lastcall-logo--dark.svg" : "/images/lastcall-logo.svg";

	return (
		<Link
			href="/"
			className={`inline-flex items-center ${scale.gap} ${className}`.trim()}
		>
			<Image
				src={logoSrc}
				alt="LastCall"
				width={40}
				height={40}
				className={`${scale.icon} shrink-0`}
			/>
		</Link>
	);
};
export default Logo;
