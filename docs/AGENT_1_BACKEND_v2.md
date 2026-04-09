# Bedside — Backend Agent Prompt v2
# Complete specification for Claude Code to build the entire Bedside backend.
# Read every section completely before writing any code.
# Build in the exact order specified. Confirm each step works before proceeding.

---

## What You Are Building

Bedside is an AI-powered inpatient patient assistant delivered via WhatsApp.
It is a multi-tenant SaaS platform — hospitals are tenants, patients are end users.
Patients send WhatsApp messages and receive intelligent, clinically grounded responses
about their care plan, medications, schedule, and next actions.

You are building the backend only.
A separate agent is building the React dashboard frontend.
Your contract with the frontend is the Supabase database — you write, they read.

---

## Critical Rules — Read Before Writing Any Code

- Use Bun as the runtime and package manager everywhere
- Never use npm, npx, or yarn — only bun install, bun run, bunx
- TypeScript strict mode throughout — no any types unless genuinely unavoidable
- The AI layer is model-agnostic — never hardcode a model provider name anywhere
- Use generic names everywhere: aiClient, generateResponse, callAI
- The AI provider is configured only via environment variables
- Never mention any AI company or model name in patient-facing responses
- Every async function must have proper error handling
- The webhook must respond HTTP 200 within 2 seconds — process asynchronously
- All patient-facing responses are adaptive — respond in the patient's language
- Every Supabase query on operational data must filter by hospital_id

---

## Tech Stack

- Runtime and package manager: Bun
- Framework: Fastify with TypeScript
- Database: Supabase (PostgreSQL + Realtime)
- WhatsApp: Evolution API (already installed locally)
- AI: Configurable via environment variable — provider-agnostic interface
- Language: TypeScript strict mode

---

## Project Structure

```
bedside-backend/
├── src/
│   ├── index.ts
│   ├── config.ts
│   ├── supabase.ts
│   ├── ai/
│   │   ├── client.ts               — Model-agnostic AI interface
│   │   ├── promptBuilder.ts        — Builds system prompt with patient context
│   │   └── languageDetector.ts     — Detects language from message text
│   ├── whatsapp/
│   │   ├── sender.ts               — Evolution API send functions
│   │   └── messageBuilder.ts       — Interactive WhatsApp message payloads
│   ├── session/
│   │   └── sessionManager.ts       — In-memory conversation history per patient
│   ├── routes/
│   │   ├── webhook.ts              — Evolution API webhook receiver
│   │   ├── admin.ts                — Admin panel API routes
│   │   └── family.ts              — Family sharing data route
│   ├── handlers/
│   │   ├── intentRouter.ts
│   │   ├── scheduleHandler.ts
│   │   ├── medicationHandler.ts
│   │   ├── nextActionHandler.ts
│   │   ├── escalationHandler.ts
│   │   ├── familyHandler.ts
│   │   └── freeTextHandler.ts
│   └── utils/
│       ├── patientLookup.ts
│       ├── auditLogger.ts
│       └── phoneNormalizer.ts
├── seed/
│   └── seed.ts
├── .env
├── package.json
└── tsconfig.json
```

---

## Environment Variables

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

AI_PROVIDER=mistral
AI_API_KEY=
AI_MODEL=
AI_BASE_URL=

EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE_NAME=

