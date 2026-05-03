import { NextRequest, NextResponse } from "next/server";
import { getRequestsByEmail, deleteRequest } from "@/lib/db";

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

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id fehlt" }, { status: 400 });
  deleteRequest(id);
  return NextResponse.json({ success: true });
}
