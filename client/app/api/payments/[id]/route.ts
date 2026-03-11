import { NextRequest } from "next/server";
import { proxyGet, proxyPatch, proxyDelete } from "@/lib/proxy";

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, context: RouteContext) {
    const { id } = await context.params;
    return proxyGet(req, `/payments/${id}`);
}

export async function PATCH(req: NextRequest, context: RouteContext) {
    const { id } = await context.params;
    return proxyPatch(req, `/payments/${id}`);
}

export async function DELETE(req: NextRequest, context: RouteContext) {
    const { id } = await context.params;
    return proxyDelete(req, `/payments/${id}`);
}
