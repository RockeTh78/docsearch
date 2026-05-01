import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { DoctorResult, ContactInfo } from "@/types";

interface PreviewRequest {
  doctor: DoctorResult;
  contact: ContactInfo;
  problem: string;
}

function buildContactBlock(contact: ContactInfo): string {
  const birthDate = new Date(contact.birthDate).toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
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

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY)
    return NextResponse.json({ error: "OPENAI_API_KEY nicht konfiguriert." }, { status: 500 });

  const { doctor, contact, problem }: PreviewRequest = await req.json();

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

  const intro = completion.choices[0]?.message?.content?.trim() ?? "";
  const contactBlock = buildContactBlock(contact);
  const fullText = `${intro}\n\n${contactBlock}\n\nMit freundlichen Grüßen,\n${contact.firstName} ${contact.lastName}`;

  return NextResponse.json({ intro, contactBlock, fullText });
}
