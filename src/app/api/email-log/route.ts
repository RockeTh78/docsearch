import { NextRequest, NextResponse } from "next/server";
import { getEmailLogByRequestId } from "@/lib/db";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const requestId = req.nextUrl.searchParams.get("requestId");
  if (!requestId) return NextResponse.json({ error: "requestId fehlt" }, { status: 400, headers: CORS });
  const logs = getEmailLogByRequestId(requestId);
  return NextResponse.json({ logs }, { headers: CORS });
}
