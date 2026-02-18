// ============================================================
// Next.js API Route — Refresh Token
// POST /api/auth/refresh
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { refreshToken as backendRefreshToken } from "@/api/auth";

export async function POST(req: NextRequest) {
    try {
        const refreshToken = req.cookies.get("refresh_token")?.value;

        if (!refreshToken) {
            return NextResponse.json(
                { success: false, error: "No refresh token found" },
                { status: 401 }
            );
        }

        // Call backend to refresh token
        const result = await backendRefreshToken(refreshToken);

        if (!result.success || !result.data) {
            return NextResponse.json(
                { success: false, error: result.error || "Failed to refresh token" },
                { status: 401 }
            );
        }

        const { token, refresh_token, expires_at } = result.data;

        // Create response
        const response = NextResponse.json({
            success: true,
            message: "Token refreshed successfully",
        });

        // Update cookies
        const isProduction = process.env.NODE_ENV === "production";
        const cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax" as const,
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 days
        };

        response.cookies.set("auth_token", token, cookieOptions);
        response.cookies.set("refresh_token", refresh_token, {
            ...cookieOptions,
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        return response;
    } catch (error) {
        console.error("Refresh token API error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to refresh token",
            },
            { status: 500 }
        );
    }
}
