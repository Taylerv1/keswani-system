import { NextRequest, NextResponse } from "next/server";

const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000/api";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { access_token, new_password } = body;

        if (!access_token || !new_password) {
            return NextResponse.json(
                { success: false, error: "Access token and new password are required" },
                { status: 400 }
            );
        }

        const res = await fetch(`${API_BASE}/auth/reset-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ access_token, new_password }),
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("Reset password API error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to reset password",
            },
            { status: 500 }
        );
    }
}
