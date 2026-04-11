# Live Demo Plan — Public Chatbot + AI Failover

## Goal

Make the Bedside WhatsApp chatbot usable by **anyone** who scans a QR code during the hackathon pitch (not only seeded patients), and make the AI call layer resilient to Groq free-tier rate limits by failing over to Mistral transparently.

At the end of this plan, the following must be true:

1. Any WhatsApp number that messages the Evolution API instance gets a real, grounded chatbot response — not the "Sorry, I couldn't find your record" fallback.
2. The primary AI call goes to **Groq `llama-3.3-70b-versatile`**. If Groq throws, times out, or returns empty content, the code silently retries against **Mistral `mistral-large-latest`**. If both fail, the existing canned response is returned.
3. Burst traffic from the same phone is rate-limited to 1 message every 2 seconds (silent drop).
4. No schema changes, no handler changes, no frontend changes.
5. `bun run typecheck` passes cleanly.

---

## Context (read this before touching code)

### What this project is

Bedside is an AI-powered inpatient WhatsApp chatbot for hospitals, built for the Harvard HSIL Hackathon 2026 (April 10-11). Patients message via WhatsApp, nurses watch a React dashboard. Backend is Fastify + Bun + Supabase + Evolution API. See `AGENTS.md` and `README.md` for full context.

### Why this change is needed

- **Gate:** `bedside-backend/src/routes/webhook.ts:108` calls `lookupPatient(remoteJid)`, which queries the `patients` table for an exact `phone_number` match. Any unknown phone gets a "record not found" reply and the flow terminates. This is fine for production but wrong for a live demo where audience members scan a QR code.
- **AI quota risk:** The AI layer in `bedside-backend/src/ai/client.ts` currently hard-codes the Mistral SDK and ignores `AI_BASE_URL` from config. For the demo, we want Groq as the primary (faster, free) with Mistral as the safety net. Groq free tier has tight RPM limits; a provider-fallback chain is the right mitigation.
- **Burst safety:** A single enthusiastic demo attendee firing 10 messages in 3 seconds can burn through the primary quota. A per-phone 2-second debounce prevents this at zero UX cost.

### Model-agnostic, but in a specific way

`AGENTS.md:39` rule #3 says "Model-agnostic AI — Never hardcode an AI provider or model name. Use generic names: `aiClient`, `generateResponse`, `callAI`. Configure via environment variables only."

**Interpretation for this plan:** the public function signature `generateResponse(messages, language)` stays identical. Handlers do not need to know anything about Groq, Mistral, or fallback behavior. The two providers are wired via two separate env var groups (`GROQ_*`, `MISTRAL_*`) so swapping either one in the future is a config change, not a code change.

### Provider protocol

Both Groq and Mistral expose **OpenAI-compatible** chat endpoints. One `openai` npm SDK instance per provider, each configured with its own `apiKey` and `baseURL`, talks to both. **No calls ever go to openai.com.** The SDK name is a historical quirk.

---

## Hard Constraints (do not violate)

From `AGENTS.md`:

1. **Bun only** — use `bun add`, `bun remove`, `bun run`. Never npm/yarn/npx.
2. **TypeScript strict** — no `any` unless genuinely unavoidable.
3. **Multi-tenant** — every operational Supabase query must filter by `hospital_id`. This plan preserves that; do not regress it.
4. **No AI branding** — "Groq", "Mistral", "Llama", "Mistral Large" must never appear in patient-facing response text. They are allowed in env vars, code comments, and log output only.
5. **Schema is law** — do not add, remove, or rename any columns in `docs/SCHEMA_v2.md`.
6. **Error resilience** — every async function has error handling. The server must never crash from one bad webhook payload.

---

## Current State of the Working Tree

Before starting, note that **Step 1 (dependency swap) is already complete on the current branch**:

- `@mistralai/mistralai` has been removed from `bedside-backend/package.json`.
- `openai` (v6.34.0 at time of writing) has been added.
- `bun.lockb` / `bun.lock` reflects those changes.

Verify with `grep -E "openai|mistralai" bedside-backend/package.json` — you should see `openai` only. If you see `@mistralai/mistralai` still listed, run Step 1 below. Otherwise skip to Step 2.

**Everything else in this plan is not yet done.** `client.ts`, `config.ts`, `webhook.ts`, `patientLookup.ts`, and `.env.example` are all still in their pre-plan state. You will see `client.ts` importing from `@mistralai/mistralai` which will fail to compile — that's expected, fix it in Step 3.

