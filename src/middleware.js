import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED = ["/accueil", "/marketplace", "/publier", "/mes-annonces", "/demandes", "/recherches", "/imports", "/profil", "/agence", "/listing", "/admin"];

async function valid(token) {
	if (!token) return false;
	try {
		await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
		return true;
	} catch {
		return false;
	}
}

export async function middleware(request) {
	const { pathname } = request.nextUrl;

	const publicIdentifierMatch = pathname.match(/^\/@([a-zA-Z0-9_-]+)$/);
	if (publicIdentifierMatch) {
		const target = new URL(`/profil-public/${publicIdentifierMatch[1].toLowerCase()}`, request.url);
		target.search = request.nextUrl.search;
		return NextResponse.rewrite(target);
	}

	const needsAuth = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));
	const token = request.cookies.get("lastcall_session")?.value;
	const authed = await valid(token);

	if (needsAuth && !authed) {
		const url = new URL("/login", request.url);
		url.searchParams.set("suivant", pathname);
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
