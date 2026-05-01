"use client";

import { useState } from "react";
import type { DoctorResult } from "@/types";

interface Props {
  results: DoctorResult[];
  onSendRequests: (selectedIds: string[]) => void;
  sending: boolean;
}

export default function ResultsList({ results, onSendRequests, sending }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-400 text-sm">Keine Ärzte gefunden. Bitte Suchkriterien anpassen.</p>
      </div>
    );
  }

  function toggleAll() {
    const contactable = results.filter((d) => !d.contactStatus);
    if (selected.size === contactable.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(contactable.map((d) => d.id)));
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleSend() {
    onSendRequests(Array.from(selected));
    setSelected(new Set());
  }

  const contactable = results.filter((d) => !d.contactStatus);
  const allSelected = contactable.length > 0 && selected.size === contactable.length;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">
            {results.length} Arzt{results.length !== 1 ? "praxen" : "praxis"} gefunden
          </span>
          {contactable.length > 0 && (
            <button
              onClick={toggleAll}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              {allSelected ? "Alle abwählen" : "Alle auswählen"}
            </button>
          )}
        </div>

        {selected.size > 0 && (
          <button
            onClick={handleSend}
            disabled={sending}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            {sending ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sende...
              </>
            ) : (
              `Anfrage senden (${selected.size})`
            )}
          </button>
        )}
      </div>

      {/* Liste */}
      {results.map((doctor) => (
        <DoctorCard
          key={doctor.id}
          doctor={doctor}
          selected={selected.has(doctor.id)}
          onToggle={() => toggle(doctor.id)}
        />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: DoctorResult["contactStatus"] }) {
  if (!status) return null;
  const config = {
    pending: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", icon: "⏳" },
    sent:    { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200",  icon: "✓" },
    error:   { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",    icon: "✗" },
  }[status.status];

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
      {config.icon} {status.message ?? status.status}
    </span>
  );
}

function DoctorCard({
  doctor,
  selected,
  onToggle,
}: {
  doctor: DoctorResult;
  selected: boolean;
  onToggle: () => void;
}) {
  const alreadyContacted = !!doctor.contactStatus;
  const isSuccess = doctor.contactStatus?.status === "sent";

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border transition-all ${
        isSuccess
          ? "border-green-200 bg-green-50/30"
          : selected
          ? "border-blue-300 bg-blue-50/30"
          : "border-gray-100"
      }`}
    >
      <div className="p-4 flex items-start gap-3">
        {/* Checkbox */}
        <div className="pt-0.5 flex-shrink-0">
          {alreadyContacted ? (
            <div className={`w-5 h-5 rounded flex items-center justify-center text-xs ${isSuccess ? "bg-green-500 text-white" : "bg-red-400 text-white"}`}>
              {isSuccess ? "✓" : "✗"}
            </div>
          ) : (
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggle}
              className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600 cursor-pointer accent-blue-600"
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-sm">{doctor.name}</h3>
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              {doctor.specialty}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {[doctor.address, doctor.zip, doctor.city].filter(Boolean).join(", ")}
            {doctor.distance !== undefined && (
              <span className="ml-2 text-gray-400">· {doctor.distance.toFixed(1)} km</span>
            )}
          </p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {doctor.phone && (
              <a href={`tel:${doctor.phone}`} className="text-xs text-gray-500 hover:text-blue-600">
                {doctor.phone}
              </a>
            )}
            {doctor.website && (
              <a href={doctor.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:text-blue-700">
                Website
              </a>
            )}
            {doctor.contactStatus && <StatusBadge status={doctor.contactStatus} />}
          </div>
        </div>
      </div>
    </div>
  );
}