PORT=3000
BASE_URL=http://localhost:3000
```

---

## Database Schema

Read SCHEMA_v2.md for the complete schema.
Implement exactly as specified. Do not add or remove any columns.

---

## AI Layer — Model-Agnostic Interface

Build src/ai/client.ts.
Read AI_PROVIDER from environment.
Initialize the correct SDK based on the provider.
Expose one generic function used by all handlers:

generateResponse(messages: ChatMessage[]): Promise<string>

Where ChatMessage = { role: "system" | "user" | "assistant", content: string }

All handlers call generateResponse() only — never the provider SDK directly.
Swapping AI providers requires changing only client.ts and environment variables.

---

## System Prompt

Never mention any AI company, model, or provider.
Built dynamically by promptBuilder.ts with patient and hospital data injected.

Template:

You are Bedside, a compassionate and helpful patient assistant.
You work on behalf of {hospital.name}, helping their hospitalized patients
understand their care plan, medications, procedures, and daily schedule.

Always respond in the same language the patient is writing in.
If the patient writes in Portuguese, respond in Portuguese.
If the patient writes in English, respond in English.
If the patient writes in Spanish, respond in Spanish.
Match the patient's language in every response.

Keep responses warm, clear, and concise — maximum 3 short paragraphs.
Use simple everyday language. Never use medical jargon without explaining it.

STRICT RULES — never violate:
- Never diagnose any condition
- Never recommend changing or stopping any medication
- Never contradict what the care team has said
- If uncertain about anything clinical, say you cannot answer and offer to alert the care team
- If patient seems to be in pain or an emergency, immediately offer to notify the care team
- Always end with a clear action or invitation to ask more
- Never reveal that you are an AI or mention any technology company

PATIENT CONTEXT:
Name: {patient.name}
Age: {patient.age}
Condition: {patient.condition}
Ward: {patient.ward}, Bed: {patient.bed_number}
Attending physician: {patient.attending_physician}
Hospital: {hospital.name}

TODAY'S APPOINTMENTS:
{formatted appointments list}

CURRENT MEDICATIONS:
{formatted medications list}

---

## Language Detection

Build src/ai/languageDetector.ts.
Given a message string, detect language using heuristics (no external API).
Check for Portuguese-specific characters and common words.
Check for Spanish-specific patterns.
Default to hospital.language if inconclusive.

Store detected language in:
- conversation_logs.detected_language
- audit_logs.detected_language
- patients.preferred_language (update on each message)

---

## Prompt Injection Protection

Before passing any message to the AI, check for these patterns (case-insensitive):
- ignore previous instructions
- ignore all instructions
- system prompt
- you are now
- forget your
- new instructions
- act as
- pretend you are

If detected:
- Do NOT call the AI
- Log to audit_logs with intent_detected = "injection_attempt"
- Respond to patient with a safe fallback in their language
- Continue normally — do not crash

---

## Session Memory

Build src/session/sessionManager.ts.
Use a JavaScript Map: key = normalized phone number, value = ChatMessage array.
On each message: load history → append user message → call AI → append response → save.
Keep last 20 messages maximum. Remove oldest 2 when limit exceeded.
Resets on server restart — acceptable for hackathon.

---

## Complete Message Flow

1. Patient sends WhatsApp message
2. Evolution API POSTs to /webhook/evolution
3. Respond HTTP 200 immediately (before any processing)
4. Extract phone number and message text from payload asynchronously
5. Normalize phone number
6. Look up patient by phone_number in Supabase (active status only)
7. If not found: send error message in detected language. Stop.
8. Load hospital record using patient.hospital_id
9. Detect message language, update patient.preferred_language
10. Check for prompt injection — if detected, respond with fallback. Stop.
11. Pass message through intent router
12. Call the appropriate handler
13. Handler fetches data from Supabase filtered by hospital_id
14. Handler builds response
15. Write to audit_logs (intent, handler, summaries — no full message content)
16. Write inbound message to conversation_logs
17. Send response via Evolution API
18. Write outbound message to conversation_logs
19. Update session memory

---

## Intent Router

Input: message text string
Output: intent string

| Intent | Keywords |
|---|---|
| schedule_request | today, schedule, agenda, hoje, horário, programação, cronograma, mi agenda, citas, horario |
| medication_question | medication, medications, meds, medicine, remédios, remedio, medicamentos, medicamento, medicação, mis medicamentos, pastillas |
| next_action | next, what now, next step, próximo, proximo, o que faço, o que fazer, agora, ahora, qué hago |
| escalation | nurse, help, pain, emergency, urgent, enfermeira, enfermeiro, ajuda, socorro, dor, dor intensa, preciso de ajuda, urgente, emergência, dolor, ayuda |
| family_on | family on, família on, familia on, compartilhar família, ativar família, activar familia |
| family_off | family off, família off, familia off, desativar família, desactivar familia |
| free_text | anything not matching above |

---

## Schedule Handler

Fetch appointments where appointment_date = today, completed = false, hospital_id matches.
Sort by scheduled_time ascending.
Return WhatsApp list message — header, each appointment as list item, footer.
When patient taps an item: send follow-up text with full details including preparation_notes.
If no appointments: send warm text inviting questions.

---

## Medication Handler

Fetch medications where active = true, hospital_id matches.
Return WhatsApp list message — header, each medication as list item.
When patient taps an item: call AI to generate warm plain-language explanation
of that specific medication including next_due_time.
If no medications: send warm text inviting questions.

---

## Next Action Handler

Fetch incomplete appointments today sorted by time.
Fetch next medication due (active, next_due_time closest to now).
Compare current time. Return single most urgent next action as text.

---

## Escalation Handler

Immediately send reassuring response to patient.
Acknowledge situation, give 2-3 calm things to do while waiting.
Never minimize the patient's concern.
Always in the patient's detected language.

Insert row into escalations: status = "pending", reason = patient's message,
hospital_id and patient_id set correctly.

---

## Family Handler

family_on:
- Check consent_flags. If already enabled: confirm and resend link.
- If not: update consent_flags (enabled = true, consented_at = now).
- Generate URL: {BASE_URL}/family/{family_share_token}
- Send URL to patient with sharing instructions.
- Log in audit_logs.

family_off:
- Update consent_flags (enabled = false, revoked_at = now).
- Confirm to patient in their language.
- Log in audit_logs.

---

## Free Text Handler

Build full messages array: system prompt (with patient context) + session history + current message.
Call generateResponse().
Send response to patient.
Append both messages to session memory.

---

## Proactive Welcome Message

Triggered when POST /admin/patients creates a new patient.
Send WhatsApp button message:
- Header: "Hello {patient.name}! 👋"
- Body: "I'm Bedside, your care assistant at {hospital.name}. I'm here to help you
  understand your treatment, medications, and schedule. How can I help?"
- 3 buttons: "📅 My schedule today" | "💊 My medications" | "❓ I have a question"

Button taps treated as equivalent command text.
Welcome message language matches hospital.language.

---

## Admin API Routes

POST /admin/patients
Body: name, age, condition, phone_number, ward, bed_number, admission_date,
      attending_physician, hospital_id
After creating: create consent_flags row, send welcome WhatsApp message.
Returns created patient.

GET /admin/patients?hospital_id=
Returns active patients with ward, condition, last audit_log timestamp,
pending escalation count.

GET /admin/patients/:id
Returns full patient with appointments and medications.

POST /admin/patients/:id/appointments
Body: title, scheduled_time, location, preparation_notes, appointment_date

POST /admin/patients/:id/medications
Body: medication_name, dosage, frequency, route, reason, next_due_time

POST /admin/patients/:id/message
Body: message_text, sent_by
Stores in nurse_messages, sends via Evolution API.

PATCH /admin/escalations/:id/resolve
Body: resolved_by
Sets status = "resolved", resolved_at = now.

---

## Family Route

GET /family/:token
Look up by family_share_token in consent_flags.
If not found or family_sharing_enabled = false: return 404 JSON.
If found and enabled, return:
- patient first name only
- ward
- condition
- today's appointments (title, time, location)
- active medications (name, dosage, reason)
- last_updated timestamp

---

## Evolution API

Base URL: EVOLUTION_API_URL
Header: apikey: {EVOLUTION_API_KEY}

Send text: POST /message/sendText/{INSTANCE}
Body: { "number": "phone", "text": "message" }

Send buttons: POST /message/sendButtons/{INSTANCE}
Body: { "number": "phone", "title": "header", "description": "body",
        "footer": "footer", "buttons": [{ "buttonId": "id",
        "buttonText": { "displayText": "Label" } }] }

Send list: POST /message/sendList/{INSTANCE}
Body: { "number": "phone", "title": "header", "description": "body",
        "buttonText": "View options",
        "sections": [{ "title": "section",
        "rows": [{ "rowId": "id", "title": "item", "description": "detail" }] }] }

---

## Webhook Deduplication

Maintain a Map of recently processed message IDs.
If same ID arrives within 30 seconds: skip processing, return 200.
Clean entries older than 60 seconds periodically.

---

## Message Length Limit

WhatsApp limit: 4096 characters.
If response exceeds 4000 characters: truncate at last complete sentence,
append continuation offer in patient's language.

---

## Error Handling

Patient not found: polite message in detected language asking to speak with nursing staff.
Supabase unreachable: log error, send technical difficulty message, offer to alert care team.
AI provider unreachable: deterministic fallback, offer to alert care team.
Evolution API failure: log error, do not crash server.
All webhook processing in try/catch. Server must never crash from one bad message.

---

## Seed Data

File: seed/seed.ts
Run: bun run seed

Hospital Isaac Newton — Brazil — pt-BR — America/Sao_Paulo

Patient 1 — Roberto Alves — 62 — Post-op cardiac bypass — UTI Pós-Operatória — Bed 03A
Phone: +5511991110001 — Physician: Dra. Ana Ferreira
Appointments: Coleta de Sangue 06:00, Visita médica 08:00, Ecocardiograma no leito 09:00,
Fisioterapia respiratória 11:00
Medications: Captopril 25mg oral 12h (pressão arterial), Aspirina 100mg oral 1x (coágulos),
Furosemida 40mg oral 1x (excesso de líquido), Morfina 2mg IV se dor (dor),
Enoxaparina 40mg SC 1x (trombose)

Patient 2 — Maria Conceição Santos — 58 — Post-op hip replacement — Ala Cirúrgica B — Bed 12B
Phone: +5511991110002 — Physician: Dr. Carlos Mendes
Appointments: Fisioterapia 10:00 (serão necessárias as muletas), Raio-X 13:00, Curativo 15:00
Medications: Tramadol 50mg oral 6h se dor (dor), Omeprazol 20mg oral 1x jejum (proteção do estômago),
Enoxaparina 40mg SC 1x (trombose), Dipirona 1g oral 6h se febre (febre),
Cefazolina 1g IV 8h (antibiótico)

Patient 3 — Fábio Lima — 45 — Bacterial pneumonia with oxygen therapy — Clínica Médica Ala A — Bed 07C
Phone: +5511991110003 — Physician: Dr. Paulo Rodrigues
Appointments: Coleta de sangue e escarro as 06:00, Nebulização 08:00, Visita da equipe médica 10:00, fisioterapia respiratória 11:30, TC tórax 13:00 (Mantenha oxigênio), Nebulização 20:00
Medications: Ceftriaxona 2g IV 1x (antibiótico principal), Azitromicina 500mg oral 1x (antibiótico complementar),
Dexametasona 6mg IV 12h (inflamação), Heparina 5000UI SC 12h (coágulos por repouso),
Salbutamol nebulização 6h (vias aéreas)

After inserting patients: create consent_flags for all 3 with family_sharing_enabled = false
and unique family_share_token (UUID) for each.

---

## Build Order

### Step 1 — Scaffold
Bun project init, install dependencies, create folder structure, create .env template.
GET / returns { status: "Bedside is running" }.
CONFIRM: Run `curl http://localhost:3000/` — expect `{"status":"Bedside is running"}`.

