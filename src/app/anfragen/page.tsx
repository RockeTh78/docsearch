"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface RequestRecord {
  id: string;
  doctorName: string;
  specialty: string;
  city: string;
  problem: string;
  method: string;
  status: string;
  statusMsg?: string;
  sentAt?: string;
  respondedAt?: string;
  notes?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pending:   { label: "Ausstehend",  bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  sent:      { label: "Gesendet",    bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200" },
  responded: { label: "Antwort",     bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200" },
  error:     { label: "Fehler",      bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200" },
};

export default function AnfragenPage() {
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/requests?email=hoche@me.com")
      .then((r) => r.json())
      .then((d) => { setRequests(d.requests ?? []); setLoading(false); });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg font-bold">+</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">DocSearch</h1>
              <p className="text-xs text-gray-500">Meine Anfragen</p>
            </div>
          </div>
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
            ← Neue Suche
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center text-gray-400 py-12">Lädt...</div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
            Noch keine Anfragen gesendet.
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 font-medium">{requests.length} Anfrage{requests.length !== 1 ? "n" : ""}</p>
            {requests.map((r) => {
              const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending;
              return (
                <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">{r.doctorName}</span>
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                          {r.specialty}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{r.city}</p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{r.problem}</p>
                      {r.notes && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-100 rounded-lg">
                          <p className="text-xs text-green-800 font-medium">Antwort:</p>
                          <p className="text-xs text-green-700 mt-0.5">{r.notes}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-400">
                        {new Date(r.createdAt).toLocaleDateString("de-DE")}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(r.createdAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
