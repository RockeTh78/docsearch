import { NextRequest, NextResponse } from "next/server";
import { upsertPushToken } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { email, token } = await req.json();
  if (!email || !token)
    return NextResponse.json({ error: "email und token erforderlich" }, { status: 400 });
  upsertPushToken(email, token);
  return NextResponse.json({ success: true });
}
