import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function parseBackendJson(response: Response) {
  const raw = await response.text();
  const trimmed = raw.trim();

  if (!trimmed) {
    if (response.ok) {
      return NextResponse.json({ success: true, data: null }, { status: response.status });
    }

    return NextResponse.json(
      {
        success: false,
        error: `Backend returned empty response (status ${response.status})`,
      },
      { status: response.status }
    );
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return NextResponse.json(parsed, { status: response.status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: `Backend returned non-JSON response (status ${response.status})`,
      },
      { status: response.status }
    );
  }
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const token = req.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const backendRes = await fetch(`${API_BASE}/bills/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    return parseBackendJson(backendRes);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch bill",
      },
      { status: 500 }
    );
  }
}
