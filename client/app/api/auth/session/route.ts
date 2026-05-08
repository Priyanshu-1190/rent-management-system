import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  BACKEND_URL,
  COOKIE_NAME,
  COOKIE_OPTIONS,
  getAuthToken,
  decodeJwtPayload,
} from "@/app/lib/auth";

/** GET — restore session from the httpOnly cookie */
export async function GET() {
  const token = await getAuthToken();

  if (!token) {
    return NextResponse.json({ user: null });
  }

  const payload = decodeJwtPayload(token);

  if (!payload) {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
    return NextResponse.json({ user: null });
  }

  // Check expiry
  if (
    typeof payload.exp === "number" &&
    payload.exp * 1000 < Date.now()
  ) {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    },
  });
}

/** DELETE — delete the user's account, then clear the cookie */
export async function DELETE() {
  const token = await getAuthToken();

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to delete account" },
        { status: response.status },
      );
    }

    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete account proxy error:", error);
    return NextResponse.json(
      { error: "Service unavailable" },
      { status: 503 },
    );
  }
}
