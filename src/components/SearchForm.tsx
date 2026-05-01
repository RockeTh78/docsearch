"use client";

import { useState } from "react";
import type { SearchFormData, ContactInfo } from "@/types";
import { SPECIALTIES, RADIUS_OPTIONS } from "@/types";

interface Props {
  onSearch: (data: SearchFormData) => void;
  loading: boolean;
}

export default function SearchForm({ onSearch, loading }: Props) {
  const [contact, setContact] = useState<ContactInfo>({
    firstName: "Thomas",
    lastName: "Hoche",
    email: "hoche@me.com",
    phone: "0151 12345678",
    birthDate: "1978-06-15",
    insuranceType: "privat",
  });
  const [location, setLocation] = useState("München");
  const [radius, setRadius] = useState(5);
  const [specialty, setSpecialty] = useState("allgemeinmedizin");
  const [problem, setProblem] = useState("Ich benötige einen Termin zur allgemeinen Untersuchung und Blutabnahme.");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch({ contact, location, radius, specialty, problem });
  }

  function updateContact(field: keyof ContactInfo, value: string) {
    setContact((prev) => ({ ...prev, [field]: value }));
  }

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Kontaktdaten */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
          Ihre Kontaktdaten
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Vorname *</label>
            <input
              type="text"
              required
              value={contact.firstName}
              onChange={(e) => updateContact("firstName", e.target.value)}
              placeholder="Max"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Nachname *</label>
            <input
              type="text"
              required
              value={contact.lastName}
              onChange={(e) => updateContact("lastName", e.target.value)}
              placeholder="Mustermann"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>E-Mail *</label>
            <input
              type="email"
              required
              value={contact.email}
              onChange={(e) => updateContact("email", e.target.value)}
              placeholder="max@example.de"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Telefon *</label>
            <input
              type="tel"
              required
              value={contact.phone}
              onChange={(e) => updateContact("phone", e.target.value)}
              placeholder="0151 12345678"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Geburtsdatum *</label>
            <input
              type="date"
              required
              value={contact.birthDate}
              onChange={(e) => updateContact("birthDate", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Versicherung *</label>
            <select
              value={contact.insuranceType}
              onChange={(e) => updateContact("insuranceType", e.target.value)}
              className={inputClass}
            >
              <option value="gesetzlich">Gesetzlich (GKV)</option>
              <option value="privat">Privat (PKV)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Arztsuche */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
          Arztsuche
        </h2>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="col-span-2">
            <label className={labelClass}>Ort oder PLZ *</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="z.B. München oder 80331"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Umkreis *</label>
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className={inputClass}
            >
              {RADIUS_OPTIONS.map((r) => (
                <option key={r} value={r}>{r} km</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Fachrichtung *</label>
          <select
            required
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className={inputClass}
          >
            <option value="">Bitte wählen...</option>
            {SPECIALTIES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Problem */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
          Ihr Anliegen
        </h2>
        <label className={labelClass}>Beschreiben Sie kurz Ihr Problem / Ihren Terminwunsch *</label>
        <textarea
          required
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          rows={3}
          placeholder="z.B. Ich habe seit 2 Wochen Knieschmerzen und benötige einen Untersuchungstermin..."
          className={`${inputClass} resize-none`}
        />
        <p className="text-xs text-gray-400 mt-1">
          Diese Beschreibung wird für die automatische Terminanfrage verwendet.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Suche läuft...
          </>
        ) : (
          "Ärzte suchen & Termine anfragen"
        )}
      </button>
    </form>
  );
}
