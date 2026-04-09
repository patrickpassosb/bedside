# Deep Interview Spec: Bedside Hackathon Strategy

## Metadata
- Interview ID: bedside-hackathon-prep-2026
- Rounds: 9
- Final Ambiguity Score: 18.3%
- Type: brownfield
- Generated: 2026-04-06
- Threshold: 0.2
- Status: PASSED

## Clarity Breakdown
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Goal Clarity | 0.85 | 0.35 | 0.298 |
| Constraint Clarity | 0.80 | 0.25 | 0.200 |
| Success Criteria | 0.80 | 0.25 | 0.200 |
| Context Clarity | 0.80 | 0.15 | 0.120 |
| **Total Clarity** | | | **0.818** |
| **Ambiguity** | | | **0.183** |

## Goal
Prepare a comprehensive hackathon execution strategy for the Harvard HSIL Hackathon 2026 (April 10-11) to build **Bedside** — an AI-powered inpatient patient communication platform — as fast as possible with maximum quality, optimized to win against the 6-category judging rubric (/30 total).

### Four Deliverables
1. **Google Stitch prompt review** — Review and improve `docs/GOOGLE_STITCH_PROMPT_v2.md` before running it through Google Stitch to generate UI screenshots
2. **Pre-hackathon preparation checklist** — Everything to do in the next 4 days (April 6-9) that is allowed under hackathon rules
3. **Hackathon day battle plan** — Hour-by-hour execution strategy for April 10-11 with agent orchestration
4. **Agent spec optimization** — Review and optimize `AGENT_1_BACKEND_v2.md` and `AGENT_2_FRONTEND_v2.md` for efficient execution in a Claude Code ralph loop

## Constraints
- **No pre-built code**: All application code must be written during the hackathon (April 10-11). Pre-existing ideas, specs, designs, and documentation are explicitly allowed by HSIL rules.
- **Team of 2**: Patrick (sole developer, uses Claude Code) + partner (anesthesiologist, handles pitch/clinical/medical aspects). May recruit additional members on the day.
- **Solo coder**: Patrick builds everything using AI agents. No other developers on the team.
- **Parallel agent strategy**: Claude Code (ralph loop) builds the backend; Google Antigravity agent builds the frontend. Both run simultaneously with Patrick monitoring.
- **WhatsApp chatbot is the core**: Build priority is WhatsApp AI assistant first, then dashboard, then extras.
- **Infrastructure partially ready**: Supabase account exists. Evolution API tested before. API keys and project configuration still needed.
- **3-minute pitch on Day 2**: Pitch on Saturday April 11 in front of 3-5 judges with clinical, technical, and business expertise.
- **Tech stack**: Bun runtime, Fastify backend, React + Tailwind frontend, Supabase (PostgreSQL + Realtime), Evolution API (WhatsApp), TypeScript strict mode.
- **Google Stitch designs not yet generated**: Prompt exists in `docs/GOOGLE_STITCH_PROMPT_v2.md` but has not been run through Google Stitch yet.

## Non-Goals
- Building a production-ready, scalable system (this is a hackathon prototype)
- Implementing all 10 database tables if time doesn't allow (schema can be simplified)
- Achieving 100% feature completeness — optimize for demo impact, not coverage
- Writing comprehensive tests during the hackathon (unit tests are not what judges evaluate)
- Deploying to production infrastructure (local/demo deployment is sufficient)

## Acceptance Criteria
- [ ] Google Stitch prompt reviewed and improved; user has run it and has UI screenshots before April 10
- [ ] Pre-hackathon checklist delivered with all preparation tasks for April 6-9
- [ ] Hour-by-hour battle plan for April 10-11 with clear milestones and go/no-go decision points
- [ ] Agent specs reviewed and optimized for ralph loop execution (clear steps, no ambiguity for the AI agent)
- [ ] Pitch strategy aligned with judging rubric: Challenge (/5), Technology & Innovation (/5), Implementation (/5), Team (/5), Pitch (/5), Q&A (/5)
- [ ] Critical path defined: WhatsApp chatbot -> Dashboard -> Escalations -> Extras
- [ ] Fallback plan for each milestone if agent execution takes longer than expected

