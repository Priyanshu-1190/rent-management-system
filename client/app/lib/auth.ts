import { cookies } from "next/headers";

export const COOKIE_NAME = "auth_token";
if (!process.env.BACKEND_URL) {
  throw new Error("Missing required environment variable: BACKEND_URL");
}
export const BACKEND_URL = process.env.BACKEND_URL;

export const COOKIE_OPTIONS: {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60, // 7 days — matches backend JWT expiry
};

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

/**
 * Decode a JWT payload without verification.
 * This runs server-side only — the backend still verifies on every request.
 */
export function decodeJwtPayload(
  token: string,
): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], "base64url").toString("utf-8");
    return JSON.parse(payload);
  } catch {
    return null;
  }
}
