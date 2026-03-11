import { NextRequest } from "next/server";
import { proxyPatch } from "@/lib/proxy";

interface RouteContext { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, context: RouteContext) {
    const { id } = await context.params;
    return proxyPatch(req, `/notifications/${id}/read`);
}
