// ============================================================
// Next.js Middleware — Route Protection
// Automatically redirects unauthenticated users to login
// ============================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const token = request.cookies.get("auth_token")?.value;
    const userData = request.cookies.get("user_data")?.value;

    // Routes that require authentication
    const protectedRoutes = ["/admin-dashboard", "/dashboard"];
    const isProtectedRoute = protectedRoutes.some((route) =>
        request.nextUrl.pathname.startsWith(route)
    );

    // If accessing protected route without auth, redirect to login
    if (isProtectedRoute && (!token || !userData)) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    // If accessing login page while authenticated, redirect to appropriate dashboard
    if (request.nextUrl.pathname === "/login" && token && userData) {
        try {
            const user = JSON.parse(decodeURIComponent(userData));
            const dashboardUrl =
                user.user_type === "employee"
                    ? "/admin-dashboard/rent"
                    : "/dashboard";
            return NextResponse.redirect(new URL(dashboardUrl, request.url));
        } catch {
            // Invalid user data, clear cookies and continue to login
            const response = NextResponse.next();
            response.cookies.delete("auth_token");
            response.cookies.delete("refresh_token");
            response.cookies.delete("user_data");
            return response;
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/admin-dashboard/:path*",
        "/dashboard/:path*",
        "/login",
    ],
};
