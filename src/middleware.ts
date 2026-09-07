import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { edgeAuthConfig } from "@/lib/auth/edge-config";

const { auth } = NextAuth(edgeAuthConfig);

/**
 * Edge-safe auth gate for the admin area. This only verifies the JWT
 * session cookie (no database access, so it's safe to run on the Edge
 * runtime). Redirect-table lookups and 404 logging, which need Prisma, are
 * handled in the Node.js-runtime catch-all route instead — see
 * src/app/[...catchall]/route.ts.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoginRoute = pathname === "/admin/login";
  const isAdminRoute = pathname.startsWith("/admin") && !isLoginRoute;

  if (isAdminRoute && !req.auth) {
    const loginUrl = new URL("/admin/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginRoute && req.auth) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
