import { NextRequest, NextResponse } from "next/server";
import type { ContactInfo, DoctorResult } from "@/types";
import nodemailer from "nodemailer";

interface ContactRequest {
  doctor: DoctorResult;
  contact: ContactInfo;
  problem: string;
}

function buildEmailText(contact: ContactInfo, doctor: DoctorResult, problem: string): string {
  const birthDate = new Date(contact.birthDate).toLocaleDateString("de-DE");
  return `Sehr geehrte Damen und Herren,

ich wende mich an Sie mit der Bitte um einen Termin in Ihrer Praxis.

Meine Angaben:
Name: ${contact.firstName} ${contact.lastName}
Geburtsdatum: ${birthDate}
Telefon: ${contact.phone}
E-Mail: ${contact.email}
Versicherung: ${contact.insuranceType === "gesetzlich" ? "Gesetzlich versichert (GKV)" : "Privat versichert (PKV)"}

Mein Anliegen:
${problem}

Ich bitte Sie, mich unter den oben angegebenen Kontaktdaten zu kontaktieren, um einen passenden Termin zu vereinbaren.

Mit freundlichen Grüßen,
${contact.firstName} ${contact.lastName}`;
}

export async function POST(req: NextRequest) {
  try {
    const { doctor, contact, problem }: ContactRequest = await req.json();

    if (!doctor.email) {
      return NextResponse.json(
        { error: "Keine E-Mail-Adresse für diese Praxis verfügbar" },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const birthDate = new Date(contact.birthDate).toLocaleDateString("de-DE");
    const subject = `Terminanfrage – ${contact.firstName} ${contact.lastName} (geb. ${birthDate})`;

    await transporter.sendMail({
      from: `"${contact.firstName} ${contact.lastName}" <${process.env.SMTP_USER}>`,
      replyTo: contact.email,
      to: doctor.email,
      subject,
      text: buildEmailText(contact, doctor, problem),
    });

    return NextResponse.json({
      success: true,
      method: "email",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Contact error:", error);
    return NextResponse.json(
      { error: "E-Mail konnte nicht gesendet werden", details: String(error) },
      { status: 500 }
    );
  }
}
