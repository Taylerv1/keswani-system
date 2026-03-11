// ============================================================
// Next.js API Route — Get Current User
// GET /api/auth/me
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getMe as backendGetMe } from "@/features/auth/api/auth";

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("auth_token")?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, error: "Not authenticated" },
                { status: 401 }
            );
        }

        // Call backend to get current user profile
        const result = await backendGetMe(token);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error || "Failed to get user" },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data,
        });
    } catch (error) {
        console.error("Get me API error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to get user",
            },
            { status: 500 }
        );
    }
}
