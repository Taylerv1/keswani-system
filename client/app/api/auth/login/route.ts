// ============================================================
// Next.js API Route — Secure Login with httpOnly Cookies
// POST /api/auth/login
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { login as backendLogin } from "@/api/auth";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: "Email and password are required" },
                { status: 400 }
            );
        }

        // Call backend login
        const result = await backendLogin(email, password);

        if (!result.success || !result.data) {
            return NextResponse.json(
                { success: false, error: result.error || "Login failed" },
                { status: 401 }
            );
        }

        const { token, refresh_token, expires_at, user } = result.data;

        // Create response
        const response = NextResponse.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    user_type: user.user_type,
                    profile_id: user.profile_id,
                    role: user.role,
                    access: user.access,
                },
            },
        });

        // Set httpOnly cookies (secure in production)
        const isProduction = process.env.NODE_ENV === "production";
        const cookieOptions = {
            httpOnly: true,
            secure: isProduction, // Only send over HTTPS in production
            sameSite: "lax" as const,
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 days
        };

        // Access token cookie
        response.cookies.set("auth_token", token, cookieOptions);

        // Refresh token cookie (longer expiry)
        response.cookies.set("refresh_token", refresh_token, {
            ...cookieOptions,
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        // Store user metadata (not sensitive, can be accessed client-side)
        response.cookies.set(
            "user_data",
            JSON.stringify({
                id: user.id,
                email: user.email,
                user_type: user.user_type,
                profile_id: user.profile_id,
                role: user.role,
                access: user.access,
            }),
            {
                httpOnly: false, // Accessible client-side for UI decisions
                secure: isProduction,
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24 * 7,
            }
        );

        return response;
    } catch (error) {
        console.error("Login API error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Internal server error",
            },
            { status: 500 }
        );
    }
}
