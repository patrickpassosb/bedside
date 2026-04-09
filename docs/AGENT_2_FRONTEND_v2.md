# Bedside — Frontend Agent Prompt v2
# Complete specification to build the entire Bedside dashboard frontend.
# Read every section completely before writing any code.
# Build in the exact order specified. Confirm each step before proceeding.
#
# HACKATHON PRIORITY: Dashboard (Step 5) is the most important screen for the demo.
# If time is limited, build: Dashboard → Patient Detail → Escalations.
# Activity Feed and Admin Panel are lower priority.

---

## What You Are Building

A beautiful, modern SaaS dashboard for the Bedside platform.
This is the hospital-facing interface — nurses and hospital staff use it
to monitor patients, manage escalations, add new patients, and communicate.

Bedside is a multi-tenant SaaS platform. The dashboard shows data for
the currently logged-in hospital. All UI text is in English.
The WhatsApp bot (separate system) handles patient-facing communication in
the patient's own language.

You are building the frontend only.
The backend is a separate Fastify server.
You read from Supabase directly via the JS client.
You write (create patients, resolve escalations, send messages) via the backend API.

---

## Critical Rules

- Use Bun as the runtime and package manager — never npm, npx, or yarn
- Use bun install, bun run, bunx only
- TypeScript strict mode throughout
- Never show raw database UUIDs or technical identifiers to users
- Never reference any AI provider or model name in the UI
- The AI handler is shown simply as "AI" in the dashboard
- All UI text in English
- Every component must handle loading, empty, and error states
- Supabase Realtime is critical — data must update live without manual refresh

---

## Tech Stack

- Framework: React 18 with TypeScript
- Build tool: Vite with Bun
- Styling: Tailwind CSS
- Icons: Lucide React
- Charts/metrics: Recharts
- Database: Supabase JS client (direct browser reads)
- Real-time: Supabase Realtime subscriptions
- Routing: React Router v6
- HTTP: native fetch (for backend API writes)
- Package manager: Bun

---

## Design System

### Typography
Font: Inter (import from Google Fonts)
Page titles: 24px weight-700
Section headers: 18px weight-600
Card titles: 16px weight-600
Body: 14px weight-400
Small/meta: 12px weight-400
Timestamps: system monospace

### Color System

Light theme:
- bg-page: #F8FAFC
- bg-card: #FFFFFF
- bg-nav: #FFFFFF
- primary: #0EA5E9
- primary-dark: #0284C7
- success: #10B981
- warning: #F59E0B
- danger: #EF4444
- text-primary: #0F172A
- text-secondary: #64748B
- border: #E2E8F0

Dark theme:
- bg-page: #0F172A
- bg-card: #1E293B
- bg-nav: #1E293B
- primary: #38BDF8
- primary-dark: #0EA5E9
- success: #34D399
- warning: #FBBF24
- danger: #F87171
- text-primary: #F1F5F9
- text-secondary: #94A3B8
- border: #334155

Implement as CSS variables on :root and [data-theme="dark"].
Both themes must look excellent — equal care for both.

### Design Principles
- Generous whitespace
- Smooth transitions (150ms ease) on all interactive elements
- Skeleton loaders for all loading states — never raw spinners
- Every list/table has a beautiful empty state with SVG illustration
- Toast notifications for all user actions
- Professional medical aesthetic — trustworthy, clean, modern

---

## Project Structure

```
bedside-frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── usePatients.ts
│   │   ├── useAuditLogs.ts
│   │   ├── useEscalations.ts
│   │   ├── useConversation.ts
│   │   └── useTheme.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── Layout.tsx
│   │   ├── ui/
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── ThemeToggle.tsx
│   │   └── features/
│   │       ├── PatientCard.tsx
│   │       ├── ActivityRow.tsx
│   │       ├── EscalationCard.tsx
│   │       └── MessageBubble.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── ActivityFeed.tsx
│   │   ├── Escalations.tsx
│   │   ├── PatientDetail.tsx
│   │   ├── AdminPanel.tsx
│   │   └── FamilyPage.tsx
│   └── types/
│       └── index.ts
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── .env
└── package.json
```

---

## Environment Variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_BACKEND_URL=http://localhost:3000
VITE_HOSPITAL_ID=
```

VITE_HOSPITAL_ID is the hardcoded hospital UUID for the hackathon.
In production this comes from the authenticated session.

---

## TypeScript Types

```typescript
interface Hospital {
  id: string
  name: string
  country: string
  language: string
  timezone: string
}