---

## The Five Files You Will Touch

| File | What changes |
|---|---|
| `bedside-backend/package.json` | Dependency swap (already done — verify only) |
| `bedside-backend/src/config.ts` | Add Groq/Mistral/demo env vars, remove old `ai*` vars |
| `bedside-backend/.env.example` | Document the new variable layout |
| `bedside-backend/src/utils/patientLookup.ts` | Add `isDemo?: boolean` to `PatientWithHospital` |
| `bedside-backend/src/ai/client.ts` | Full rewrite — two-provider failover with timeout and logging |
| `bedside-backend/src/routes/webhook.ts` | Per-phone throttle + demo-mode patient fallback + gate language-preference write |

No other files should be modified. If you find yourself editing a handler (`scheduleHandler.ts`, `medicationHandler.ts`, `freeTextHandler.ts`, etc.), stop — you've gone out of scope.

---

## Step 1 — Dependency swap (verify)

```bash
cd bedside-backend
grep -E "openai|mistralai" package.json
```

Expected output:

```
    "openai": "^6.34.0"
```

**If `@mistralai/mistralai` still appears**, run:

```bash
bun remove @mistralai/mistralai
bun add openai
```

**Do not** run `npm install` or `yarn add` — Bun only.

**Acceptance:** `package.json` lists `openai`, does not list `@mistralai/mistralai`, and `bun.lock` reflects the same.

---

## Step 2 — Extend `config.ts`

Replace the entire contents of `bedside-backend/src/config.ts` with:

```ts
export const config = {
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",

  // Primary AI provider — Groq (OpenAI-compatible)
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  groqModel: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
  groqBaseUrl: process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1",

  // Fallback AI provider — Mistral (OpenAI-compatible)
  mistralApiKey: process.env.MISTRAL_API_KEY ?? "",
  mistralModel: process.env.MISTRAL_MODEL ?? "mistral-large-latest",
  mistralBaseUrl: process.env.MISTRAL_BASE_URL ?? "https://api.mistral.ai/v1",

  evolutionApiUrl: process.env.EVOLUTION_API_URL ?? "http://localhost:8080",
  evolutionApiKey: process.env.EVOLUTION_API_KEY ?? "",
  evolutionInstanceName: process.env.EVOLUTION_INSTANCE_NAME ?? "bedside-whatsapp",

  port: parseInt(process.env.PORT ?? "3000", 10),
  baseUrl: process.env.BASE_URL ?? "http://localhost:3000",

  // Demo mode — when true, unknown phones are served as the demo patient
  demoMode: (process.env.DEMO_MODE ?? "false").toLowerCase() === "true",
  demoPatientPhone: process.env.DEMO_PATIENT_PHONE ?? "",
} as const;
```

**Notes:**

- The old `aiProvider`, `aiApiKey`, `aiModel`, `aiBaseUrl` fields are removed. They are only referenced in `src/ai/client.ts`, which is rewritten in Step 5.
- `demoMode` is a boolean parsed from a string env var. Accept `"true"` / `"TRUE"` as truthy; anything else is false.
- `demoPatientPhone` should be in the same format as the seed data (`+5511991110001` for Roberto Alves). It will be normalized by `normalizePhone()` when used.

**Acceptance:** `grep -n "aiApiKey\|aiProvider\|aiModel\|aiBaseUrl" bedside-backend/src/` returns no hits outside the git history. The TypeScript compiler will error in `client.ts` at this point — that's expected, Step 5 fixes it.

---

## Step 3 — Update `.env.example`

Replace the entire contents of `bedside-backend/.env.example` with:

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Primary AI provider — Groq (OpenAI-compatible)
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_BASE_URL=https://api.groq.com/openai/v1

# Fallback AI provider — Mistral (OpenAI-compatible)
MISTRAL_API_KEY=
MISTRAL_MODEL=mistral-large-latest
MISTRAL_BASE_URL=https://api.mistral.ai/v1

EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE_NAME=bedside-whatsapp

PORT=3000
BASE_URL=http://localhost:3000

# Demo mode — when true, unknown phones are served as DEMO_PATIENT_PHONE.
# Enable during the live-demo pitch so QR-code scanners can interact with the bot.
DEMO_MODE=true
DEMO_PATIENT_PHONE=+5511991110001
```

**Do NOT edit `bedside-backend/.env`.** The owner of the repo will paste real API keys into `.env` manually after this plan is executed. The plan touches `.env.example` only.

**Acceptance:** `.env.example` documents all new variables with the example values shown above. The old `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, `AI_BASE_URL` lines are gone.

