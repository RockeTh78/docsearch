import { NextRequest, NextResponse } from "next/server";
import type { SearchFormData, DoctorResult } from "@/types";

const SPECIALTY_MAP: Record<string, string> = {
  allgemeinmedizin: "Allgemeinmedizin",
  innere_medizin: "Innere Medizin",
  orthopadie: "Orthopädie",
  dermatologie: "Dermatologie",
  hno: "Hals-Nasen-Ohrenheilkunde",
  augenheilkunde: "Augenheilkunde",
  gynakologie: "Gynäkologie",
  urologie: "Urologie",
  neurologie: "Neurologie",
  psychiatrie: "Psychiatrie",
  kardiologie: "Innere Medizin/Kardiologie",
  zahnarzt: "Zahnmedizin",
  radiologie: "Radiologie",
  gastroenterologie: "Innere Medizin/Gastroenterologie",
  kinderheilkunde: "Kinder- und Jugendmedizin",
};

async function searchDoctors116117(
  location: string,
  specialty: string,
  radius: number
): Promise<DoctorResult[]> {
  const fachgebiet = SPECIALTY_MAP[specialty] || specialty;

  // 116117.de nutzt eine interne API – wir rufen die Suche ab
  const url = new URL("https://www.116117.de/api/arztsuche");
  url.searchParams.set("q", fachgebiet);
  url.searchParams.set("location", location);
  url.searchParams.set("radius", String(radius));

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; DocSearch/1.0)",
      Accept: "application/json",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`116117 API error: ${res.status}`);
  }

  const data = await res.json();
  return parseDoctors116117(data);
}

function parseDoctors116117(data: unknown): DoctorResult[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = data as any;
  const items = raw?.results || raw?.items || raw?.data || [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return items.map((item: any, idx: number) => ({
    id: item.id || String(idx),
    name: item.name || item.arztname || item.praxisname || "Unbekannt",
    specialty: item.fachgebiet || item.specialty || "",
    address: item.strasse || item.address || "",
    city: item.ort || item.city || "",
    zip: item.plz || item.zip || "",
    phone: item.telefon || item.phone,
    email: item.email,
    website: item.website || item.url,
    distance: item.distance || item.entfernung,
  }));
}

export async function POST(req: NextRequest) {
  try {
    const body: SearchFormData = await req.json();
    const { location, specialty, radius } = body;

    if (!location || !specialty) {
      return NextResponse.json(
        { error: "Ort und Fachrichtung sind erforderlich" },
        { status: 400 }
      );
    }

    const doctors = await searchDoctors116117(location, specialty, radius);

    return NextResponse.json({ doctors, total: doctors.length });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Suche fehlgeschlagen", details: String(error) },
      { status: 500 }
    );
  }
}
