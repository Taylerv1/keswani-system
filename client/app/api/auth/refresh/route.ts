// ============================================================
// Next.js API Route — Refresh Token
// POST /api/auth/refresh
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { refreshToken as backendRefreshToken } from "@/features/auth/api/auth";

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

        // Determine remember preference from cookie and set cookie expiries accordingly
        const isProduction = process.env.NODE_ENV === "production";
        const remembered = req.cookies.get("remember_me")?.value === "1";

        const accessTokenMaxAge = remembered ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7;
        const refreshTokenMaxAge = remembered ? 60 * 60 * 24 * 90 : 60 * 60 * 24 * 30;

        const cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax" as const,
            path: "/",
        };

        response.cookies.set("auth_token", token, { ...cookieOptions, maxAge: accessTokenMaxAge });
        response.cookies.set("refresh_token", refresh_token, { ...cookieOptions, maxAge: refreshTokenMaxAge });

        // Ensure remember_me cookie persists with same lifetime as refresh token
        response.cookies.set("remember_me", remembered ? "1" : "0", {
            httpOnly: false,
            secure: isProduction,
            sameSite: "lax",
            path: "/",
            maxAge: refreshTokenMaxAge,
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
