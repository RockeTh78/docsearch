"use client";

import { useState } from "react";
import Link from "next/link";
import SearchForm from "@/components/SearchForm";
import ResultsList from "@/components/ResultsList";
import type { SearchFormData, DoctorResult } from "@/types";

export default function Home() {
  const [results, setResults] = useState<DoctorResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [lastFormData, setLastFormData] = useState<SearchFormData | null>(null);
  const [sending, setSending] = useState(false);

  async function handleSearch(formData: SearchFormData) {
    setLoading(true);
    setError(null);
    setSearched(true);
    setLastFormData(formData);
    setResults([]);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Suche fehlgeschlagen");
      const data = await res.json();
      setResults(data.doctors || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendRequests(selectedIds: string[]) {
    if (!lastFormData) return;
    setSending(true);

    const selected = results.filter((d) => selectedIds.includes(d.id));

    for (const doctor of selected) {
      setResults((prev) =>
        prev.map((d) =>
          d.id === doctor.id
            ? { ...d, contactStatus: { status: "pending", method: "email", timestamp: new Date().toISOString() } }
            : d
        )
      );

      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            doctor,
            contact: lastFormData.contact,
            problem: lastFormData.problem,
          }),
        });
        const data = await res.json();
        setResults((prev) =>
          prev.map((d) =>
            d.id === doctor.id
              ? {
                  ...d,
                  contactStatus: {
                    status: res.ok ? "sent" : "error",
                    method: "email",
                    timestamp: new Date().toISOString(),
                    message: res.ok
                      ? `Anfrage gesendet (Test #${data.testNumber})`
                      : data.error,
                  },
                }
              : d
          )
        );
      } catch {
        setResults((prev) =>
          prev.map((d) =>
            d.id === doctor.id
              ? { ...d, contactStatus: { status: "error", method: "email", timestamp: new Date().toISOString(), message: "Netzwerkfehler" } }
              : d
          )
        );
      }
    }

    setSending(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg font-bold">+</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">DocSearch</h1>
            <p className="text-xs text-gray-500">Arzttermin automatisch anfragen</p>
          </div>
        </div>
        <Link href="/anfragen" className="text-sm text-blue-600 hover:text-blue-800">
          Meine Anfragen →
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <SearchForm onSearch={handleSearch} loading={loading} />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {searched && !loading && (
          <ResultsList
            results={results}
            onSendRequests={handleSendRequests}
            sending={sending}
          />
        )}
      </main>
    </div>
  );
}
