import { NextRequest } from "next/server";
import { proxyPatch, proxyPut } from "@/lib/proxy";

interface RouteContext { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, context: RouteContext) {
    const { id } = await context.params;
    return proxyPatch(req, `/pricing/${id}`);
}

export async function PUT(req: NextRequest, context: RouteContext) {
    const { id } = await context.params;
    return proxyPut(req, `/pricing/${id}`);
}
