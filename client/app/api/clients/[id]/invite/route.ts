import { NextRequest } from "next/server";
import { proxyPost } from "@/lib/proxy";

interface RouteContext { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, context: RouteContext) {
    const { id } = await context.params;
    return proxyPost(req, `/clients/${id}/invite`);
}
