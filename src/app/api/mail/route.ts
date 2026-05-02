import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getInboxEmails, markEmailRead, markEmailReplied } from "@/lib/db";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET() {
  const emails = getInboxEmails();
  return NextResponse.json({ emails }, { headers: CORS });
}

export async function POST(req: NextRequest) {
  const { emailId, to, subject, body } = await req.json();
  if (!to || !subject || !body)
    return NextResponse.json({ error: "to, subject und body erforderlich" }, { status: 400, headers: CORS });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "RESEND_API_KEY fehlt" }, { status: 500, headers: CORS });

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: "Testpraxis Dr. Mustermann <testarzt@facharzt-kontakt.org>",
    replyTo: "testarzt@facharzt-kontakt.org",
    to,
    subject,
    text: body,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  }

  if (emailId) {
    markEmailRead(emailId);
    markEmailReplied(emailId);
  }

  return NextResponse.json({ success: true }, { headers: CORS });
}
