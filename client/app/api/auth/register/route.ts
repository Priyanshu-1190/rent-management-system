import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/app/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || data.message || "Registration failed" },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Register proxy error:", error);
    return NextResponse.json(
      { error: "Registration service unavailable" },
      { status: 503 },
    );
  }
}
