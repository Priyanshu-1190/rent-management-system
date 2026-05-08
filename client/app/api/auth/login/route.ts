import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BACKEND_URL, COOKIE_NAME, COOKIE_OPTIONS } from "@/app/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Login failed" },
        { status: response.status },
      );
    }

    // Store JWT in httpOnly cookie — never exposed to client JS
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, data.token, COOKIE_OPTIONS);

    // Return user info only (token stays server-side)
    return NextResponse.json({ user: data.user });
  } catch (error) {
    console.error("Login proxy error:", error);
    return NextResponse.json(
      { error: "Authentication service unavailable" },
      { status: 503 },
    );
  }
}
