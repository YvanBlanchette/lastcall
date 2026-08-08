import Logo from "@/components/Logo";
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }) {
	return (
		<main className="h-screen w-screen overflow-hidden bg-navy-50">
			<div className="flex items-center justify-between z-10 w-full h-full">
				<div className="hidden lg:block w-1/2 h-full relative">
					<Image
						src="/images/hero.webp"
						alt="LastCall"
						width={1500}
						height={1500}
						className="absolute inset-0 w-full h-full m-auto object-cover"
					/>
				</div>
				<div className="h-full w-1/2 flex items-center justify-center z-10">{children}</div>
			</div>
		</main>
	);
}
