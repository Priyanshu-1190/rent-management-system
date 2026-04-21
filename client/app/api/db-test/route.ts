import { NextResponse } from "next/server";

const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";

export async function GET() {
  try {
    const response = await fetch(`${backendUrl}/db-test`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Backend responded with status ${response.status}. Make sure the Express server is running on ${backendUrl}.`,
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
        error: `Backend is not reachable at ${backendUrl}. Start it with: cd server && npm run dev`,
      },
      { status: 503 }
    );
  }
}