## Assumptions Exposed & Resolved
| Assumption | Challenge | Resolution |
|------------|-----------|------------|
| Need fully working prototype to win | FAQ says "no requirement for fully working prototypes" | Having a working demo is a massive advantage but not required. Optimize for demo moments. |
| Can't do any prep before hackathon | Hackathon explicitly allows "pre-established ideas" | Specs, designs, UI screenshots, documentation, strategy — all allowed. Only code must happen on-site. |
| Need to build all 27 spec steps | Simplifier challenge: "What's the minimum?" | WhatsApp chatbot is the core. Dashboard adds visual wow. Everything else is stretch. |
| Need a big team to compete | Rubric has 6 equal categories; only 1 is "Team" | 2-person team with clinical + technical is actually a strong combination for 5 of 6 categories. |
| Solo coding is too slow | User has Claude Code + Google Antigravity in parallel | Two AI agents building simultaneously while user monitors = effective parallelization. |
| Infrastructure setup = coding | Setting up accounts and API keys is not application code | Supabase project, Evolution API config, and API keys can be prepared before the hackathon. |

## Technical Context

### Existing Codebase (Brownfield - Specs Only)
- `docs/SCHEMA_v2.md` — Complete PostgreSQL schema (10 tables, multi-tenant with hospital_id)
- `docs/AGENT_1_BACKEND_v2.md` — 15-step backend build spec (Fastify + Supabase + WhatsApp + AI)
- `docs/AGENT_2_FRONTEND_v2.md` — 12-step frontend build spec (React + Tailwind + Supabase Realtime)
- `docs/GOOGLE_STITCH_PROMPT_v2.md` — UI design prompt for 6 screens (light + dark themes)
- `docs/HSIL/` — Hackathon documentation (FAQ, participant guide, event page)

### Key Infrastructure
- **Supabase**: Account exists. Need to create project, run schema SQL, configure Realtime, get API keys.
- **Evolution API**: Tested before. Free tier. Need to set up instance and connect WhatsApp number.
- **AI Provider**: Model-agnostic architecture. Need API key for chosen provider (Claude, GPT, etc.)
- **Bun**: Runtime for both backend and frontend. Need to install on hackathon laptop.

### Hackathon Judging Rubric (/30)
1. **Challenge** (/5) — Clear need, root causes, urgency → Partner leads (anesthesiologist perspective)
2. **Technology & Innovation** (/5) — Novel AI solution, UX, transformative potential → WhatsApp AI demo
3. **Implementation** (/5) — Business model, obstacles, stakeholder plan → Both contribute
4. **Team** (/5) — Right skill mix → Clinical + technical pairing
5. **Pitch** (/5) — Prototype demo, visual aids, next steps → Partner presents, Patrick demos
6. **Q&A** (/5) — Defend position → Partner on clinical, Patrick on technical

### Pitch Structure (3 minutes)
- **Introduction** (10 sec): Partner introduces team — doctor + engineer building for patients
- **Problem Statement** (20 sec): Partner describes inpatient communication gap from clinical experience
- **Product** (1 min): Patrick explains architecture — WhatsApp AI + nurse dashboard + real-time monitoring
- **Demo** (1 min): Live demo — patient texts WhatsApp → AI responds → dashboard updates in real-time
- **Wrap-up** (30 sec): Partner closes with impact vision + next steps

## Ontology (Key Entities)

| Entity | Type | Fields | Relationships |
|--------|------|--------|---------------|
| Bedside | core product | WhatsApp AI assistant, nurse dashboard, multi-tenant SaaS | Contains WhatsApp Chatbot, uses Supabase |
| Hackathon | event context | 2-day, April 10-11, Harvard HSIL, 3-min pitch, 6-criteria judging | Constrains Team, evaluates via Judging |
| Judging | evaluation | 6 criteria (Challenge, Tech, Implementation, Team, Pitch, Q&A), /30 total | Evaluates Bedside via Pitch |
| Team | participants | Patrick (dev), partner (anesthesiologist), possibly +members | Builds Bedside, delivers Pitch |
| Preparation | pre-event work | Stitch review, prep checklist, battle plan, spec optimization | Feeds into Hackathon execution |
| Pitch | deliverable | 3 min, intro/problem/product/demo/wrapup, visual aids | Evaluated by Judging, demos Bedside |
| Claude Code Agents | execution tool | Ralph loop, backend builder, autonomous with monitoring | Builds WhatsApp Chatbot + backend |
| WhatsApp Chatbot | core feature | AI assistant, Portuguese, schedule/meds/escalation intents | Core of Bedside, uses Evolution API |
| Evolution API | infrastructure | WhatsApp integration, free tier, tested before | Enables WhatsApp Chatbot |
| Google Stitch | design tool | UI prompt, 6 screens, light/dark themes, not yet run | Generates designs for frontend |
| Google Antigravity Agent | execution tool | Frontend builder, React, parallel to Claude Code | Builds dashboard frontend |