---

## Step 4 — Add `isDemo` flag to `PatientWithHospital`

Open `bedside-backend/src/utils/patientLookup.ts`. Find the `PatientWithHospital` interface and add one optional field:

```ts
export interface PatientWithHospital {
  patient: PatientRecord;
  hospital: HospitalRecord;
  isDemo?: boolean;
}
```

**Do not** change the `lookupPatient` function body. It continues to return a record with `isDemo` undefined. The demo-mode branch in `webhook.ts` (Step 6) is the only place that sets `isDemo: true`.

**Acceptance:** The interface has three fields. `lookupPatient` is unchanged. No other call site references `isDemo` yet.

---

## Step 5 — Rewrite `client.ts`

Replace the entire contents of `bedside-backend/src/ai/client.ts` with:

```ts
import OpenAI from "openai";
import { config } from "../config.js";
import type { ChatMessage } from "../session/sessionManager.js";

const REQUEST_TIMEOUT_MS = 8_000;

let primaryClient: OpenAI | null = null;
let fallbackClient: OpenAI | null = null;

function cannedResponse(language: string): string {
  if (language === "es") {
    return "Entiendo su pregunta. Permítame conectarle con su equipo de cuidados.";
  }
  if (language === "en") {
    return "I understand your question. Let me connect you with your care team.";
  }
  return "Entendi sua pergunta. Vou conectar voce com sua equipe de cuidados.";
}

function getPrimaryClient(): OpenAI | null {
  if (!config.groqApiKey) return null;
  if (!primaryClient) {
    primaryClient = new OpenAI({
      apiKey: config.groqApiKey,
      baseURL: config.groqBaseUrl,
    });
  }
  return primaryClient;
}

function getFallbackClient(): OpenAI | null {
  if (!config.mistralApiKey) return null;
  if (!fallbackClient) {
    fallbackClient = new OpenAI({
      apiKey: config.mistralApiKey,
      baseURL: config.mistralBaseUrl,
    });
  }
  return fallbackClient;
}

async function callProvider(
  client: OpenAI,
  model: string,
  messages: ChatMessage[],
): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await client.chat.completions.create(
      {
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      },
      { signal: controller.signal },
    );
    const content = response.choices?.[0]?.message?.content;
    return typeof content === "string" && content.length > 0 ? content : null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function generateResponse(
  messages: ChatMessage[],
  language: string,
): Promise<string> {
  const primary = getPrimaryClient();

  // Try primary provider
  if (primary) {
    try {
      const content = await callProvider(primary, config.groqModel, messages);
      if (content) return content;
      console.warn("[AI] Primary (Groq) returned empty content — falling back");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[AI] Primary (Groq) failed — falling back: ${msg}`);
    }
  } else {
    console.warn("[AI] Primary (Groq) not configured — trying fallback");
  }

  // Try fallback provider
  const fallback = getFallbackClient();
  if (fallback) {
    try {
      console.warn("[AI] FALLBACK ENGAGED -> Mistral");
      const content = await callProvider(fallback, config.mistralModel, messages);
      if (content) return content;
      console.error("[AI] Fallback (Mistral) returned empty content — canned response");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[AI] Fallback (Mistral) failed — canned response: ${msg}`);
    }
  } else {
    console.error("[AI] Fallback (Mistral) not configured — canned response");
  }

  // Both providers failed
  return cannedResponse(language);
}
```

**Important details:**

- **Fresh `AbortController` per call.** Do not reuse controllers across calls — once aborted, they stay aborted.
- **`clearTimeout` in `finally`.** Prevents a dangling timer after a successful call.
- **Logging is intentionally loud.** The `[AI]` prefix makes it easy to `grep` during the smoke test. Every fallback engagement prints to stderr (`console.warn`/`console.error`), which will appear in the terminal where `bun run dev` is running — the user will see it in real time during the demo.
- **Canned response is identical to the pre-plan one** (compare to `fallbackResponse` in the old `client.ts`). Do not change the wording or language logic — it's been reviewed and matches the LGPD and "no AI branding" constraints.
- **Module-level client caching** (`let primaryClient: OpenAI | null = null`) is intentional — it avoids re-creating the SDK on every call.

**Acceptance:**
- `bedside-backend/src/ai/client.ts` has no reference to `@mistralai/mistralai`.
- The exported function signature is **exactly** `generateResponse(messages: ChatMessage[], language: string): Promise<string>` — do not change the signature or the call sites in handlers break.
- `grep -n "generateResponse" bedside-backend/src/handlers/` must still compile cleanly — handlers should not need any changes.

---

## Step 6 — Update `webhook.ts`

Open `bedside-backend/src/routes/webhook.ts`.

### 6a. Add imports and the throttle map at the top

Near the top of the file, after the existing imports, add:

```ts
import { config } from "../config.js";
```

(Check — it may already be imported indirectly via another module. Add the line only if `config` is not already available in this file.)

Just below the `processedMessages` map (around line 19) add:

```ts
// Per-phone debounce: drop any message arriving within 2s of the previous
// message from the same phone. Prevents one demo attendee from burning the
// AI quota with rapid taps.
const THROTTLE_MS = 2_000;
const lastMessageAt = new Map<string, number>();

setInterval(() => {
  const cutoff = Date.now() - 60_000;
  for (const [phone, ts] of lastMessageAt) {
    if (ts < cutoff) lastMessageAt.delete(phone);
  }
}, 60_000);
```

### 6b. Add the throttle check after phone normalization

Find the line:

```ts
const phone = normalizePhone(remoteJid);
```

(currently around line 70). Immediately after it, add:

```ts
const throttleNow = Date.now();
const throttleLast = lastMessageAt.get(phone) ?? 0;
if (throttleNow - throttleLast < THROTTLE_MS) {
  console.log(`[throttle] dropped message from ${phone} (within ${THROTTLE_MS}ms)`);
  return;
}
lastMessageAt.set(phone, throttleNow);
```

**Why this placement:** after `normalizePhone` (so we key on the canonical phone string), after the group-message filter (line 65), but before patient lookup and any DB/AI work. This drops burst traffic as early as possible.

### 6c. Add the demo-mode patient fallback

Find the current block (around line 108):

```ts
// Look up patient
const ctx = await lookupPatient(remoteJid);
if (!ctx) {
  const lang = detectLanguage(messageText);
  const msg =
    lang === "es"
      ? "Lo siento, no encontre su registro. Por favor, hable con el equipo de enfermeria para obtener ayuda."
      : lang === "en"
        ? "Sorry, I couldn't find your record. Please speak with the nursing staff for assistance."
        : "Desculpe, nao encontrei seu registro. Por favor, fale com a equipe de enfermagem para obter ajuda.";
  await sendText(phone, msg);
  return;
}
```

Replace it with:

```ts
// Look up patient, with demo-mode fallback for the live hackathon demo
let ctx = await lookupPatient(remoteJid);

if (!ctx && config.demoMode && config.demoPatientPhone) {
  const demoCtx = await lookupPatient(config.demoPatientPhone);
  if (demoCtx) {
    // Clone the demo patient with the sender's real phone substituted.
    // Handlers read ctx.patient.phone_number to decide where to sendText,
    // so this re-routes replies back to the actual sender while keeping
    // the demo patient's appointments/medications/hospital context.
    ctx = {
      patient: { ...demoCtx.patient, phone_number: phone },
      hospital: demoCtx.hospital,
      isDemo: true,
    };
    console.log(
      `[demo-mode] serving ${phone} as demo patient ${demoCtx.patient.name}`,
    );
  }
}

if (!ctx) {
  const lang = detectLanguage(messageText);
  const msg =
    lang === "es"
      ? "Lo siento, no encontre su registro. Por favor, hable con el equipo de enfermeria para obtener ayuda."
      : lang === "en"
        ? "Sorry, I couldn't find your record. Please speak with the nursing staff for assistance."
        : "Desculpe, nao encontrei seu registro. Por favor, fale com a equipe de enfermagem para obter ajuda.";
  await sendText(phone, msg);
  return;
}
```

**Why this pattern:**

- **Phone substitution is the crux.** `ctx.patient.phone_number = phone` means every handler that does `const phone = normalizePhone(ctx.patient.phone_number)` (which is all of them) sends replies back to the real sender, not to Roberto's phone.
- **Session memory stays per-visitor.** `sessionManager.ts:7` keys by phone string; since we just put the sender's phone into `ctx.patient.phone_number`, each visitor gets an isolated AI conversation history.
- **Multi-tenant isolation preserved.** All queries downstream still filter by `ctx.patient.hospital_id`, which comes from the demo patient's hospital. No cross-tenant leakage.
- **Audit and conversation logs attribute to the demo patient_id** — which is *intentional*. Every demo visitor's activity will show up on the demo patient's card in the React dashboard, live. That's the money shot for the pitch.

### 6d. Gate the `preferred_language` write behind `!ctx.isDemo`

Find this block (currently around line 122):

```ts
// Detect language and update patient preference
const language = detectLanguage(messageText, ctx.hospital.language);
await supabase
  .from("patients")
  .update({ preferred_language: language })
  .eq("id", ctx.patient.id)
  .eq("hospital_id", ctx.patient.hospital_id);
```

Change it to:

```ts
// Detect language and update patient preference
const language = detectLanguage(messageText, ctx.hospital.language);
if (!ctx.isDemo) {
  await supabase
    .from("patients")
    .update({ preferred_language: language })
    .eq("id", ctx.patient.id)
    .eq("hospital_id", ctx.patient.hospital_id);
}
```

**Why:** otherwise ten demo visitors speaking three languages will all race to flip Roberto's `preferred_language` column. The write has no useful effect in demo mode anyway.

**Acceptance for Step 6:**
- `webhook.ts` has a throttle check, a demo-mode patient fallback, and a gated language-preference write.
- No other changes in `webhook.ts` — the intent routing, logging, and handler calls are untouched.
- The file compiles cleanly under `bun run typecheck`.

---

## Step 7 — Typecheck

```bash
cd bedside-backend
bun run typecheck
```

**Expected:** zero errors.

**If you see errors:**

- `Cannot find module 'openai'` → Step 1 wasn't applied. Run `bun add openai`.
- `Property 'aiApiKey' does not exist` → something outside `client.ts` was still referencing the old config. Check `grep -rn "aiApiKey\|aiProvider\|aiModel\|aiBaseUrl" bedside-backend/src/`.
- `Property 'isDemo' does not exist` → Step 4 wasn't applied. Add the field to `PatientWithHospital`.
- `Type 'undefined' is not assignable` → likely in Step 6c's `ctx = { ... }` object literal. The `isDemo: true` field must be present; the overall type must match `PatientWithHospital`.

**Do not `git add` or `git commit` anything.** Leave the tree dirty for the owner to review.

---

## Smoke Test (mandatory — do this before declaring done)

You need both API keys in `bedside-backend/.env`:

```
GROQ_API_KEY=<real key>
MISTRAL_API_KEY=<real key>
DEMO_MODE=true
DEMO_PATIENT_PHONE=+5511991110001
```

The repo owner will paste these. Do not invent values or commit keys.

### Test 1 — Happy path, known patient

1. Start the server: `cd bedside-backend && bun run dev`
2. From a WhatsApp number that matches `+5511991110001` (Roberto's seeded phone), send `hoje`.
3. **Expect:** schedule list reply in Portuguese. Log line: intent `schedule_request`, handler `deterministic`.
4. Send `tell me about paracetamol` (free text — hits the AI layer).
5. **Expect:** a coherent AI response. Log shows no `[AI]` warning — primary succeeded.

### Test 2 — Demo mode, unknown phone

1. From a WhatsApp number that is **not** seeded, send `hoje`.
2. **Expect:** Roberto's schedule list, delivered to the unknown sender's phone. Log line: `[demo-mode] serving <phone> as demo patient Roberto Alves`.
3. Send a free-text message from the same unknown phone.
4. **Expect:** a grounded AI response. The dashboard's patient detail view for Roberto should show the new inbound message in real time.

### Test 3 — Throttle

1. From the same unknown phone, fire three messages within 2 seconds.
2. **Expect:** only the first is processed. Log lines: two `[throttle] dropped message from <phone>` for the dropped ones.

### Test 4 — Fallback chain (if time permits)

1. Temporarily set `GROQ_API_KEY=` (empty) in `.env`, restart the server.
2. Send a free-text message.
3. **Expect:** a response still arrives. Log lines show `[AI] Primary (Groq) not configured — trying fallback` followed by `[AI] FALLBACK ENGAGED -> Mistral`.
4. Restore `GROQ_API_KEY` and restart.

If all four tests pass, the plan is complete.

---

## Rollback Plan (if something breaks close to demo time)

Each layer is independently reversible via env vars — no code revert needed.

| To disable | Do this |
|---|---|
| Demo mode (back to seeded-only) | Set `DEMO_MODE=false` in `.env`, restart |
| Throttle (let all bursts through) | Not env-gated; comment out the throttle check in `webhook.ts:~72` |
| Fallback provider (Groq only) | Set `MISTRAL_API_KEY=` (empty), restart. Failures will return the canned response. |
| Primary provider (Mistral only, via fallback path) | Set `GROQ_API_KEY=` (empty), restart. All AI calls will go through the fallback branch. |
| The whole AI layer | Set both `GROQ_API_KEY=` and `MISTRAL_API_KEY=` (empty), restart. Every AI call returns the canned response; deterministic handlers (schedule, medication, next, escalation, family) continue to work. |

If you need a nuclear revert: `git checkout -- bedside-backend/src/config.ts bedside-backend/src/ai/client.ts bedside-backend/src/routes/webhook.ts bedside-backend/src/utils/patientLookup.ts bedside-backend/.env.example` then `bun add @mistralai/mistralai && bun remove openai`.

---

## What This Plan Explicitly Does NOT Change

- **No schema changes.** `docs/SCHEMA_v2.md` is untouched.
- **No handler changes.** `scheduleHandler.ts`, `medicationHandler.ts`, `freeTextHandler.ts`, `escalationHandler.ts`, `familyHandler.ts`, `nextActionHandler.ts`, `intentRouter.ts` — none modified.
- **No frontend changes.** The React dashboard reads Supabase directly and will show demo visitor activity automatically once the backend writes conversation logs against the demo patient_id.
- **No prompt changes.** `promptBuilder.ts` is untouched.
- **No session manager changes.** `sessionManager.ts` already keys by phone, which is exactly what we need.
- **No new dependencies beyond `openai`.** No retry libraries, no rate-limit libraries, no queue libraries. All logic is ~30 lines of handwritten TypeScript.
- **No tests added.** This is a hackathon demo change; smoke-testing is the verification strategy.

---

## Known Non-Issues (don't "fix" these)

- **Multiple demo visitors will all appear as chats with "Roberto Alves"** on the dashboard. This is intentional — it showcases real-time activity to the judges.
- **`fromMe` messages are already filtered** at `webhook.ts:55`, so bot-replied messages don't loop.
- **Group messages are already filtered** at `webhook.ts:65`.
- **Injection detection still runs** before the AI call for demo visitors. This is correct — we do not want to disable safety filters just because someone scanned a QR code.
- **Escalation handler still creates real rows** in the `escalations` table if a demo visitor types "pain" or "dor". This is correct — it's the exact behavior the pitch is showcasing. Someone should click "Resolve" between takes to keep the list clean.
- **The `openai` npm package is not a call to OpenAI the company.** It is the SDK that speaks the OpenAI REST protocol. Groq and Mistral both implement that same protocol. No traffic goes to openai.com. Do not swap this out for another library unless you have a specific reason.

---

## Open Question for the Owner (not for the executing agent)

- Does Groq's `llama-3.3-70b-versatile` free-tier daily cap have enough headroom for the demo? Check the Groq console → Dashboard → filter metrics by model. If the daily request count for `llama-3.3-70b-versatile` specifically is already high (note: `whisper-large-v3-turbo` usage is on a separate quota and does not count), consider swapping the primary to `llama-3.1-8b-instant` at the last minute by setting `GROQ_MODEL=llama-3.1-8b-instant` in `.env`. This is a config-only change, no re-deploy needed.

---

## Definition of Done

All of the following must be true:

- [ ] `bun run typecheck` passes with zero errors.
- [ ] Test 1 (happy path, known patient) passes.
- [ ] Test 2 (demo mode, unknown phone) passes.
- [ ] Test 3 (throttle) passes.
- [ ] `git diff bedside-backend/.env` is empty (no real keys committed).
- [ ] `git status` shows exactly six modified files: `package.json`, `bun.lock` (or `bun.lockb`), `src/config.ts`, `src/ai/client.ts`, `src/routes/webhook.ts`, `src/utils/patientLookup.ts`, `.env.example`. (Seven if you count `bun.lock`.)
- [ ] No new files created.
- [ ] No changes to `docs/`, `bedside-frontend/`, `seed/`, handlers, or any other directory.

Report completion with: the exact output of `bun run typecheck` and a one-sentence summary of each smoke test result. Do not claim done without running the smoke tests.
