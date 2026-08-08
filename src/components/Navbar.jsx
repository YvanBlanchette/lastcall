import Link from "next/link";
import Logo from "./Logo";
import { Button } from "./ui/button";

const Navbar = () => {
	return (
		<header className="relative z-30 px-6 py-3 bg-white shadow-sm ring-1 ring-black/[0.05]">
			<div className="mx-auto flex max-w-7xl items-center justify-between">
				<Logo />

				<nav className="flex items-center gap-2">
					<Button
						asChild
						variant="ghost"
						size="sm"
						className="rounded-xl px-4 text-slate-600 hover:bg-white hover:text-slate-950"
					>
						<Link href="/login">Connexion</Link>
					</Button>

					<Button
						asChild
						size="sm"
						className="rounded-xl bg-slate-950 px-5 text-white shadow-sm hover:bg-orange-500"
					>
						<Link href="/register">Créer un compte</Link>
					</Button>
				</nav>
			</div>
		</header>
	);
};
export default Navbar;
