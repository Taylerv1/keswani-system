import { NextRequest } from "next/server";
import { proxyGet } from "@/lib/proxy";

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, context: RouteContext) {
    const { id } = await context.params;
    return proxyGet(req, `/bills/${id}`);
}