### Step 2 — Supabase
Initialize client. GET /health queries hospitals table.
CONFIRM: Run `curl http://localhost:3000/health` — expect hospital record returned as JSON.

### Step 3 — Seed
Build and run seed script.
CONFIRM: Run `bun run seed` — then query Supabase to verify hospital + 3 patients exist.

### Step 4 — Webhook
POST /webhook/evolution — respond 200 immediately, log phone and text asynchronously.
CONFIRM: Send test POST to `curl -X POST http://localhost:3000/webhook/evolution -H "Content-Type: application/json" -d '{"data":{"key":{"remoteJid":"5511991110001@s.whatsapp.net"},"message":{"conversation":"test"}}}'` — phone + text appear in console.

### Step 5 — Patient lookup
Build patientLookup and phoneNormalizer.
CONFIRM: Write a quick test in console or a temp script that calls patientLookup("+5511991110001") and verify it returns Roberto Alves.

### Step 6 — Language detection
Build languageDetector.
CONFIRM: Test with "quais são meus remédios" → pt-BR, "what are my meds" → en.

### Step 7 — Intent router
Build with all keywords.
CONFIRM: Test with "hoje" → schedule_request, "remédios" → medication_question, "dor" → escalation.

### Step 8 — Deterministic handlers
Build all 5 deterministic handlers. Each fetches real Supabase data filtered by hospital_id.
CONFIRM: Send "hoje" via WhatsApp → Roberto receives his appointments. Send "remédios" → receives medication list.

