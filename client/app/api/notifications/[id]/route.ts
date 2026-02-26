import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

// Helper to determine notification type from ID
function getNotificationType(id: string): "rent" | "electricity" {
    if (id.startsWith("elec-")) {
        return "electricity";
    }
    return "rent";
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        console.log("PATCH request received for notification:", params.id);
        const token = req.cookies.get("auth_token")?.value;
        if (!token) {
            console.log("No token found");
            return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
        }

        let body;
        try {
            body = await req.json();
            console.log("Request body:", body);
        } catch (error) {
            console.log("Failed to parse JSON body:", error);
            body = {};
        }

        const type = getNotificationType(params.id);
        console.log("Notification type:", type);

        // Map 'read' to 'status' for backend compatibility
        const backendData: { status?: string; subject?: string; body?: string } = {};
        if (body.subject !== undefined) backendData.subject = body.subject;
        if (body.body !== undefined) backendData.body = body.body;
        if (body.status !== undefined) backendData.status = body.status;
        if (body.read !== undefined) backendData.status = body.read ? "sent" : "pending";

        if (type === "rent") {
            // Update rent notification via backend
            const response = await fetch(`${API_BASE}/rent/notifications/${params.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(backendData),
            });

            const data = await response.json();
            return NextResponse.json(data, { status: response.status });
        } else {
            console.log("Handling mock electricity notification update");
            // Electricity alerts are currently mock data
            // When backend API is ready, add the call here:
            // const response = await fetch(`${API_BASE}/electricity/alerts/${params.id}`, {
            //     method: "PATCH",
            //     headers: {
            //         "Content-Type": "application/json",
            //         Authorization: `Bearer ${token}`
            //     },
            //     body: JSON.stringify(body),
            // });
            // const data = await response.json();
            // return NextResponse.json(data, { status: response.status });

            // For now, just return success
            console.log("Returning success for mock electricity notification");
            return NextResponse.json({
                success: true,
                data: {
                    id: params.id,
                    type: "electricity" as const,
                    read: true,
                    ...(body || {})
                },
                message: "Notification updated successfully (mock data)"
            });
        }
    } catch (error) {
        console.error("Error updating notification:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Failed to update notification" },
            { status: 500 },
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const token = req.cookies.get("auth_token")?.value;
        if (!token) {
            return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
        }

        const type = getNotificationType(params.id);

        if (type === "rent") {
            // Delete rent notification via backend
            const response = await fetch(`${API_BASE}/rent/notifications/${params.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await response.json();
            return NextResponse.json(data, { status: response.status });
        } else {
            // Electricity alerts are currently mock data
            // When backend API is ready, add the call here:
            // const response = await fetch(`${API_BASE}/electricity/alerts/${params.id}`, {
            //     method: "DELETE",
            //     headers: { Authorization: `Bearer ${token}` },
            // });
            // const data = await response.json();
            // return NextResponse.json(data, { status: response.status });

            // For now, just return success
            return NextResponse.json({ success: true });
        }
    } catch (error) {
        console.error("Error deleting notification:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Failed to delete notification" },
            { status: 500 },
        );
    }
}
