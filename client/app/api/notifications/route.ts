import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

// Mock electricity alerts (will be replaced with real API later)
const mockElectricityAlerts = [
    {
        id: "elec-1",
        recipient_type: "employee" as const,
        recipient_id: "admin",
        channel: "in_app" as const,
        subject: "High electricity consumption detected",
        subjectAr: "تم اكتشاف استهلاك مرتفع للكهرباء",
        body: "Building A has exceeded normal consumption levels",
        bodyAr: "تجاوز المبنى أ مستويات الاستهلاك العادية",
        status: "pending" as const,
        scheduled_at: null,
        sent_at: null,
        related_entity_type: "building",
        related_entity_id: "building-1",
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        type: "electricity" as const,
        read: false,
    },
    {
        id: "elec-2",
        recipient_type: "employee" as const,
        recipient_id: "admin",
        channel: "in_app" as const,
        subject: "Unpaid electricity bill",
        subjectAr: "فاتورة كهرباء غير مدفوعة",
        body: "Customer #123 has an unpaid bill for $150",
        bodyAr: "لدى العميل #123 فاتورة غير مدفوعة بقيمة 150 دولار",
        status: "pending" as const,
        scheduled_at: null,
        sent_at: null,
        related_entity_type: "bill",
        related_entity_id: "bill-1",
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        type: "electricity" as const,
        read: false,
    },
    {
        id: "elec-3",
        recipient_type: "employee" as const,
        recipient_id: "admin",
        channel: "email" as const,
        subject: "Faulty meter detected",
        subjectAr: "تم اكتشاف عداد معطل",
        body: "Meter #456 is showing irregular readings",
        bodyAr: "العداد #456 يظهر قراءات غير منتظمة",
        status: "sent" as const,
        scheduled_at: null,
        sent_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        related_entity_type: "meter",
        related_entity_id: "meter-456",
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        type: "electricity" as const,
        read: true,
    },
];

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("auth_token")?.value;
        if (!token) {
            return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
        }

        const searchParams = req.nextUrl.searchParams;
        const type = searchParams.get("type");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        let allNotifications: any[] = [];

        // Fetch rent notifications from backend
        try {
            const rentQuery = new URLSearchParams();
            rentQuery.set("page", String(page));
            rentQuery.set("limit", String(limit));
            if (searchParams.get("search")) rentQuery.set("search", searchParams.get("search")!);
            if (searchParams.get("status")) rentQuery.set("status", searchParams.get("status")!);
            if (searchParams.get("channel")) rentQuery.set("channel", searchParams.get("channel")!);

            const rentResponse = await fetch(`${API_BASE}/rent/notifications?${rentQuery.toString()}`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            });

            if (rentResponse.ok) {
                const rentData = await rentResponse.json();
                if (rentData.success && rentData.data?.items) {
                    allNotifications = [
                        ...allNotifications,
                        ...rentData.data.items.map((item: any) => ({
                            ...item,
                            type: "rent" as const,
                            read: item.status === "sent",
                        })),
                    ];
                }
            }
        } catch (error) {
            console.error("Error fetching rent notifications:", error);
        }

        // Add electricity alerts (mock for now)
        if (!type || type === "all" || type === "electricity") {
            allNotifications = [...allNotifications, ...mockElectricityAlerts];
        }

        // Filter by type if specified
        if (type && type !== "all") {
            allNotifications = allNotifications.filter((n) => n.type === type);
        }

        // Sort by created_at (newest first)
        allNotifications.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        // Calculate pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedItems = allNotifications.slice(startIndex, endIndex);
        const unreadCount = allNotifications.filter((n) => !n.read).length;

        return NextResponse.json({
            success: true,
            data: {
                items: paginatedItems,
                pagination: {
                    page,
                    limit,
                    total: allNotifications.length,
                    total_pages: Math.ceil(allNotifications.length / limit),
                },
                unread_count: unreadCount,
            },
        });
    } catch (error) {
        console.error("Error in notifications API:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Failed to fetch notifications" },
            { status: 500 },
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get("auth_token")?.value;
        if (!token) {
            return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
        }

        const body = await req.json();

        const response = await fetch(`${API_BASE}/notifications`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Failed to create notification" },
            { status: 500 },
        );
    }
}
