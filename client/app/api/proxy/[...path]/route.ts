import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, getAuthToken } from "@/app/lib/auth";

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const token = await getAuthToken();

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { path } = await context.params;
  const targetPath = path.join("/");
  const search = new URL(request.url).searchParams.toString();
  const backendUrl = `${BACKEND_URL}/api/${targetPath}${search ? `?${search}` : ""}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  const contentType = request.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;

  let body: BodyInit | null = null;

  if (request.method !== "GET" && request.method !== "HEAD") {
    if (contentType?.includes("application/json")) {
      body = JSON.stringify(await request.json());
    }
  }

  try {
    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body,
    });

    const responseType = response.headers.get("content-type") || "";

    // JSON responses
    if (responseType.includes("application/json")) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    // Binary responses (PDF receipts, etc.)
    const blob = await response.blob();
    const outHeaders = new Headers();

    for (const h of ["content-type", "content-disposition", "content-length"]) {
      const v = response.headers.get(h);
      if (v) outHeaders.set(h, v);
    }

    return new NextResponse(blob, { status: response.status, headers: outHeaders });
  } catch (error) {
    console.error(`Proxy error [${request.method} /api/${targetPath}]:`, error);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
