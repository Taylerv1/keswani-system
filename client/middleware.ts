// ============================================================
// Next.js Middleware — Route Protection
// Automatically redirects unauthenticated users to login
// ============================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const token = request.cookies.get("auth_token")?.value;
    const userData = request.cookies.get("user_data")?.value;
    
    let user = null;
    if (userData) {
        try {
            user = JSON.parse(decodeURIComponent(userData));
        } catch (e) {
            // Invalid data - treat as unauthenticated
        }
    }

    // Routes that require authentication
    const protectedRoutes = ["/admin-dashboard", "/dashboard"];
    const isProtectedRoute = protectedRoutes.some((route) =>
        request.nextUrl.pathname.startsWith(route)
    );

    // 1. Unauthenticated users trying to access protected routes
    if (isProtectedRoute && (!token || !user)) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 2. Authenticated users trying to access login page
    if (request.nextUrl.pathname === "/login" && token && user) {
        const dashboardUrl =
            user.user_type === "employee"
                ? "/admin-dashboard/rent"
                : "/dashboard";
        return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
    
    // 3. Role-Based Access Control
    if (token && user) {
        // Case A: Non-employees trying to access Admin Dashboard
        if (request.nextUrl.pathname.startsWith("/admin-dashboard")) {
            if (user.user_type !== "employee") {
                // Requirement: Show custom 404 page (not 403)
                // Use rewrite to keep the URL but show 404 content
                return NextResponse.rewrite(new URL("/404", request.url));
            }
        }

        // Case B: Employees trying to access Customer Dashboard
        // (Assuming employees should only use admin dashboard)
        if (request.nextUrl.pathname.startsWith("/dashboard") && 
            !request.nextUrl.pathname.startsWith("/dashboard/profile") // Allow profile access?
        ) {
             if (user.user_type === "employee") {
                 return NextResponse.redirect(new URL("/admin-dashboard/rent", request.url));
             }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
    ],
};