### Step 9 — Logging
Build auditLogger. Add conversation_logs writes.
CONFIRM: New rows in both tables after sending "hoje".

### Step 10 — AI layer
Build client, promptBuilder, sessionManager, freeTextHandler.
If AI_API_KEY is not configured yet, the freeTextHandler should return a fallback:
"I understand your question. Let me connect you with your care team."
This allows testing the full flow without a live AI provider.
CONFIRM: Send any free text via WhatsApp → returns contextual AI response (or fallback if no API key).

### Step 11 — Interactive messages
Update schedule and medication handlers to send list messages.
Update welcome to send button message.
CONFIRM: "remédios" returns WhatsApp list. Tapping item returns AI explanation.

### Step 12 — Admin routes
Build all admin routes.
CONFIRM: POST /admin/patients creates patient and sends welcome WhatsApp.

### Step 13 — Family route
Build GET /family/:token.
CONFIRM: Valid token returns data. Invalid returns 404.

### Step 14 — Safety
Add deduplication, injection detection, message length truncation.
CONFIRM: Duplicate events ignored. Injection attempt returns safe fallback.

### Step 15 — End to end
Send all commands from all 3 phones. Verify responses, audit logs, conversation logs.

---

## Production Authentication Roadmap (Do Not Implement)

Facial recognition via patient's smartphone camera.
Triggered on first contact via secure web link sent to patient's WhatsApp.
After biometric verification, session linked to patient record for admission duration.
