import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

export async function PATCH(req: NextRequest) {
    try {
        const token = req.cookies.get("auth_token")?.value;
        if (!token) {
            return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
        }

        const searchParams = req.nextUrl.searchParams;
        const type = searchParams.get("type");

        // Mark rent notifications as read if type is all or rent
        if (!type || type === "all" || type === "rent") {
            try {
                await fetch(`${API_BASE}/rent/notifications/mark-all-read`, {
                    method: "PATCH",
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                });
            } catch (error) {
                console.error("Error marking rent notifications as read:", error);
            }
        }

        // Note: Electricity alerts are currently mock data
        // When the backend API is ready, add the call here:
        // if (!type || type === "all" || type === "electricity") {
        //     await fetch(`${API_BASE}/electricity/alerts/mark-all-read`, {
        //         method: "PATCH",
        //         headers: { Authorization: `Bearer ${token}` },
        //         cache: "no-store",
        //     });
        // }

        return NextResponse.json({ success: true, message: "Notifications marked as read" });
    } catch (error) {
        console.error("Error in mark-all-read API:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Failed to mark notifications as read" },
            { status: 500 },
        );
    }
}