interface Patient {
  id: string
  hospital_id: string
  name: string
  age: number
  condition: string
  phone_number: string
  ward: string
  bed_number: string
  admission_date: string
  attending_physician: string
  status: string
  preferred_language: string
  created_at: string
}

interface Appointment {
  id: string
  patient_id: string
  title: string
  scheduled_time: string
  location: string
  preparation_notes: string
  completed: boolean
  appointment_date: string
}

interface Medication {
  id: string
  patient_id: string
  medication_name: string
  dosage: string
  frequency: string
  route: string
  reason: string
  next_due_time: string
  active: boolean
}

interface AuditLog {
  id: string
  patient_id: string
  intent_detected: string
  handler_used: string
  input_summary: string
  response_summary: string
  detected_language: string
  timestamp: string
  patients?: { name: string; ward: string }
}

interface Escalation {
  id: string
  patient_id: string
  reason: string
  status: string
  created_at: string
  resolved_at: string | null
  resolved_by: string | null
  patients?: { name: string; ward: string; bed_number: string; attending_physician: string }
}

interface ConversationLog {
  id: string
  patient_id: string
  direction: string
  message_text: string
  detected_language: string
  timestamp: string
}
```

---

## Layout

### Sidebar (240px wide, always visible)
- Top: "Bedside" wordmark with small pulse dot (live indicator)
- Navigation items with Lucide icons:
  - LayoutDashboard — Overview → /dashboard
  - Activity — Activity Feed → /activity
  - AlertTriangle — Escalations → /escalations (red badge with pending count)
  - UserPlus — Add Patient → /admin
- Bottom: Logged in as: {hospital.name} in small muted text + Bedside version
- Active item: primary color background, bold text
- Hover: subtle bg transition

### Top Bar (full width, always visible)
- Left: Current page title (bold, 24px)
- Center: Live clock in Brazil timezone — updates every second — monospace font
- Right: ThemeToggle component + "Bedside Platform" label in muted text

### Content Area
- Padding: 24px
- Max width: 1400px centered
- Scrollable

---

## Screen 1 — Dashboard (/dashboard)

Default route. Patient overview for nurses.

Top row — 4 metric cards:
- Total Active Patients — count from patients where status=active and hospital_id matches
- Pending Escalations — count where status=pending — red accent if > 0
- Messages Today — count of audit_logs today
- AI Responses Today — count of audit_logs where handler_used = "ai" today

Patient grid below — 3 columns:

PatientCard component:
- Colored avatar circle with patient initials (color derived from ward name hash)
- Ward badge (colored pill) + bed number
- Patient full name bold
- Condition text (1 line, truncated with ellipsis)
- Attending physician in muted text
- Bottom: "Last contact: X min ago" + escalation badge if pending
- Red glow border + red "🚨 Escalation" badge if pending escalation
- Subtle green animated pulse dot if last audit_log was within 2 minutes
- Click → navigate to /patients/:id
- Smooth hover elevation effect

Realtime: subscribe to patients and escalations INSERT/UPDATE.
Cards update immediately when data changes.

Skeleton: show 6 skeleton cards while loading.
Empty: illustration + "No active patients. Add a patient to get started."

---

## Screen 2 — Activity Feed (/activity)

Real-time log of all patient interactions.

Filter bar: All | Deterministic | AI | Escalations
Active filter highlighted in primary color.

Table with columns:
- Time — HH:MM:SS monospace
- Patient — first name + ward badge
- Intent — colored pill
- Handler — colored pill
- Summary — response_summary text truncated to 60 chars

Intent pills:
- schedule_request → blue "📅 Schedule"
- medication_question → purple "💊 Medication"
- next_action → teal "➡️ Next Step"
- escalation → red "🚨 Escalation"
- free_text → orange "💬 Question"
- family_toggle → green "👨‍👩‍👧 Family"
- injection_attempt → black "⚠️ Security"

Handler pills:
- deterministic → gray "⚡ Automatic"
- ai → violet "✨ AI"
- escalation → red "🚨 Alert"

New rows slide in from top with smooth animation when inserted.
Alternating row background for readability.

Realtime: subscribe to audit_logs INSERT for this hospital_id.
New rows prepend with slide-down animation.

Empty: illustration + "Waiting for patient messages..."

---

## Screen 3 — Escalations (/escalations)

Nurse escalation management.

Two tabs: "Pending (N)" and "Resolved"
Tab count badge updates in real time.

EscalationCard (pending):
- 4px red left border accent
- Very subtle red background tint
- Top: patient full name bold + ward badge + bed number
- "X minutes ago" in red
- Attending physician in muted text
- Reason box (slightly different bg): full reason text the patient gave
- "Resolve" button — primary red — full width
- On click: show inline input "Resolved by:" + confirm button
- After resolve: smooth slide-out animation, card moves to Resolved tab

EscalationCard (resolved):
- Gray left border
- Same info layout
- "Resolved by {name} at {time}" footer in muted text
- No action button

When new escalation arrives while user is on another page:
Show toast notification bottom-right: "🚨 New escalation — {patient name}, {ward}"

Empty (pending): green checkmark SVG + "No pending escalations. All patients are doing well! 💚"

Realtime: subscribe to escalations INSERT and UPDATE for this hospital_id.

---

## Screen 4 — Patient Detail (/patients/:id)

Most information-dense screen. Two-column layout.

Back button top-left → Dashboard.

Patient header (full width):
- 64px colored avatar with initials
- Full name in 24px bold
- Age + ward + bed on one line
- Condition tag (pill)
- Attending physician + admission date in muted text
- Family sharing status pill: "Family Sharing: Active ✓" (green) or "Family Sharing: Off" (gray)

Left column (60%):

Section "Today's Schedule" — collapsible, default expanded:
- Each appointment as a card:
  - Time pill + title + location
  - Preparation notes in muted text if present
  - Completed: strikethrough + green checkmark

Section "Current Medications" — collapsible, default expanded:
- Each medication as a card:
  - Name bold + dosage badge + route badge
  - Frequency in muted text
  - "Purpose:" + reason in plain language — expandable
  - Amber "Due soon" badge if next_due_time within 60 minutes

Section "Sharing" — collapsible:
- Family sharing enabled/disabled display
- If enabled: copyable family share URL

Right column (40%):

Chat interface:
- Header: "Conversation with Bedside" + patient phone (muted)
- Scrollable chat area — newest at bottom
- Inbound (patient): left-aligned gray bubble + timestamp
- Outbound (Bedside AI): right-aligned blue bubble + timestamp
- Nurse messages: right-aligned teal bubble with "Care Team" label + timestamp
- Auto-scroll to bottom on load and on new message

Nurse message input at bottom:
- Text input: "Send message as care team..."
- Send button with Send icon
- On send: POST to {BACKEND_URL}/admin/patients/:id/message
  Body: { message_text, sent_by: "Care Team" }
- Message appears immediately in chat

Realtime: subscribe to conversation_logs INSERT for this patient_id.
New messages appear in chat in real time.

Loading: skeleton for both columns.

---

## Screen 5 — Admin Panel (/admin)

Three tabs: "New Patient" | "Add Appointment" | "Add Medication"

Tab 1 — New Patient:
Two-column form layout.
Fields:
- Full name (text)
- WhatsApp number (text, placeholder "+55 11 99999-9999")
- Age (number)
- Medical condition (text — plain language)
- Ward (select: Post-Op ICU, Surgical Ward A, Surgical Ward B, Medical Ward A, Medical Ward B)
- Bed number (text)
- Admission date (date, default today)
- Attending physician (text)

Submit: "Register Patient & Send Welcome Message 📱"
Note below: "A welcome message will be sent automatically to the patient's WhatsApp"

On success: green toast + redirect to new patient's detail page.
On error: red toast with error message.
Loading state: button shows spinner + "Creating..."

Tab 2 — Add Appointment:
Patient selector dropdown (all active patients, show name + ward).
Fields:
- Procedure title
- Time (time picker)
- Location
- Preparation notes (textarea)
- Date (date picker, default today)
Submit: "Add to Schedule"

Tab 3 — Add Medication:
Patient selector dropdown (same).
Fields:
- Medication name
- Dosage
- Route (select: Oral, IV, Subcutaneous, Intramuscular, Inhaled)
- Frequency
- Purpose / why taking (textarea — plain language)
- Next dose (datetime picker)
Submit: "Add Medication"

---

## Screen 6 — Family Page (/family/:token)

Public route — no authentication, no dark mode, always white.
Data source: GET {BACKEND_URL}/family/:token

Mobile-first design (max-width 480px centered).

Header: "Bedside" in primary color + subtitle "Patient Care Information"
"You're following" + patient first name in large warm text
Ward + hospital name in muted text

Section "Today's Schedule":
Simple list — time + procedure title. Completed items have ✅.

Section "Medications":
List — name + dosage + plain-language purpose.

Footer: "Last updated {timestamp}" + "Powered by Bedside"

If token invalid or sharing disabled:
Full-page message: "This link is no longer active."
+ "Please ask the patient to reactivate sharing."

---

## Global Components

### Toast
Bottom-right corner. Auto-dismiss 4 seconds.
Types: success (green), error (red), info (blue), warning (amber).
Smooth slide-in from right, slide-out right.
Multiple toasts stack vertically.

### Skeleton
Animated gray pulse rectangles.
Match the shape of the content they replace.
Never use a spinner as the primary loading state.

### ThemeToggle
Sun icon (light mode) / Moon icon (dark mode).
Smooth icon transition on click.
Persists in localStorage.

### Avatar
Colored circle with patient initials.
Color derived deterministically from patient name (hash → hue).
Sizes: sm (32px), md (48px), lg (64px).

---

## Realtime Subscriptions

| Page | Table | Events | Action |
|---|---|---|---|
| Dashboard | patients | INSERT, UPDATE | Refresh patient cards |
| Dashboard | escalations | INSERT, UPDATE | Update escalation badges |
| Activity Feed | audit_logs | INSERT | Prepend row with animation |
| Escalations | escalations | INSERT | Prepend card with red flash |
| Escalations | escalations | UPDATE | Move resolved card to tab |
| Patient Detail | conversation_logs | INSERT | Append chat bubble |
| Sidebar | escalations | INSERT, UPDATE | Update pending count badge |

All subscriptions must filter by hospital_id using VITE_HOSPITAL_ID.

---

## Build Order

### Step 1 — Scaffold
Vite + React + TypeScript init with Bun. Install dependencies.
Tailwind setup. React Router setup. Basic App.tsx with one route.
CONFIRM: bun run dev starts, page renders.

### Step 2 — Theme system
Build useTheme hook. Build ThemeToggle. Implement CSS variables for both themes.
Persist in localStorage.
CONFIRM: Toggle switches themes smoothly. Persists on refresh.

### Step 3 — Layout shell
Build Sidebar, TopBar, Layout. Set up all routes (empty pages for now).
Live clock in TopBar updating every second.
CONFIRM: Navigation between routes works. Active item highlighted.

### Step 3.5 — Mock Data Fallback
If Supabase is not yet available (backend agent hasn't run seed), create a mock data
file `src/lib/mockData.ts` with the 3 seed patients from `docs/SCHEMA_v2.md` (Roberto
Alves, Maria Santos, Fábio Lima) including their appointments and medications.
Use mock data for development, switch to live Supabase when available.
This allows the frontend agent to work independently of the backend agent.

### Step 4 — Supabase
Initialize client. Test query on patients table.
CONFIRM: Data returns without error. If Supabase is not configured yet, fall back to mock data.

### Step 5 — Dashboard
Build metric cards, PatientCard, usePatients hook with Realtime.
CONFIRM: Patient cards show with seed data. Escalation badge appears correctly.

### Step 6 — Activity Feed
Build ActivityRow, feed table, useAuditLogs hook with Realtime.
CONFIRM: Rows appear. New row animates in when WhatsApp message sent.

### Step 7 — Escalations
Build EscalationCard, tabs, useEscalations hook with Realtime.
Build resolve flow with inline input.
CONFIRM: Sending escalation keyword in WhatsApp creates a card here.

### Step 8 — Patient Detail
Build two-column layout, chat interface, MessageBubble, useConversation hook.
Build nurse message send form.
CONFIRM: Full conversation visible. Nurse can send message. Realtime updates work.

### Step 9 — Admin Panel
Build all three tabs with forms.
Connect to backend API.
CONFIRM: Creating patient via form sends WhatsApp welcome message.

### Step 10 — Family Page
Build mobile-first family view.
Fetch from backend /family/:token.
CONFIRM: Valid token shows patient data. Invalid shows error state.

### Step 11 — Polish
Add all skeletons, empty states, error states.
Add Toast system globally.
Test both themes on every screen.
Test Realtime on every screen.
CONFIRM: Every screen looks polished in light and dark.

### Step 12 — Final check
Open dashboard. Send WhatsApp messages from test phones.
Every message must appear on dashboard within 2 seconds.
Escalation must create real-time card.
Resolve escalation must work end to end.
