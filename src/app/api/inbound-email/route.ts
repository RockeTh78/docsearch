import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { setRequestResponded, storeInboxEmail } from "@/lib/db";

async function extractAppointmentDate(emailBody: string): Promise<string | null> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const result = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 100,
    messages: [
      {
        role: "system",
        content:
          "Extrahiere das Datum und die Uhrzeit eines Arzttermins aus dem folgenden E-Mail-Text. Antworte NUR mit einem ISO-8601-Datetime-String (z.B. '2026-05-20T10:30:00') oder 'null' wenn kein Termin gefunden wurde. Keine weitere Erklärung.",
      },
      { role: "user", content: emailBody },
    ],
  });
  const text = result.choices[0]?.message?.content?.trim() ?? "null";
  if (text === "null" || !text.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)) return null;
  return text;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const recipient  = (formData.get("recipient")   as string) ?? "";
    const sender     = (formData.get("sender")       as string) ?? "";
    const fromFull   = (formData.get("from")         as string) ?? sender;
    const bodyPlain  = (formData.get("body-plain")   as string) ?? "";
    const subject    = (formData.get("subject")      as string) ?? "(kein Betreff)";
    const replyTo    = (formData.get("reply-to")     as string) ?? "";

    // Parse display name from "Name <addr>" format
    const nameMatch = fromFull.match(/^(.+?)\s*<[^>]+>/);
    const fromName  = nameMatch ? nameMatch[1].trim() : undefined;
    const fromAddr  = sender || fromFull.replace(/.*<([^>]+)>.*/, "$1");

    // --- Arztpraxis-Eingang: testarzt@ → Inbox speichern ---
    if (recipient.toLowerCase().includes("testarzt@")) {
      storeInboxEmail({
        from_addr: fromAddr,
        from_name: fromName,
        to_addr: recipient,
        subject,
        body: bodyPlain,
        reply_to: replyTo || fromAddr,
      });
      return NextResponse.json({ success: true, stored: "inbox" });
    }

    // --- Patienten-Antwort: reply+{requestId}@ → Terminvorschlag extrahieren ---
    const match = recipient.match(/reply\+([^@]+)@/);
    if (!match) {
      return NextResponse.json({ error: "Unbekannte Empfängeradresse" }, { status: 400 });
    }
    const requestId = match[1];

    const suggestedAt = await extractAppointmentDate(`Betreff: ${subject}\n\n${bodyPlain}`);
    if (!suggestedAt) {
      return NextResponse.json({ message: "Kein Termin in der E-Mail gefunden" });
    }

    setRequestResponded(requestId, suggestedAt, bodyPlain);
    return NextResponse.json({ success: true, requestId, suggestedAt });

  } catch (e: any) {
    console.error("inbound-email error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
