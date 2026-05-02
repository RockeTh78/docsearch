import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { requestId, appointmentAt, notes } = await req.json();
  if (!requestId || !appointmentAt)
    return NextResponse.json({ error: "requestId und appointmentAt erforderlich" }, { status: 400 });

  db.prepare(`
    UPDATE requests SET status='responded', respondedAt=?, notes=?, updatedAt=datetime('now') WHERE id=?
  `).run(appointmentAt, notes ?? null, requestId);

  return NextResponse.json({ success: true });
}
