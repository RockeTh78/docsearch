import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import {
  getRequestWithUser, confirmRequest,
  markInboxEmailRepliedByRequestId,
  setRequestCounterProposed, setRequestCancelled, setRequestResponded,
  getPushTokensByRequestId, logEmail,
} from "@/lib/db";
import { sendPushNotifications } from "@/lib/push";

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
    "---",
    "Meine Kontaktdaten:",
    `Name:         ${row.firstName} ${row.lastName}`,
    `Telefon:      ${row.phone}`,
    `E-Mail:       ${row.userEmail}`,
  ].join("\n");
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "RESEND_API_KEY fehlt" }, { status: 500 });

  const { requestId, type, appointmentAt, alternatives, weekdays, timeRange, customText } = await req.json();
  if (!requestId || !type)
    return NextResponse.json({ error: "requestId und type erforderlich" }, { status: 400 });

  const row = getRequestWithUser(requestId);
  if (!row) return NextResponse.json({ error: "Anfrage nicht gefunden" }, { status: 404 });

  const firstName = row.firstName as string;
  const lastName = row.lastName as string;
  const userEmail = row.userEmail as string;
  const doctorEmail = row.email as string | undefined;
  const suggestedAt = row.suggestedAt as string | undefined;
  const inboundDomain = process.env.INBOUND_DOMAIN;
  const replyToAddr = inboundDomain
    ? `reply+${requestId}@${inboundDomain}`
    : userEmail;

  const contactBlock = buildContactBlock(row);
  let subject: string;
  let text: string;

  // Encode requestId in subject so mail client can route reply back even without Reply-To header
  const reqTag = `[REQ:${requestId}]`;

  if (type === "confirm") {
    const apptDate = (appointmentAt ?? suggestedAt) as string;
    subject = `Terminbestätigung – ${firstName} ${lastName}`;
    text = customText ?? `Sehr geehrte Damen und Herren,

vielen Dank für Ihre Rückmeldung. Ich bestätige hiermit den Termin am ${formatDE(apptDate)} Uhr und freue mich auf das Gespräch.

Mit freundlichen Grüßen,
${firstName} ${lastName}

${contactBlock}`;

  } else if (type === "simple_request") {
    subject = `${reqTag} Terminanfrage – ${firstName} ${lastName}`;
    text = customText ?? `Sehr geehrte Damen und Herren,

vielen Dank für Ihren Terminvorschlag${suggestedAt ? ` am ${formatDE(suggestedAt)} Uhr` : ""}. Leider kann ich diesen Termin nicht wahrnehmen.

Bitte teilen Sie mir einen neuen Terminvorschlag mit.

Mit freundlichen Grüßen,
${firstName} ${lastName}

${contactBlock}`;

  } else if (type === "counter") {
    subject = `${reqTag} Terminanfrage – ${firstName} ${lastName}`;
    if (customText) {
      text = customText;
    } else if (weekdays?.length || timeRange) {
      const dayList = (weekdays as string[] ?? []).join(", ");
      const timeLabel = timeRange === "morning" ? "Vormittags (8:00–12:00 Uhr)"
        : timeRange === "afternoon" ? "Nachmittags (12:00–17:00 Uhr)"
        : "Ganztags";
      text = `Sehr geehrte Damen und Herren,

vielen Dank für Ihren Terminvorschlag${suggestedAt ? ` am ${formatDE(suggestedAt)} Uhr` : ""}. Leider kann ich diesen Termin nicht wahrnehmen.

Ich würde bevorzugt an folgendem Tag / folgenden Tagen kommen:
${dayList || "Flexibel"}
Zeitpräferenz: ${timeLabel}

Bitte teilen Sie mir einen passenden Termin mit.

Mit freundlichen Grüßen,
${firstName} ${lastName}

${contactBlock}`;
    } else {
      const alts = (alternatives as string[]) ?? [];
      const listText = alts
        .map((a, i) => `  • Option ${i + 1}: ${formatDE(a)} Uhr`)
        .join("\n");
      text = `Sehr geehrte Damen und Herren,

vielen Dank für Ihre Rückmeldung. Leider kann ich den vorgeschlagenen Termin${suggestedAt ? ` am ${formatDE(suggestedAt)} Uhr` : ""} nicht wahrnehmen. Ich schlage folgende Alternativen vor:

${listText}

Bitte teilen Sie mir mit, welcher Termin passt.

Mit freundlichen Grüßen,
${firstName} ${lastName}

${contactBlock}`;
    }

  } else if (type === "cancel") {
    const apptDate = (appointmentAt ?? suggestedAt) as string | undefined;
    subject = `Terminabsage – ${firstName} ${lastName}`;
    text = customText ?? `Sehr geehrte Damen und Herren,

leider muss ich den vereinbarten Termin${apptDate ? ` am ${formatDE(apptDate)} Uhr` : ""} absagen.

Ich bitte um Entschuldigung für die Unannehmlichkeiten.

Mit freundlichen Grüßen,
${firstName} ${lastName}

${contactBlock}`;

  } else {
    return NextResponse.json({ error: "Ungültiger type" }, { status: 400 });
  }

  const recipient = TEST_MODE ? TEST_EMAIL : (doctorEmail ?? TEST_EMAIL);
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: `${firstName} ${lastName} <noreply@facharzt-kontakt.org>`,
    replyTo: replyToAddr,
    to: recipient,
    subject,
    text,
  });

  if (error) {
    return NextResponse.json({ error: "E-Mail konnte nicht gesendet werden", details: error.message }, { status: 500 });
  }

  // Forward copy to user's own email
  if (userEmail && userEmail !== recipient) {
    resend.emails.send({
      from: "DocsSearch <noreply@facharzt-kontakt.org>",
      to: userEmail,
      subject: `[Kopie] ${subject}`,
      text: `Dies ist eine Kopie der E-Mail, die in Ihrem Namen an ${row.doctorName} gesendet wurde:\n\n---\n${text}`,
    }).catch(() => {});
  }

  if (type === "confirm" && (appointmentAt ?? suggestedAt)) {
    confirmRequest(requestId, (appointmentAt ?? suggestedAt) as string);
  } else if (type === "counter" || type === "simple_request") {
    setRequestCounterProposed(requestId);
    // Auto-simulate new doctor response after 8 seconds (test mode)
    setTimeout(() => {
      const now = new Date();
      const days = 3 + Math.floor(Math.random() * 14);
      const date = new Date(now.getTime() + days * 86400000);
      if (date.getDay() === 0) date.setDate(date.getDate() + 1);
      if (date.getDay() === 6) date.setDate(date.getDate() + 2);
      const slots = ["08:00","09:00","10:00","10:30","11:00","14:00","15:00","15:30","16:00"];
      const [h, m] = slots[Math.floor(Math.random() * slots.length)].split(":").map(Number);
      date.setHours(h, m, 0, 0);
      const suggestedNewAt = date.toISOString().slice(0, 16) + ":00";
      const dateStr = date.toLocaleString("de-DE", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
      const msg = `Sehr geehrte(r) Patient(in),\n\nvielen Dank für Ihre Rückmeldung.\n\nWir bieten Ihnen folgenden neuen Termin an:\n${dateStr} Uhr\n\nBitte bringen Sie Ihre Versicherungskarte sowie eventuelle Vorbefunde mit.\n\nMit freundlichen Grüßen,\n[Testarzt] Testpraxis Dr. med. Max Mustermann\nKönigssteiner Str. 10, 65812 Bad Soden am Taunus\nTel: +49 6196 123456`;
      setRequestResponded(requestId, suggestedNewAt, msg);
      const tokens = getPushTokensByRequestId(requestId);
      sendPushNotifications(tokens, "📬 Neuer Terminvorschlag", dateStr + " Uhr");
    }, 8000);
  } else if (type === "cancel") {
    setRequestCancelled(requestId);
  }

  markInboxEmailRepliedByRequestId(requestId);
  logEmail({ requestId, direction: "sent", subject, body: text, fromAddr: `${firstName} ${lastName} <noreply@facharzt-kontakt.org>`, toAddr: recipient });

  return NextResponse.json({ success: true });
}
