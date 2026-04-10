import { supabase } from "../supabase.js";
import { normalizePhone } from "./phoneNormalizer.js";

interface PatientRecord {
  id: string;
  hospital_id: string;
  name: string;
  age: number;
  condition: string;
  phone_number: string;
  ward: string;
  bed_number: string;
  admission_date: string;
  attending_physician: string;
  status: string;
  preferred_language: string | null;
}

interface HospitalRecord {
  id: string;
  name: string;
  country: string;
  language: string;
  timezone: string;
}

export interface PatientWithHospital {
  patient: PatientRecord;
  hospital: HospitalRecord;
}

export async function lookupPatient(rawPhone: string): Promise<PatientWithHospital | null> {
  const phone = normalizePhone(rawPhone);

  const { data: patient, error } = await supabase
    .from("patients")
    .select("*")
    .eq("phone_number", phone)
    .eq("status", "active")
    .single();

  if (error || !patient) {
    return null;
  }

  const { data: hospital, error: hospitalError } = await supabase
    .from("hospitals")
    .select("*")
    .eq("id", patient.hospital_id)
    .single();

  if (hospitalError || !hospital) {
    return null;
  }

  return {
    patient: patient as PatientRecord,
    hospital: hospital as HospitalRecord,
  };
}
