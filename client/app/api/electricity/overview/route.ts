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

        const backendRes = await fetch(`${API_BASE}/electricity/overview`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
        });

        const raw = await backendRes.text();
        const trimmed = raw.trim();

        if (trimmed) {
            try {
                const parsed = JSON.parse(trimmed);
                return NextResponse.json(parsed, { status: backendRes.status });
            } catch {
                // Fall through to normalized non-JSON error below.
            }
        }

        if (backendRes.ok) {
            return NextResponse.json(
                { success: true, data: null },
                { status: backendRes.status }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: `Backend returned non-JSON response (status ${backendRes.status})`,
            },
            { status: backendRes.status }
        );
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to fetch electricity overview",
            },
            { status: 500 }
        );
    }
}
