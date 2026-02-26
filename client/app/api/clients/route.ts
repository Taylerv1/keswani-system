import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

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

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const query = req.nextUrl.searchParams.toString();
    const endpoint = `${API_BASE}/clients${query ? `?${query}` : ""}`;

    const backendRes = await fetch(endpoint, {
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
        error: error instanceof Error ? error.message : "Failed to fetch clients",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const backendRes = await fetch(`${API_BASE}/clients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    return parseBackendJson(backendRes);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create client",
      },
      { status: 500 }
    );
  }
}
