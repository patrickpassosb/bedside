# Bedside — Agent Instructions

This file guides any AI coding agent (Claude Code, Google Antigravity, Codex, etc.) working on the Bedside project.

---

## What Is Bedside

Bedside is an AI-powered inpatient patient communication platform for hospitals.
Patients interact via WhatsApp; nurses monitor via a real-time React dashboard.
Multi-tenant SaaS — hospitals are tenants, patients are end users.

**This is a hackathon project for the Harvard HSIL Hackathon 2026 (April 10-11).**
Speed and demo quality matter more than production robustness.

---

## Project Structure

```
bedside/
├── CLAUDE.md              — Points here
├── AGENTS.md              — You are here
├── docs/
│   ├── SCHEMA_v2.md       — Database schema (source of truth for all tables)
│   ├── AGENT_1_BACKEND_v2.md   — Backend build spec (15 steps)
│   ├── AGENT_2_FRONTEND_v2.md  — Frontend build spec (12 steps)
│   └── GOOGLE_STITCH_PROMPT_v2.md — UI design reference
├── bedside-backend/       — Fastify + Supabase + WhatsApp (built by Agent 1)
└── bedside-frontend/      — React + Tailwind + Supabase Realtime (built by Agent 2)
```

---

## Critical Rules (All Agents)

1. **Bun only** — Never use npm, npx, or yarn. Only `bun install`, `bun run`, `bunx`.
2. **TypeScript strict** — No `any` types unless genuinely unavoidable.
3. **Model-agnostic AI** — Never hardcode an AI provider or model name. Use generic names: `aiClient`, `generateResponse`, `callAI`. Configure via environment variables only.
4. **Multi-tenant always** — Every Supabase query on operational data MUST filter by `hospital_id`.
5. **No AI branding** — Never mention any AI company or model name in patient-facing responses.
6. **Schema is law** — Follow `docs/SCHEMA_v2.md` exactly. Do not add, remove, or rename columns.
7. **Respond in patient's language** — All patient-facing responses are adaptive to detected language.
8. **Error resilience** — Every async function has error handling. Server never crashes from one bad message.

---

## Agent 1: Backend

**Spec:** `docs/AGENT_1_BACKEND_v2.md`
**Stack:** Bun + Fastify + Supabase + Evolution API (WhatsApp) + AI (configurable)
**Output:** `bedside-backend/`

### Build Priority (hackathon order)
1. **Steps 1-4** — Scaffold, Supabase, Seed, Webhook (foundation)
2. **Steps 5-8** — Patient lookup, Language detection, Intent router, Deterministic handlers (WhatsApp chatbot working)
3. **Steps 9-10** — Logging, AI layer (smart responses)
4. **Steps 11-13** — Interactive messages, Admin routes, Family route (full features)
5. **Steps 14-15** — Safety, End-to-end testing (polish)

### Verification After Each Step
After completing each step, verify it works before moving on:
- **Step 1:** `curl http://localhost:3000/` → expect `{"status":"Bedside is running"}`
- **Step 2:** `curl http://localhost:3000/health` → expect hospital data returned
- **Step 3:** Check Supabase dashboard — hospital + 3 patients visible
- **Step 4:** Send test WhatsApp message → phone + text appear in console
- **Step 5:** Query with `+5511991110001` → returns Roberto Alves
- **Step 8:** Send "hoje" via WhatsApp → returns Roberto's appointments
- **Step 10:** Send free text → returns contextual AI response in patient's language
- **Step 12:** `curl -X POST http://localhost:3000/admin/patients -H "Content-Type: application/json" -d '{...}'` → creates patient + sends WhatsApp welcome

### AI Fallback
If `AI_API_KEY` is not configured, the `freeTextHandler` should return a fallback response:
"I understand your question. Let me connect you with your care team."
This allows testing the full flow without a live AI provider.

### Contract with Frontend
The backend writes to Supabase. The frontend reads from Supabase directly via the JS client.
The frontend calls the backend API only for write operations:
- `POST /admin/patients` — create patient
- `POST /admin/patients/:id/appointments` — add appointment
- `POST /admin/patients/:id/medications` — add medication
- `POST /admin/patients/:id/message` — nurse sends message
- `PATCH /admin/escalations/:id/resolve` — resolve escalation

---

## Agent 2: Frontend

**Spec:** `docs/AGENT_2_FRONTEND_v2.md`
**Stack:** Bun + Vite + React 18 + Tailwind CSS + Supabase JS + React Router v6
**Output:** `bedside-frontend/`
**Design reference:** Screenshots from Google Stitch (attached to spec after generation)

