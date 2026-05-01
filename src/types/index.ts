export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  insuranceType: "gesetzlich" | "privat";
}

export interface SearchFormData {
  contact: ContactInfo;
  location: string;
  radius: number;
  specialty: string;
  problem: string;
}

export interface DoctorResult {
  id: string;
  name: string;
  specialty: string;
  address: string;
  city: string;
  zip: string;
  phone?: string;
  email?: string;
  website?: string;
  distance?: number;
  contactStatus?: ContactStatus;
}

export interface ContactStatus {
  status: "pending" | "sent" | "error";
  method: "email" | "form";
  timestamp: string;
  message?: string;
}

export const SPECIALTIES = [
  { value: "allgemeinmedizin", label: "Allgemeinmedizin / Hausarzt" },
  { value: "innere_medizin", label: "Innere Medizin / Internist" },
  { value: "orthopadie", label: "Orthopädie" },
  { value: "dermatologie", label: "Dermatologie / Hautarzt" },
  { value: "hno", label: "HNO – Hals-Nasen-Ohren" },
  { value: "augenheilkunde", label: "Augenheilkunde / Augenarzt" },
  { value: "gynakologie", label: "Gynäkologie / Frauenarzt" },
  { value: "urologie", label: "Urologie" },
  { value: "neurologie", label: "Neurologie" },
  { value: "psychiatrie", label: "Psychiatrie / Psychotherapie" },
  { value: "kardiologie", label: "Kardiologie / Herzarzt" },
  { value: "zahnarzt", label: "Zahnarzt" },
  { value: "radiologie", label: "Radiologie" },
  { value: "gastroenterologie", label: "Gastroenterologie" },
  { value: "kinderheilkunde", label: "Kinderheilkunde / Kinderarzt" },
];

export const RADIUS_OPTIONS = [5, 10, 15, 20, 30, 50];
