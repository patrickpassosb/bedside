# Bedside — Database Schema v2
# Multi-tenant SaaS platform. Hospitals are tenants.
# Shared reference for ALL agents. Both backend and frontend must follow this exactly.
# Do not add, remove, or rename any column without updating this document first.

---

## Platform Model

Bedside is a multi-tenant SaaS platform.
Each hospital is a tenant with isolated data.
All operational tables include hospital_id for tenant scoping.
One central WhatsApp number serves all hospitals.
Patient is identified by phone number → patient record → hospital_id.

---

## Tables

### hospitals
One row per hospital tenant registered on the Bedside platform.

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key, auto-generated |
| name | TEXT | Hospital display name e.g. "Hospital Isaac Newton" |
| country | TEXT | e.g. "Brazil" |
| language | TEXT | Default patient language e.g. "pt-BR", "en-US", "es" |
| timezone | TEXT | e.g. "America/Sao_Paulo" |
| active | BOOLEAN | Default true |
| created_at | TIMESTAMPTZ | Auto-generated |

---

### patients

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key, auto-generated |
| hospital_id | UUID | Foreign key → hospitals.id |
| name | TEXT | Full patient name |
| age | INTEGER | Patient age |
| condition | TEXT | Primary condition in plain language |
| phone_number | TEXT | WhatsApp number with country code e.g. +5511999999999 |
| ward | TEXT | e.g. "Post-Op ICU" |
| bed_number | TEXT | e.g. "14B" |
| admission_date | DATE | Date of admission |
| attending_physician | TEXT | Name of responsible doctor |
| status | TEXT | "active" or "discharged" — default "active" |
| preferred_language | TEXT | Detected language e.g. "pt-BR" — overrides hospital default |
| created_at | TIMESTAMPTZ | Auto-generated |

---

### appointments

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key, auto-generated |
| hospital_id | UUID | Foreign key → hospitals.id |
| patient_id | UUID | Foreign key → patients.id |
| title | TEXT | e.g. "Echocardiogram" |
| scheduled_time | TIME | e.g. 14:30 |
| location | TEXT | e.g. "Imaging Room - 2nd Floor" |
| preparation_notes | TEXT | What patient needs to do before |
| completed | BOOLEAN | Default false |
| appointment_date | DATE | Defaults to today |
| created_at | TIMESTAMPTZ | Auto-generated |

---

### medication_requests

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key, auto-generated |
| hospital_id | UUID | Foreign key → hospitals.id |
| patient_id | UUID | Foreign key → patients.id |
| medication_name | TEXT | e.g. "Captopril" |
| dosage | TEXT | e.g. "25mg" |
| frequency | TEXT | e.g. "Every 12 hours" |
| route | TEXT | e.g. "Oral", "IV", "Subcutaneous" |
| reason | TEXT | Why — written in plain language for the patient |
| next_due_time | TIMESTAMPTZ | When the next dose is due |
| active | BOOLEAN | Default true |
| created_at | TIMESTAMPTZ | Auto-generated |

---

### conversation_logs

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key, auto-generated |
| hospital_id | UUID | Foreign key → hospitals.id |
| patient_id | UUID | Foreign key → patients.id |
| direction | TEXT | "inbound" or "outbound" |
| message_text | TEXT | Full message content |
| detected_language | TEXT | Language detected e.g. "pt-BR" |
| timestamp | TIMESTAMPTZ | Auto-generated |

---

### audit_logs
LGPD compliance log. Stores metadata only — never full message content.

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key, auto-generated |
| hospital_id | UUID | Foreign key → hospitals.id |
| patient_id | UUID | Foreign key → patients.id |
| intent_detected | TEXT | "schedule_request", "medication_question", "escalation", "free_text", "family_toggle" |
| handler_used | TEXT | "deterministic", "ai", or "escalation" — never a model name |
| input_summary | TEXT | Short description of what patient asked — NOT full message |
| response_summary | TEXT | Short description of Bedside reply — NOT full response |
| detected_language | TEXT | Language of this interaction |
| timestamp | TIMESTAMPTZ | Auto-generated |

---

### escalations

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key, auto-generated |
| hospital_id | UUID | Foreign key → hospitals.id |
| patient_id | UUID | Foreign key → patients.id |
| reason | TEXT | The reason the patient gave |
| status | TEXT | "pending" or "resolved" — default "pending" |
| created_at | TIMESTAMPTZ | Auto-generated |
| resolved_at | TIMESTAMPTZ | Null until resolved |
| resolved_by | TEXT | Name of staff who resolved |

---

### consent_flags

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key, auto-generated |
| hospital_id | UUID | Foreign key → hospitals.id |
| patient_id | UUID | Unique — one row per patient |
| family_sharing_enabled | BOOLEAN | Default false |
| family_share_token | TEXT | Unique URL token — auto-generated UUID |
| consented_at | TIMESTAMPTZ | When patient gave consent |
| revoked_at | TIMESTAMPTZ | Null unless revoked |

---

### nurse_messages

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key, auto-generated |
| hospital_id | UUID | Foreign key → hospitals.id |
| patient_id | UUID | Foreign key → patients.id |
| message_text | TEXT | What the nurse wrote |
| sent_by | TEXT | Nurse name |
| sent_at | TIMESTAMPTZ | Auto-generated |

---

## Relationships

```
hospitals (1) ──── (many) patients
hospitals (1) ──── (many) appointments
hospitals (1) ──── (many) medication_requests
hospitals (1) ──── (many) conversation_logs
hospitals (1) ──── (many) audit_logs
hospitals (1) ──── (many) escalations
hospitals (1) ──── (many) consent_flags
hospitals (1) ──── (many) nurse_messages

patients (1) ──── (many) appointments
patients (1) ──── (many) medication_requests
patients (1) ──── (many) conversation_logs
patients (1) ──── (many) audit_logs
patients (1) ──── (many) escalations
patients (1) ──── (1)    consent_flags
patients (1) ──── (many) nurse_messages
```

---

## Supabase Realtime — Enable on These Tables
- audit_logs
- escalations
- conversation_logs
- nurse_messages
- patients

---

## Multi-Tenant Query Rule
Every query on operational data MUST filter by hospital_id.
Never return data across hospitals.
For the hackathon: hospital_id is hardcoded to the seeded Hospital Isaac Newton record.
In production: hospital_id comes from the authenticated session.

---

## Authentication

### Hackathon
Patient identity = phone number lookup.
Incoming phone number → patients table → hospital_id resolved from patient record.

### Production Roadmap
Facial recognition via the patient's smartphone camera.
Triggered on first contact via a secure web link sent to the patient's WhatsApp.
After biometric verification, session is linked to patient record for the duration of admission.
Do NOT implement for the hackathon.

---

## Language and Timezone
- All timestamps: TIMESTAMPTZ
- Display in hospital.timezone
- Seed data default timezone: America/Sao_Paulo (UTC-3)
- AI layer reads detected_language from conversation_logs to respond in the correct language
- hospitals.language is the default — patients.preferred_language overrides it
