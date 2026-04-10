# Bedside

> AI-powered inpatient assistant delivered via WhatsApp.
> Patients text like they text a nurse. Hospitals stay in the loop.

**Harvard HSIL Hackathon 2026.**

Bedside is a multi-tenant SaaS platform that lets hospitalized patients get trustworthy answers about their own care — schedule, medications, what's next, how to reach a nurse — by sending a WhatsApp message. The bot speaks the patient's language (pt-BR, es, en), grounds every answer in the hospital's own care plan, and escalates to clinical staff when something isn't safe to answer alone.

Hospital staff see everything from a dashboard: live patient list, pending escalations, audit trail, and direct patient messaging.

## Why

Inpatients forget or misunderstand a large share of what they're told at the bedside. They don't want to press the call button for "what pill is this" or "when is my X-ray." Family members are anxious and under-informed. Nurses are interrupted constantly.

Bedside gives patients a safe, grounded way to ask — and gives clinicians a full record of what was asked and answered, without adding a single new app on the patient's side. WhatsApp is already on every phone.

## What it does

**For patients (WhatsApp):**
- "What's on my schedule today?" → interactive list of appointments with time and location
- "What are my medications?" → interactive list with dose, route, and reason
- "What's next?" → the most urgent of upcoming appointment vs. medication dose
- "I need a nurse" / "dor" / "emergency" → routes to the `escalations` table, care team notified
- "family on" / "family off" → toggles a view-only share link for the family
- Free-text conversation grounded in the patient's care plan via the AI layer
- Auto-detected language: Portuguese (pt-BR), Spanish (es), English (en)

**For hospital staff (React dashboard):**
- Live patient list with ward, bed, condition, attending physician
- Pending escalations with one-click resolve
- Per-patient view: schedule, medications, consent flags
- Direct WhatsApp message to the patient, logged to `nurse_messages`
- Add patients, appointments, medications
- Audit log: every inbound intent, handler used, response summary, detected language — never the raw message content (LGPD-compliant)

## Architecture

```
┌───────────────┐   webhook    ┌──────────────────┐
│  Evolution    │  ───────────>│  bedside-backend │
│  API (WA)     │<─ responses ─│  Fastify + Bun   │
└───────────────┘              └────────┬─────────┘
         ▲                              │
         │                              ▼
  patient phone              ┌──────────────────┐
                             │    Supabase      │
                             │  Postgres + RT   │
                             └────────┬─────────┘
                                      │ realtime
                             ┌────────▼─────────┐
                             │ bedside-frontend │
                             │  React + Vite    │
                             └──────────────────┘
```

| Piece | Stack |
|---|---|
| Backend | Fastify · TypeScript strict · Bun · Supabase-js · Evolution API · model-agnostic AI (MistralAI wired in) |
| Frontend | React 18 · Vite · Tailwind · Supabase Realtime · Recharts |
| Database | Supabase (Postgres) — 8 tables, multi-tenant on `hospital_id` |
| WhatsApp | Evolution API v2.3.7 (Baileys) — `docker-compose.yml` included |

## Repo layout

```
bedside/
├── bedside-backend/          # Fastify webhook + handlers + admin API
│   ├── src/
│   │   ├── routes/           # webhook, admin, family
│   │   ├── handlers/         # schedule, medication, next_action, escalation, family, free_text
│   │   ├── ai/               # model-agnostic client, promptBuilder, languageDetector
│   │   ├── whatsapp/         # Evolution API sender, interactive message builder
│   │   ├── session/          # in-memory conversation history per patient
│   │   └── utils/            # patient lookup, audit logger, injection detector, phone normalizer
│   ├── seed/                 # schema.sql + seed.ts (Hospital Isaac Newton + 3 demo patients)
│   ├── docker-compose.yml    # Evolution API + Postgres + Redis
│   └── .env.example
├── bedside-frontend/         # React dashboard
├── docs/
│   ├── AGENT_1_BACKEND_v2.md     # Backend spec (source of truth)
│   ├── AGENT_2_FRONTEND_v2.md    # Frontend spec
│   ├── SCHEMA_v2.md              # Database schema (source of truth)
│   ├── GOOGLE_STITCH_PROMPT_v2.md
│   └── evolution-api-setup-guide.md
└── README.md
```

## Quickstart — backend

**Prerequisites:** Bun, Docker, a Supabase project, and an AI provider key (MistralAI by default, any OpenAI-compatible provider via env).

```bash
cd bedside-backend
bun install
cp .env.example .env           # fill in Supabase + AI + Evolution API creds
```

Apply the schema (run `seed/schema.sql` in the Supabase SQL editor), then seed demo data:

```bash
bun run seed                   # Hospital Isaac Newton + 3 patients + appointments + meds
```

Start WhatsApp and the server:

```bash
docker compose up -d           # Evolution API on http://localhost:8080
bun run dev                    # Fastify on http://localhost:3000
```

Point Evolution API's webhook at `http://<your-host>:3000/webhook/evolution` and scan the QR code. Text the connected number from one of the seeded patient phones and you're in.

## Quickstart — frontend

```bash
cd bedside-frontend
bun install
cp .env.example .env           # Supabase url + anon key
bun run dev
```

## Deploy on Vercel

Use two Vercel projects from this monorepo:

- `bedside-backend`
- `bedside-frontend`

The deployment runbook is in [`docs/DEPLOY_VERCEL.md`](docs/DEPLOY_VERCEL.md).

## Safety, compliance, and design choices

- **Multi-tenant isolation** — every operational query filters by `hospital_id`. No cross-tenant leakage.
- **LGPD-compliant audit logs** — `audit_logs` store intent-based summaries only. Raw message content never leaves `conversation_logs`.
- **Clinical safety on escalation** — if the escalation insert fails, the patient is told to press the nurse call button or call out. The bot never gives false reassurance.
- **Prompt injection detection** — 8-pattern filter before the AI layer; hits are logged and answered with a safe fallback, the AI is never called.
- **Word-boundary intent matching** — "painter" doesn't trigger a pain escalation, "helpful" doesn't trigger a help escalation.
- **Model-agnostic AI layer** — `generateResponse(messages: ChatMessage[])` behind an env-configured provider. No model name appears in patient-facing text.
- **Webhook dedup** — same message ID within 30s is skipped, entries cleaned after 60s.
- **Session memory cap** — 20 messages per patient, drop-oldest-2 on overflow.

## Spec docs

The `docs/` directory is the source of truth. Both the backend and frontend were built by reading these end-to-end.

- [`docs/AGENT_1_BACKEND_v2.md`](docs/AGENT_1_BACKEND_v2.md) — backend spec
- [`docs/AGENT_2_FRONTEND_v2.md`](docs/AGENT_2_FRONTEND_v2.md) — frontend spec
- [`docs/SCHEMA_v2.md`](docs/SCHEMA_v2.md) — database schema
- [`docs/evolution-api-setup-guide.md`](docs/evolution-api-setup-guide.md) — Evolution API setup guide

## Status

- **Backend** — 24 files, 15 build steps, typecheck clean, architect-reviewed
- **Frontend** — dashboard, patient detail, and escalations surfaces shipped
- **Database** — 8-table schema with realtime on `audit_logs`, `escalations`, `conversation_logs`, `nurse_messages`, `patients`
