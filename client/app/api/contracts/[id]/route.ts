import { NextRequest } from "next/server";
import { proxyGet, proxyDelete } from "@/lib/proxy";

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, context: RouteContext) {
    const { id } = await context.params;
    return proxyGet(req, `/contracts/${id}`);
}

export async function DELETE(req: NextRequest, context: RouteContext) {
    const { id } = await context.params;
    return proxyDelete(req, `/contracts/${id}`);
}
