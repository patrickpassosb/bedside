# Bedside

AI-powered inpatient patient communication platform. Harvard HSIL Hackathon 2026.

## Agent Instructions

Read [AGENTS.md](AGENTS.md) for complete project conventions, build order, and execution strategy.

## Quick Reference

- **Runtime:** Bun (never npm/npx/yarn)
- **Language:** TypeScript strict mode
- **Backend spec:** `docs/AGENT_1_BACKEND_v2.md`
- **Frontend spec:** `docs/AGENT_2_FRONTEND_v2.md`
- **Schema:** `docs/SCHEMA_v2.md` (source of truth — follow exactly)
- **Design:** `docs/GOOGLE_STITCH_PROMPT_v2.md`

## Rules

- AI layer is model-agnostic — never hardcode provider names
- Every Supabase query must filter by `hospital_id`
- Patient-facing responses adapt to the patient's language
- Server must never crash from a single bad message
