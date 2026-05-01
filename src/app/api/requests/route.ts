import { NextRequest, NextResponse } from "next/server";
import { getRequestsByEmail } from "@/lib/db";

// GET /api/requests?email=... — alle Anfragen eines Users
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email Parameter fehlt" }, { status: 400 });
  }

  const requests = getRequestsByEmail(email);
  return NextResponse.json({ requests });
}
