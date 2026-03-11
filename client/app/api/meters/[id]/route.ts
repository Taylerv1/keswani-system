import { NextRequest } from "next/server";
import { proxyPatch, proxyDelete } from "@/lib/proxy";

interface RouteContext { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, context: RouteContext) {
    const { id } = await context.params;
    return proxyPatch(req, `/meters/${id}`);
}

export async function DELETE(req: NextRequest, context: RouteContext) {
    const { id } = await context.params;
    return proxyDelete(req, `/meters/${id}`);
}
