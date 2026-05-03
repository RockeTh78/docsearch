import { NextRequest, NextResponse } from "next/server";
import type { SearchFormData, DoctorResult } from "@/types";
import { searchLocalDoctors, getDoctorCount } from "@/lib/db";

// Werte entsprechen dem OSM-Tag healthcare:speciality
const SPECIALTY_OSM: Record<string, string[]> = {
  allgemeinmedizin:  ["general"],
  innere_medizin:    ["internal"],
  orthopadie:        ["orthopaedics"],
  dermatologie:      ["dermatology"],
  hno:               ["otolaryngology"],
  augenheilkunde:    ["ophthalmology"],
  gynakologie:       ["gynaecology"],
  urologie:          ["urology"],
  neurologie:        ["neurology"],
  psychiatrie:       ["psychiatry", "psychotherapist"],
  kardiologie:       ["cardiology"],
  zahnarzt:          ["dentist"],
  radiologie:        ["radiology"],
  gastroenterologie: ["gastroenterology"],
  kinderheilkunde:   ["paediatrics"],
};

async function geocode(location: string): Promise<{ lat: number; lon: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)},Deutschland&format=json&limit=1&countrycodes=de`;
  const res = await fetch(url, {
    headers: { "User-Agent": "DocSearch/1.0 (hoche@me.com)" },
  });
  const data = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

function buildOverpassQuery(lat: number, lon: number, radiusM: number, specialty: string): string {
  const specialities = SPECIALTY_OSM[specialty] ?? ["general"];

  const filters = specialities
    .flatMap((s) => [
      `node["healthcare:speciality"="${s}"](around:${radiusM},${lat},${lon});`,
      `way["healthcare:speciality"="${s}"](around:${radiusM},${lat},${lon});`,
    ])
    .join("\n  ");

  // Zahnarzt extra via amenity=dentist (häufiger getaggt)
  const dentistExtra = specialty === "zahnarzt"
    ? `node["amenity"="dentist"](around:${radiusM},${lat},${lon});\n  node["healthcare"="dentist"](around:${radiusM},${lat},${lon});`
    : "";

  return `[out:json][timeout:25];
(
  ${filters}
  ${dentistExtra}
);
out body;`;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseOsmNode(node: any, centerLat: number, centerLon: number, specialty: string): DoctorResult {
  const tags = node.tags ?? {};
  const name = tags.name ?? tags["name:de"] ?? "Unbekannte Praxis";
  const street = tags["addr:street"] ?? "";
  const housenumber = tags["addr:housenumber"] ?? "";
  const address = [street, housenumber].filter(Boolean).join(" ");

  return {
    id: String(node.id),
    name,
    specialty: tags["healthcare:speciality"] ?? tags.healthcare ?? specialty,
    address,
    city: tags["addr:city"] ?? tags["addr:suburb"] ?? "",
    zip: tags["addr:postcode"] ?? "",
    phone: tags.phone ?? tags["contact:phone"],
    email: tags.email ?? tags["contact:email"],
    website: tags.website ?? tags["contact:website"],
    distance: haversineKm(centerLat, centerLon, node.lat, node.lon),
  };
}

const TEST_DOCTOR: DoctorResult = {
  id: "test-doctor-bad-soden-1",
  name: "Testpraxis Dr. med. Max Mustermann",
  specialty: "general",
  address: "Königsteiner Str. 10",
  city: "Bad Soden am Taunus",
  zip: "65812",
  phone: "+49 6196 123456",
  email: "testarzt@facharzt-kontakt.org",
  website: "https://facharzt-kontakt.org",
  distance: 0.1,
};

export async function POST(req: NextRequest) {
  try {
    const body: SearchFormData = await req.json();
    const { location, specialty, radius } = body;

    if (!location || !specialty) {
      return NextResponse.json({ error: "Ort und Fachrichtung sind erforderlich" }, { status: 400 });
    }

    const coords = await geocode(location);
    if (!coords) {
      return NextResponse.json({ error: `Ort "${location}" nicht gefunden` }, { status: 404 });
    }

    const radiusM = radius * 1000;
    const query = buildOverpassQuery(coords.lat, coords.lon, radiusM, specialty);

    const overpassRes = await fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
      { headers: { "Accept": "application/json", "User-Agent": "DocSearch/1.0 (hoche@me.com)" } }
    );

    if (!overpassRes.ok) throw new Error(`Overpass API Fehler: ${overpassRes.status}`);

    // Testphase: lokale Testärzte haben Vorrang — wenn DB befüllt, nur diese zurückgeben
    const localCount = getDoctorCount();
    if (localCount > 0) {
      const localDoctors = searchLocalDoctors(coords.lat, coords.lon, radiusM / 1000, specialty);
      const results: DoctorResult[] = localDoctors
        .sort((a, b) => ((a as any).distance ?? 0) - ((b as any).distance ?? 0))
        .map(d => ({
          id: d.id,
          name: d.name,
          specialty: d.specialty,
          address: d.address,
          city: d.city,
          zip: d.zip,
          phone: d.phone,
          email: d.email,
          website: d.website,
          distance: (d as any).distance,
        }));
      // Always include the test doctor at top
      const normalizedLocation = location.toLowerCase();
      const isBadSoden = normalizedLocation.includes("bad soden") || normalizedLocation.includes("65812");
      if (isBadSoden) results.unshift({ ...TEST_DOCTOR, specialty });
      return NextResponse.json({ doctors: results, total: results.length });
    }

    const overpassData = await overpassRes.json();
    const doctors: DoctorResult[] = (overpassData.elements ?? [])
      .map((node: unknown) => parseOsmNode(node, coords.lat, coords.lon, specialty))
      .filter((d: DoctorResult) => d.name !== "Unbekannte Praxis" || d.address)
      .sort((a: DoctorResult, b: DoctorResult) => (a.distance ?? 0) - (b.distance ?? 0));

    // Inject test doctor at top for Bad Soden searches
    const normalizedLocation = location.toLowerCase();
    const isBadSoden = normalizedLocation.includes("bad soden") || normalizedLocation.includes("65812");
    if (isBadSoden) {
      doctors.unshift({ ...TEST_DOCTOR, specialty });
    }

    return NextResponse.json({ doctors, total: doctors.length });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Suche fehlgeschlagen", details: String(error) }, { status: 500 });
  }
}