## Ontology Convergence

| Round | Entity Count | New | Changed | Stable | Stability Ratio |
|-------|-------------|-----|---------|--------|----------------|
| 1 | 6 | 6 | - | - | N/A |
| 2 | 6 | 0 | 0 | 6 | 100% |
| 3 | 7 | 1 | 0 | 6 | 85.7% |
| 4 | 9 | 2 | 0 | 7 | 77.8% |
| 5 | 10 | 1 | 0 | 9 | 90.0% |
| 6 | 10 | 0 | 0 | 10 | 100% |
| 7 | 10 | 0 | 0 | 10 | 100% |
| 8 | 11 | 1 | 0 | 10 | 90.9% |
| 9 | 11 | 0 | 0 | 11 | 100% |

## Interview Transcript
<details>
<summary>Full Q&A (9 rounds)</summary>

### Round 1
**Q:** What are the hackathon's judging criteria?
**A:** Pointed to hackathon PDFs. Judging rubric found: 6 categories (/30 total) — Challenge, Technology & Innovation, Implementation, Team, Pitch, Q&A. 3-minute pitch on Day 2. No requirement for fully working prototypes.
**Ambiguity:** 57.5% (Goal: 0.50, Constraints: 0.30, Criteria: 0.40, Context: 0.50)

### Round 2
**Q:** When you say you "cannot code before the hackathon," what exactly is the boundary?
**A:** General hackathon rule — come with design and idea ready, but code on the day. Specs and design are allowed. Doesn't want to arrive with pre-built solution.
**Ambiguity:** 51.3% (Goal: 0.50, Constraints: 0.55, Criteria: 0.40, Context: 0.50)

### Round 3
**Q:** How many people are on your team, and what are each person's skills?
**A:** Team of 2 — Patrick (sole developer, uses Claude Code + AI agents) and partner (anesthesiologist, handles pitch/presentation/medical aspects). May add members on the day.
**Ambiguity:** 40.3% (Goal: 0.65, Constraints: 0.60, Criteria: 0.55, Context: 0.55)

### Round 4 [Contrarian Mode]
**Q:** What if you didn't need ALL the features to win? Would you build a smaller, polished subset?
**A:** WhatsApp chatbot is the core. Everything else is additive. Confident Claude Code can build everything. Wants recommendation on scope vs pitch quality.
**Ambiguity:** 37.3% (Goal: 0.70, Constraints: 0.65, Criteria: 0.55, Context: 0.55)

### Round 5
**Q:** What's the current status of your Google Stitch designs?
**A:** Prompt written but not yet sent to Google Stitch. Wants review of the prompt first.
**Ambiguity:** 35.8% (Goal: 0.70, Constraints: 0.65, Criteria: 0.55, Context: 0.65)

### Round 6 [Simplifier Mode]
**Q:** Which demo moments would make you confident you can win?
**A:** WhatsApp is the core. Everything else can be added. Confident AI can build it all.
**Ambiguity:** 31.5% (Goal: 0.75, Constraints: 0.65, Criteria: 0.65, Context: 0.65)

### Round 7
**Q:** Which infrastructure accounts do you already have set up?
**A:** Supabase account exists. Evolution API tested before. Not everything is set up yet.
**Ambiguity:** 28.3% (Goal: 0.75, Constraints: 0.75, Criteria: 0.65, Context: 0.70)

### Round 8
**Q:** How do you envision using Claude Code on hackathon day?
**A:** Two parallel agents — Claude Code (ralph loop) for backend, Google Antigravity agent for frontend. Both run autonomously while Patrick monitors.
**Ambiguity:** 23.3% (Goal: 0.80, Constraints: 0.75, Criteria: 0.75, Context: 0.75)

### Round 9
**Q:** Confirmed 4 deliverables — Stitch review, prep checklist, battle plan, spec optimization. Correct?
**A:** "Yes, all four."
**Ambiguity:** 18.3% (Goal: 0.85, Constraints: 0.80, Criteria: 0.80, Context: 0.80)

</details>
