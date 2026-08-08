import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED = [
  "/accueil", "/marketplace", "/publier", "/mes-annonces",
  "/demandes", "/recherches", "/imports", "/profil", "/agence",
  "/listing", "/admin",
];

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
  const needsAuth = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const token = request.cookies.get("lastcall_session")?.value;
  const authed = await valid(token);

  if (needsAuth && !authed) {
    const url = new URL("/login", request.url);
    url.searchParams.set("suivant", pathname);
    return NextResponse.redirect(url);
  }

  if (authed && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/accueil", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
