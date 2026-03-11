import { NextRequest } from "next/server";
import { proxyGet, proxyPost } from "@/lib/proxy";

export async function GET(req: NextRequest) {
    return proxyGet(req, "/subscribers");
}

export async function POST(req: NextRequest) {
    return proxyPost(req, "/subscribers");
}
