import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getRequestWithUser, confirmRequest } from "@/lib/db";

const TEST_MODE = true;
const TEST_EMAIL = "testarzt@facharzt-kontakt.org";

function formatDE(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", {
    weekday: "long", day: "2-digit", month: "2-digit",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function buildContactBlock(row: Record<string, unknown>): string {
  return [
    "Meine Kontaktdaten:",
    `Name:         ${row.firstName} ${row.lastName}`,
    `Telefon:      ${row.phone}`,
    `E-Mail:       ${row.userEmail}`,
  ].join("\n");
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "RESEND_API_KEY fehlt" }, { status: 500 });

  const { requestId, type, appointmentAt, alternatives } = await req.json();
  if (!requestId || !type)
    return NextResponse.json({ error: "requestId und type erforderlich" }, { status: 400 });

  const row = getRequestWithUser(requestId);
  if (!row) return NextResponse.json({ error: "Anfrage nicht gefunden" }, { status: 404 });

  const firstName = row.firstName as string;
  const lastName = row.lastName as string;
  const userEmail = row.userEmail as string;
  const doctorEmail = row.email as string | undefined;
  const suggestedAt = row.suggestedAt as string | undefined;
  const contactBlock = buildContactBlock(row);

  let subject: string;
  let text: string;

  if (type === "confirm") {
    const apptDate = (appointmentAt ?? suggestedAt) as string;
    subject = `Terminbestätigung – ${firstName} ${lastName}`;
    text = `Sehr geehrte Damen und Herren,

vielen Dank für Ihre Rückmeldung. Ich bestätige hiermit den Termin am ${formatDE(apptDate)} Uhr und freue mich auf das Gespräch.

Mit freundlichen Grüßen,
${firstName} ${lastName}

---
${contactBlock}`;
  } else if (type === "counter") {
    const alts = (alternatives as string[]) ?? [];
    const listText = alts
      .map((a, i) => `  • Option ${i + 1}: ${formatDE(a)} Uhr`)
      .join("\n");
    subject = `Terminanfrage – ${firstName} ${lastName}`;
    text = `Sehr geehrte Damen und Herren,

vielen Dank für Ihre Rückmeldung. Leider kann ich den vorgeschlagenen Termin${suggestedAt ? ` am ${formatDE(suggestedAt)} Uhr` : ""} leider nicht wahrnehmen. Ich würde gerne einen der folgenden Termine vorschlagen:

${listText}

Bitte teilen Sie mir mit, welcher Termin für Sie passt.

Mit freundlichen Grüßen,
${firstName} ${lastName}

---
${contactBlock}`;
  } else {
    return NextResponse.json({ error: "Ungültiger type: confirm oder counter erwartet" }, { status: 400 });
  }

  const recipient = TEST_MODE ? TEST_EMAIL : (doctorEmail ?? TEST_EMAIL);
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: `${firstName} ${lastName} <noreply@facharzt-kontakt.org>`,
    replyTo: userEmail,
    to: recipient,
    subject,
    text,
  });

  if (error) {
    return NextResponse.json({ error: "E-Mail konnte nicht gesendet werden", details: error.message }, { status: 500 });
  }

  if (type === "confirm" && (appointmentAt ?? suggestedAt)) {
    confirmRequest(requestId, (appointmentAt ?? suggestedAt) as string);
  }

  return NextResponse.json({ success: true });
}
