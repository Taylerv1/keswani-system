import { NextRequest, NextResponse } from "next/server";

const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000/api";

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("auth_token")?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, error: "Not authenticated" },
                { status: 401 }
            );
        }

        const backendRes = await fetch(`${API_BASE}/notifications/stats`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });

        const raw = await backendRes.text();
        const trimmed = raw.trim();

        if (trimmed) {
            try {
                const parsed = JSON.parse(trimmed);
                return NextResponse.json(parsed, { status: backendRes.status });
            } catch {
                // fall through
            }
        }

        return NextResponse.json(
            { success: false, error: "Invalid response from backend" },
            { status: backendRes.status }
        );
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to fetch stats",
            },
            { status: 500 }
        );
    }
}
