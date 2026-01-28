import { NextResponse } from "next/server";
import { auth } from "~/server/auth-config";

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/agreements",
  "/planning",
  "/visits",
  "/installations",
  "/invoices",
  "/reports",
  "/history",
  "/settings",
  "/automation",
  "/integrations",
  "/help",
];

// Routes that should redirect to dashboard if authenticated
const authRoutes = ["/login", "/"];

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const isAuthenticated = !!request.auth;
  
  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Check if route is an auth route
  const isAuthRoute = authRoutes.includes(pathname);
  
  // Redirect to login if accessing protected route while not authenticated
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Redirect to dashboard if accessing auth routes while authenticated
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - api routes (handled by NextAuth)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api).*)",
  ],
};
