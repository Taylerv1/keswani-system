import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

export async function PATCH(req: NextRequest) {
    try {
        const token = req.cookies.get("auth_token")?.value;
        if (!token) {
            return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
        }

        const response = await fetch(`${API_BASE}/rent/notifications/mark-all-read`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Failed to mark all read" },
            { status: 500 },
        );
    }
}
