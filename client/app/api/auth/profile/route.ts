import { NextRequest, NextResponse } from "next/server";

const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000/api";

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const token = req.cookies.get("auth_token")?.value;

        if (!token) {
            return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
        }

        const res = await fetch(`${API_BASE}/auth/profile`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("Profile update API error:", error);
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
    }
}