### Build Priority (hackathon order — demo-first)
1. **Steps 1-3** — Scaffold, Theme system, Layout shell (app skeleton)
2. **Steps 4-5** — Supabase client, Dashboard with patient cards (**most important for demo**)
3. **Step 8** — Patient Detail with chat (**second most important — shows the conversation**)
4. **Step 7** — Escalations (**third — shows clinical safety**)
5. **Step 6** — Activity Feed (nice to have)
6. **Steps 9-10** — Admin Panel, Family Page (nice to have)
7. **Steps 11-12** — Polish, Final check

### Mock Data Fallback
If the backend/Supabase is not yet available, create `src/lib/mockData.ts` with the 3 seed patients from `docs/SCHEMA_v2.md`. Use mock data during development, switch to live Supabase when ready. This allows the frontend agent to work independently of the backend agent.

### Realtime Is Critical
Supabase Realtime subscriptions are what make the demo impressive. Every page should update live:
- Dashboard: patient cards update when new messages arrive
- Escalations: new cards appear instantly when a patient escalates
- Patient Detail: chat messages appear in real-time

### Design Quality
Match the Google Stitch screenshots as closely as possible. The design should look like Linear or Vercel quality — not a generic hospital system. Both light and dark themes must look equally excellent.

---

## Hackathon Execution Strategy

### Two Agents in Parallel
- **Terminal 1:** Claude Code running ralph loop on `AGENT_1_BACKEND_v2.md`
- **Terminal 2:** Google Antigravity (or second Claude Code) on `AGENT_2_FRONTEND_v2.md`
- Both run autonomously. Developer monitors and intervenes only when stuck.

### Day 1 (Friday April 10) — Build
| Time | Backend Agent | Frontend Agent |
|------|--------------|----------------|
| Morning | Steps 1-4 (scaffold → webhook) | Steps 1-3 (scaffold → layout) |
| Midday | Steps 5-8 (chatbot working!) | Steps 4-5 (Supabase → dashboard) |
| Afternoon | Steps 9-10 (logging + AI) | Steps 7-8 (escalations + patient detail) |
| Evening | Steps 11-13 (features) | Steps 6, 9-10 (activity, admin, family) |

### Day 2 (Saturday April 11) — Polish + Pitch
| Time | Action |
|------|--------|
| Morning | Backend Steps 14-15 (safety, e2e). Frontend Steps 11-12 (polish). |
| Midday | Integration test: WhatsApp → Dashboard real-time loop. Demo rehearsal. |
| Pre-pitch | Lock code. Practice pitch 3+ times. Prepare backup (screen recording). |
| Pitch | 3 minutes. Partner: problem + intro. Developer: product + live demo. |

### Go/No-Go Checkpoints
- **End of Day 1:** Backend Steps 1-8 done (chatbot works) AND Frontend Steps 1-5 done (dashboard shows patients) → GREEN. Otherwise prioritize the lagging agent.
- **Day 2 midday:** Integration test passes (WhatsApp message → dashboard updates in real-time) → Ready for pitch.
- **If behind:** Cut scope to WhatsApp chatbot + Dashboard only. This is enough for a winning demo.

### Demo Script (for the 3-minute pitch)
1. Show the dashboard with 3 patient cards (overview)
2. Pick up a phone → send "hoje" via WhatsApp to Bedside
3. Show AI responding with today's schedule in Portuguese
4. Switch to dashboard → show the activity feed updating in real-time
5. Send "estou com muita dor" (I'm in a lot of pain)
6. Show escalation card appearing instantly on the dashboard
7. Click "Resolve" on the escalation → show the flow

---

## Environment Variables

### Backend (.env)
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

### Frontend (.env)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_BACKEND_URL=http://localhost:3000
VITE_HOSPITAL_ID=
```

---

## Judging Rubric (Optimize For This)

The hackathon is judged on 6 criteria, each scored /5 (total /30):

1. **Challenge** — Clear need, root causes, urgency → Partner (anesthesiologist) leads this
2. **Technology & Innovation** — Novel AI solution, design, UX → Working WhatsApp + dashboard demo
3. **Implementation** — Business model, obstacles, stakeholder plan → Both contribute
4. **Team** — Right skill mix → Clinical + technical pairing
5. **Pitch** — Prototype demo, visual aids, next steps → Live demo is the differentiator
6. **Q&A** — Defend position → Partner on clinical, developer on technical

**Key insight:** No requirement for fully working prototypes. But having a live demo is a massive advantage in categories 2 and 5.
