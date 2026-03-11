import { NextRequest } from "next/server";
import { proxyPatch } from "@/lib/proxy";

export async function PATCH(req: NextRequest) {
    return proxyPatch(req, "/notifications/read-all");
}
