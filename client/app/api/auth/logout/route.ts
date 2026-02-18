// ============================================================
// Next.js API Route — Secure Logout
// POST /api/auth/logout
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { logout as backendLogout } from "@/api/auth";

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get("auth_token")?.value;

        // Call backend logout if token exists
        if (token) {
            try {
                await backendLogout(token);
            } catch (error) {
                // Continue even if backend logout fails
                console.error("Backend logout error:", error);
            }
        }

        // Create response
        const response = NextResponse.json({
            success: true,
            message: "Logged out successfully",
        });

        // Clear all auth cookies
        const cookieOptions = {
            path: "/",
            maxAge: 0, // Expire immediately
        };

        response.cookies.set("auth_token", "", cookieOptions);
        response.cookies.set("refresh_token", "", cookieOptions);
        response.cookies.set("user_data", "", cookieOptions);

        return response;
    } catch (error) {
        console.error("Logout API error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Logout failed",
            },
            { status: 500 }
        );
    }
}
