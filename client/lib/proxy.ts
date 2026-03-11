// ============================================================
// Shared Authenticated Proxy Utility
// Used by all Next.js API route handlers to forward requests
// to the Express backend with automatic token refresh on 401.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { refreshToken as backendRefreshToken } from "@/features/auth/api/auth";

const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000/api";

// -------------------------------------------
// Parse backend response into NextResponse
// -------------------------------------------
function parseBackendResponse(response: Response, body: string): NextResponse {
    const trimmed = body.trim();

    if (!trimmed) {
        if (response.ok) {
            return NextResponse.json({ success: true, data: null }, { status: response.status });
        }
        return NextResponse.json(
            { success: false, error: `Backend returned empty response (status ${response.status})` },
            { status: response.status }
        );
    }

    try {
        const parsed = JSON.parse(trimmed);
        return NextResponse.json(parsed, { status: response.status });
    } catch {
        return NextResponse.json(
            { success: false, error: `Backend returned non-JSON response (status ${response.status})` },
            { status: response.status }
        );
    }
}

// -------------------------------------------
// Try refreshing the token using refresh_token cookie
// Returns new tokens on success, null on failure
// -------------------------------------------
async function tryRefreshToken(
    refreshTokenValue: string
): Promise<{ token: string; refresh_token: string } | null> {
    try {
        const result = await backendRefreshToken(refreshTokenValue);
        if (result.success && result.data) {
            return { token: result.data.token, refresh_token: result.data.refresh_token };
        }
        return null;
    } catch {
        return null;
    }
}

// -------------------------------------------
// Core proxy function
// -------------------------------------------
type ProxyOptions = {
    req: NextRequest;
    method: string;
    backendPath: string;
    body?: string | null;
    extraHeaders?: Record<string, string>;
};

export async function proxyToBackend({
    req,
    method,
    backendPath,
    body = null,
    extraHeaders = {},
}: ProxyOptions): Promise<NextResponse> {
    const token = req.cookies.get("auth_token")?.value;

    if (!token) {
        return NextResponse.json(
            { success: false, error: "Not authenticated" },
            { status: 401 }
        );
    }

    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        ...extraHeaders,
    };
    if (body) {
        headers["Content-Type"] = "application/json";
    }

    const url = `${API_BASE}${backendPath}`;
    const fetchOptions: RequestInit = {
        method,
        headers,
        cache: "no-store",
    };
    if (body) {
        fetchOptions.body = body;
    }

    // First attempt
    const backendRes = await fetch(url, fetchOptions);
    const responseBody = await backendRes.text();

    // If not 401, return as-is
    if (backendRes.status !== 401) {
        return parseBackendResponse(backendRes, responseBody);
    }

    // Got 401 — attempt token refresh
    const refreshTokenValue = req.cookies.get("refresh_token")?.value;
    if (!refreshTokenValue) {
        return parseBackendResponse(backendRes, responseBody);
    }

    const newTokens = await tryRefreshToken(refreshTokenValue);
    if (!newTokens) {
        // Refresh failed — return original 401 and clear cookies
        const response = parseBackendResponse(backendRes, responseBody);
        response.cookies.set("auth_token", "", { maxAge: 0, path: "/" });
        response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
        response.cookies.set("user_data", "", { maxAge: 0, path: "/" });
        response.cookies.set("remember_me", "", { maxAge: 0, path: "/" });
        return response;
    }

    // Retry with new token
    const retryHeaders: Record<string, string> = {
        Authorization: `Bearer ${newTokens.token}`,
        ...extraHeaders,
    };
    if (body) {
        retryHeaders["Content-Type"] = "application/json";
    }

    const retryOptions: RequestInit = {
        method,
        headers: retryHeaders,
        cache: "no-store",
    };
    if (body) {
        retryOptions.body = body;
    }

    const retryRes = await fetch(url, retryOptions);
    const retryBody = await retryRes.text();
    const response = parseBackendResponse(retryRes, retryBody);

    // Set updated cookies with new tokens
    const isProduction = process.env.NODE_ENV === "production";
    const remembered = req.cookies.get("remember_me")?.value === "1";

    const accessTokenMaxAge = remembered ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7;
    const refreshTokenMaxAge = remembered ? 60 * 60 * 24 * 90 : 60 * 60 * 24 * 30;

    const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax" as const,
        path: "/",
    };

    response.cookies.set("auth_token", newTokens.token, {
        ...cookieOptions,
        maxAge: accessTokenMaxAge,
    });
    response.cookies.set("refresh_token", newTokens.refresh_token, {
        ...cookieOptions,
        maxAge: refreshTokenMaxAge,
    });
    response.cookies.set("remember_me", remembered ? "1" : "0", {
        httpOnly: false,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: refreshTokenMaxAge,
    });

    return response;
}

// -------------------------------------------
// Build backend path with optional query string
// -------------------------------------------
function withQuery(backendPath: string, req: NextRequest): string {
    const query = req.nextUrl.searchParams.toString();
    return query ? `${backendPath}?${query}` : backendPath;
}

// -------------------------------------------
// Convenience helpers for route handlers
// -------------------------------------------
export function proxyGet(req: NextRequest, backendPath: string): Promise<NextResponse> {
    return proxyToBackend({ req, method: "GET", backendPath: withQuery(backendPath, req) });
}

export async function proxyPost(req: NextRequest, backendPath: string): Promise<NextResponse> {
    const body = await req.text();
    return proxyToBackend({ req, method: "POST", backendPath, body: body || null });
}

export async function proxyPatch(req: NextRequest, backendPath: string): Promise<NextResponse> {
    const body = await req.text();
    return proxyToBackend({ req, method: "PATCH", backendPath: withQuery(backendPath, req), body: body || null });
}

export async function proxyPut(req: NextRequest, backendPath: string): Promise<NextResponse> {
    const body = await req.text();
    return proxyToBackend({ req, method: "PUT", backendPath, body: body || null });
}

export async function proxyDelete(req: NextRequest, backendPath: string): Promise<NextResponse> {
    return proxyToBackend({ req, method: "DELETE", backendPath });
}
