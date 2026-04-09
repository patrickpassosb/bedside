export interface Hospital {
  id: string;
  name: string;
  country: string;
  language: string;
  timezone: string;
  active?: boolean;
  created_at?: string;
}

export interface Patient {
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
  status: "active" | "discharged";
  preferred_language: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  hospital_id: string;
  patient_id: string;
  title: string;
  scheduled_time: string;
  location: string;
  preparation_notes: string;
  completed: boolean;
  appointment_date: string;
  created_at?: string;
}

export interface MedicationRequest {
  id: string;
  hospital_id: string;
  patient_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  route: string;
  reason: string;
  next_due_time: string;
  active: boolean;
  created_at?: string;
}

export type Medication = MedicationRequest;

export interface AuditLog {
  id: string;
  hospital_id: string;
  patient_id: string;
  intent_detected:
    | "schedule_request"
    | "medication_question"
    | "next_action"
    | "escalation"
    | "free_text"
    | "family_toggle"
    | "injection_attempt";
  handler_used: "deterministic" | "ai" | "escalation";
  input_summary: string;
  response_summary: string;
  detected_language: string;
  timestamp: string;
}

export interface Escalation {
  id: string;
  hospital_id: string;
  patient_id: string;
  reason: string;
  status: "pending" | "resolved";
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface ConversationLog {
  id: string;
  hospital_id: string;
  patient_id: string;
  direction: "inbound" | "outbound";
  message_text: string;
  detected_language: string;
  timestamp: string;
}

export interface ConsentFlag {
  id: string;
  hospital_id: string;
  patient_id: string;
  family_sharing_enabled: boolean;
  family_share_token: string;
  consented_at: string | null;
  revoked_at: string | null;
}

export interface NurseMessage {
  id: string;
  hospital_id: string;
  patient_id: string;
  message_text: string;
  sent_by: string;
  sent_at: string;
}

export interface ConversationEntry {
  id: string;
  patient_id: string;
  direction: "inbound" | "outbound" | "care-team";
  message_text: string;
  detected_language?: string;
  timestamp: string;
  sent_by?: string;
}

export type DataStatus = "loading" | "ready" | "error";
export type ThemeMode = "light" | "dark";
export type ToastTone = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

export interface FamilyPayload {
  hospital: Hospital;
  patient: Patient;
  appointments: Appointment[];
  medications: MedicationRequest[];
  consentFlag: ConsentFlag;
  updatedAt: string;
}

export interface NewPatientInput {
  name: string;
  phone_number: string;
  age: number;
  condition: string;
  ward: string;
  bed_number: string;
  admission_date: string;
  attending_physician: string;
}

export interface NewAppointmentInput {
  patient_id: string;
  title: string;
  scheduled_time: string;
  location: string;
  preparation_notes: string;
  appointment_date: string;
}

export interface NewMedicationInput {
  patient_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  route: string;
  reason: string;
  next_due_time: string;
}

export interface SendMessageInput {
  patient_id: string;
  message_text: string;
  sent_by: string;
}

export interface ResolveEscalationInput {
  escalation_id: string;
  resolved_by: string;
}

export interface AppDataStore {
  hospital: Hospital | null;
  patients: Patient[];
  appointments: Appointment[];
  medications: MedicationRequest[];
  auditLogs: AuditLog[];
  escalations: Escalation[];
  conversationLogs: ConversationLog[];
  nurseMessages: NurseMessage[];
  consentFlags: ConsentFlag[];
}
