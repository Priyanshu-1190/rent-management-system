import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, getAuthToken } from "@/app/lib/auth";

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const token = await getAuthToken();

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { path } = await context.params;

  // Security fix: Prevent path traversal and malicious path manipulation
  if (path.some((segment) => segment === ".." || segment === "." || segment.includes("/") || segment.includes("\\"))) {
    console.warn(`Blocked potential path traversal attempt: ${path.join("/")}`);
    return NextResponse.json({ error: "Invalid path segments" }, { status: 400 });
  }

  const targetPath = path.join("/");
  
  // SSRF Protection: Use the URL constructor to safely resolve the target path against the BACKEND_URL
  let backendUrl: string;
  try {
    const baseUrl = new URL(BACKEND_URL);
    const resolvedUrl = new URL(`/api/${targetPath}`, baseUrl);
    
    // Copy search params from the original request
    const searchParams = new URL(request.url).searchParams;
    searchParams.forEach((value, key) => {
      resolvedUrl.searchParams.append(key, value);
    });

    // Final safety check: ensure we haven't been tricked into a different origin
    if (resolvedUrl.origin !== baseUrl.origin) {
      throw new Error("Origin mismatch");
    }
    
    backendUrl = resolvedUrl.toString();
  } catch (err) {
    console.warn(`Blocked potential SSRF attempt or invalid URL: /api/${targetPath}`);
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

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
