import { NextResponse } from "next/server";
import { upsertDoctor, getDoctorCount } from "@/lib/db";
import { generateSeedDoctors } from "@/lib/seed-doctors";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET() {
  const count = getDoctorCount();
  return NextResponse.json({ count }, { headers: CORS });
}

export async function POST() {
  const doctors = generateSeedDoctors();
  for (const d of doctors) {
    upsertDoctor(d);
  }
  const count = getDoctorCount();
  return NextResponse.json({ inserted: doctors.length, total: count }, { headers: CORS });
}
