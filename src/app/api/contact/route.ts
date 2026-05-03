import { NextRequest, NextResponse } from "next/server";
import type { ContactInfo, DoctorResult } from "@/types";
import { Resend } from "resend";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { upsertUser, createRequest, updateRequestStatus, setRequestResponded, getPushTokensByRequestId, logEmail } from "@/lib/db";
import { sendPushNotifications } from "@/lib/push";

interface ContactRequest {
  doctor: DoctorResult;
  contact: ContactInfo;
  problem: string;
  emailText?: string; // optional: bereits generierter & ggf. editierter Text
}

const TEST_MODE = true;
const TEST_EMAIL = "testarzt@facharzt-kontakt.org";
const COUNTER_FILE = path.join(process.cwd(), ".test-counter");

function getNextTestNumber(): string {
  try {
    const current = fs.existsSync(COUNTER_FILE)
      ? parseInt(fs.readFileSync(COUNTER_FILE, "utf-8").trim(), 10)
      : 0;
    const next = (isNaN(current) ? 0 : current) + 1;
    fs.writeFileSync(COUNTER_FILE, String(next));
    return String(next).padStart(3, "0");
  } catch {
    return String(Date.now()).slice(-3);
  }
}

function randomTestAppointment(): string {
  const now = new Date();
  // Random date: 3 to 90 days from now
  const days = 3 + Math.floor(Math.random() * 88);
  const date = new Date(now.getTime() + days * 86400000);
  // Skip weekends
  const dow = date.getDay();
  if (dow === 0) date.setDate(date.getDate() + 1);
  if (dow === 6) date.setDate(date.getDate() + 2);
  // Random time between 08:00 and 16:30 in 30-min slots
  const slots = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30"];
  const [h, m] = slots[Math.floor(Math.random() * slots.length)].split(":").map(Number);
  date.setHours(h, m, 0, 0);
  return date.toISOString().slice(0, 16) + ":00";
}

function buildContactBlockText(contact: ContactInfo): string {
  const birthDate = new Date(contact.birthDate).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const insurance = contact.insuranceType === "gesetzlich" ? "Gesetzlich (GKV)" : "Privat (PKV)";
  return [
    "Meine Kontaktdaten:",
    `Name:                ${contact.firstName} ${contact.lastName}`,
    `Geburtsdatum:      ${birthDate}`,
    `Telefon:              ${contact.phone}`,
    `E-Mail:               ${contact.email}`,
    `Versicherung:     ${insurance}`,
  ].join("\n");
}

async function generateIntro(doctor: DoctorResult, problem: string): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 300,
    messages: [
      {
        role: "system",
        content:
          "Du formulierst den Einleitungstext einer Terminanfrage-E-Mail an eine Arztpraxis. Schreibe nur 2-3 höfliche Sätze auf Deutsch: Anrede, Schilderung des Anliegens, Bitte um Termin. Kein Abschluss, keine Kontaktdaten.",
      },
      {
        role: "user",
        content: `Praxis: ${doctor.name} (${doctor.specialty})\nAnliegen: ${problem}`,
      },
    ],
  });
  return completion.choices[0]?.message?.content?.trim() ?? "";
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "RESEND_API_KEY nicht konfiguriert." }, { status: 500 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY nicht konfiguriert." }, { status: 500 });

  try {
    const { doctor, contact, problem, emailText }: ContactRequest = await req.json();

    const userId = upsertUser(contact);
    const requestId = createRequest({
      userId, doctorId: doctor.id, doctorName: doctor.name,
      specialty: doctor.specialty, address: doctor.address,
      city: doctor.city, zip: doctor.zip, phone: doctor.phone,
      email: doctor.email, website: doctor.website,
      distance: doctor.distance, problem, method: "email",
    });

    const resend = new Resend(apiKey);
    const testNumber = getNextTestNumber();

    const text = emailText ?? `${await generateIntro(doctor, problem)}\n\n${buildContactBlockText(contact)}\n\nMit freundlichen Grüßen,\n${contact.firstName} ${contact.lastName}`;

    const subject = TEST_MODE
      ? `Docsearch_test_nr_${testNumber}`
      : `Terminanfrage – ${contact.firstName} ${contact.lastName}`;
    const recipient = TEST_MODE ? TEST_EMAIL : (doctor.email ?? TEST_EMAIL);

    const inboundDomain = process.env.INBOUND_DOMAIN;
    const replyTo = inboundDomain
      ? `${contact.firstName} ${contact.lastName} <reply+${requestId}@${inboundDomain}>`
      : contact.email;

    const { data, error } = await resend.emails.send({
      from: `${contact.firstName} ${contact.lastName} <noreply@facharzt-kontakt.org>`,
      replyTo,
      to: recipient,
      subject,
      text,
    });

    if (error) {
      updateRequestStatus(requestId, "error", error.message);
      return NextResponse.json({ error: "E-Mail konnte nicht gesendet werden", details: error.message }, { status: 500 });
    }

    updateRequestStatus(requestId, "sent", `E-Mail ID: ${data?.id}`, new Date().toISOString());
    logEmail({ requestId, direction: "sent", subject, body: text, fromAddr: `${contact.firstName} ${contact.lastName} <noreply@facharzt-kontakt.org>`, toAddr: recipient });

    // Test: automatically simulate a doctor reply after 5 seconds
    setTimeout(() => {
      const suggestedAt = randomTestAppointment();
      const dateStr = new Date(suggestedAt).toLocaleString("de-DE", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
      const msg = `Sehr geehrte(r) Patient(in),\n\nvielen Dank für Ihre Terminanfrage.\n\nWir können Ihnen folgenden Termin anbieten:\n${dateStr} Uhr\n\nBitte bringen Sie Ihre Versicherungskarte sowie eventuelle Vorbefunde mit.\n\nFalls der Termin nicht passt, melden Sie sich gerne telefonisch.\n\nMit freundlichen Grüßen,\nTestpraxis Dr. med. Max Mustermann\nKönigssteiner Str. 10, 65812 Bad Soden am Taunus\nTel: +49 6196 123456`;
      setRequestResponded(requestId, suggestedAt, msg);
      const tokens = getPushTokensByRequestId(requestId);
      sendPushNotifications(tokens, "📬 Terminvorschlag erhalten", `${msg.split('\n')[0]}`);
    }, 5000);

    return NextResponse.json({
      success: true,
      requestId: requestId,
      method: "email",
      timestamp: new Date().toISOString(),
      testMode: TEST_MODE,
      testNumber,
    });
  } catch (error) {
    console.error("Contact error:", error);
    return NextResponse.json({ error: "Fehler beim Verarbeiten", details: String(error) }, { status: 500 });
  }
}
// cache-bust: 1777747318
