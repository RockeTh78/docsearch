import { NextRequest, NextResponse } from "next/server";
import { getRequestsByEmail } from "@/lib/db";

// GET /api/requests?email=... — alle Anfragen eines Users
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email Parameter fehlt" }, { status: 400 });
  }

  const raw = getRequestsByEmail(email) as Record<string, unknown>[];
  const requests = raw.map(r => ({
    ...r,
    doctorEmail: r.email,
  }));
  return NextResponse.json({ requests });
}
