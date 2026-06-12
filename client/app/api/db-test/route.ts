import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/app/lib/auth";

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/db-test`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Backend responded with status ${response.status}. Make sure the Express server is running on ${BACKEND_URL}.`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Proxy request to backend failed:", error);

    return NextResponse.json(
      {
        error: `Backend is not reachable at ${BACKEND_URL}. Start it with: cd server && npm run dev`,
      },
      { status: 503 }
    );
  }
}
