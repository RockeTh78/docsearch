"use client";

import type { DoctorResult } from "@/types";

interface Props {
  results: DoctorResult[];
}

export default function ResultsList({ results }: Props) {
  if (results.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-400 text-sm">Keine Ärzte gefunden. Bitte Suchkriterien anpassen.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-700">
        {results.length} Arzt{results.length !== 1 ? "praxen" : "praxis"} gefunden
      </h2>
      {results.map((doctor) => (
        <DoctorCard key={doctor.id} doctor={doctor} />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: DoctorResult["contactStatus"] }) {
  if (!status) return null;

  const config = {
    pending: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", label: "Ausstehend" },
    sent: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", label: "Anfrage gesendet" },
    error: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Fehler" },
  }[status.status];

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
      {status.method === "email" ? "E-Mail" : "Formular"}: {config.label}
    </span>
  );
}

function DoctorCard({ doctor }: { doctor: DoctorResult }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-gray-900 text-sm">{doctor.name}</h3>
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
            {doctor.specialty}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {doctor.address}, {doctor.zip} {doctor.city}
          {doctor.distance !== undefined && (
            <span className="ml-2 text-gray-400">· {doctor.distance.toFixed(1)} km</span>
          )}
        </p>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {doctor.phone && (
            <a href={`tel:${doctor.phone}`} className="text-xs text-gray-500 hover:text-blue-600 transition-colors">
              {doctor.phone}
            </a>
          )}
          {doctor.website && (
            <a
              href={doctor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:text-blue-700 transition-colors truncate max-w-[200px]"
            >
              Website
            </a>
          )}
          {doctor.contactStatus && (
            <StatusBadge status={doctor.contactStatus} />
          )}
        </div>
        {doctor.contactStatus?.message && (
          <p className="text-xs text-gray-400 mt-1">{doctor.contactStatus.message}</p>
        )}
      </div>
    </div>
  );
}
