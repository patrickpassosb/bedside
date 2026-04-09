# Google Stitch Design Prompt v2 — Bedside Platform Dashboard
# Paste this entire prompt into Google Stitch to generate UI designs.
# Request both light and dark theme versions of every screen.
# After generating, screenshot every screen and attach to AGENT_2_FRONTEND_v2.md.

---

## PROMPT TO PASTE INTO GOOGLE STITCH

Design a beautiful, modern SaaS dashboard for a healthcare platform called Bedside.
Bedside is a patient communication and monitoring platform used by hospital nurses
and staff to manage hospitalized patients who interact with an AI assistant via WhatsApp.

This is NOT a hospital's internal system — it is a SaaS platform that hospitals
subscribe to. The branding is Bedside, not any specific hospital.
The dashboard is in English. It must feel like a premium B2B SaaS product —
think Linear, Notion, or Vercel in terms of design quality — applied to healthcare.

Design ALL screens listed below in BOTH light and dark themes.
The light theme should feel clean and clinical — white, sky blue accents, generous space.
The dark theme should feel sophisticated and modern — deep navy, bright blue accents.
Include a light/dark toggle button (sun/moon icon) in the top bar of every screen.
Both themes must look equally excellent — equal effort on both.

---

## BRAND

Product name: Bedside
Tagline: AI-powered patient communication platform
Primary color: #0EA5E9 (sky blue)
Font: Inter (Google Fonts)
Icons: Lucide React style (thin, modern)

Light theme colors:
- Page background: #F8FAFC
- Card background: #FFFFFF
- Nav background: #FFFFFF
- Primary: #0EA5E9
- Success: #10B981
- Warning: #F59E0B
- Danger: #EF4444
- Text: #0F172A
- Muted text: #64748B
- Border: #E2E8F0

Dark theme colors:
- Page background: #0F172A
- Card background: #1E293B
- Nav background: #1E293B
- Primary: #38BDF8
- Success: #34D399
- Warning: #FBBF24
- Danger: #F87171
- Text: #F1F5F9
- Muted text: #94A3B8
- Border: #334155

---

## LAYOUT SHELL (applies to all screens except Family Page)

Left sidebar (240px):
- Top: "Bedside" wordmark in primary color with a small animated pulse dot (live indicator)
- Navigation items with thin icons:
  - Dashboard icon — "Overview" — active/selected state
  - Activity icon — "Activity Feed"
  - Alert triangle icon — "Escalations" — red badge showing "2"
  - Settings/user plus icon — "Admin" — for managing patients, appointments, medications
- Bottom: "Hospital Isaac Newton" in small muted text — "Logged in as:" prefix
  This shows which hospital tenant is logged in — NOT the product name.
- Active item: primary color left border accent + subtle primary tint background
- Inactive items: muted text, subtle hover effect

Top bar (full width):
- Left: Current page title in 24px bold
- Center: "14:32:07" in monospace font — Brazil timezone live clock
- Right: Sun/moon toggle button + "Bedside Platform" in small muted text

Content area: 24px padding, max 1400px centered.

---

## SCREEN 1 — OVERVIEW (Default Dashboard)

Page title: "Overview"

Top row — 4 metric cards side by side:

Card 1: "Active Patients" — large number "12" — person icon — neutral blue accent
Card 2: "Pending Escalations" — large number "2" in red — alert icon — red accent
         (when > 0 this card has a red tint and red border)
Card 3: "Messages Today" — large number "47" — message icon — green accent
Card 4: "AI Responses Today" — large number "23" — sparkle/star icon — purple accent

Patient grid (3 columns) below the metric cards:

Patient Card design — each card is a white rounded card with subtle shadow:

Show 6 patient cards total. Include variety:

Card 1 (Roberto Alves):
- 48px avatar circle with initials "RA" in blue
- Top right: "Post-Op ICU" ward badge in blue pill
- Name: "Roberto Alves" bold
- Bed: "Bed 03A" small muted
- Condition: "Post-op cardiac bypass" muted text, 1 line
- Physician: "Dr. Ana Ferreira" small muted
- Bottom: "Last contact: 2 min ago" + RED "🚨 Escalation" badge
- Red glowing border on this card — has pending escalation

Card 2 (Maria Santos):
- Avatar "MS" in purple
- "Surgical Ward B" badge in purple
- Last contact: 8 min ago
- Small green animated pulse dot (recent activity)

Card 3 (Fábio Lima):
- Avatar "FL" in teal
- "Medical Ward A" badge in teal
- Last contact: 15 min ago

Cards 4-6: additional patients with different wards and colors.

One of the patient cards (Maria Santos) should have a subtle blue pulse glow animation
around the card border — this demonstrates real-time updates when a new message arrives.
Show a small "Just now" label in primary blue near the last contact text.

Card hover: subtle elevation increase, smooth transition.
Click anywhere on card → goes to patient detail.

---

## SCREEN 2 — ACTIVITY FEED

Page title: "Activity Feed"

Filter pills row: "All" (selected/active) | "Automatic" | "AI" | "Escalations"
Active filter: primary color background.

Real-time activity table below. Newest at top.
Show 10 rows with variety.

Table columns:
- Time (HH:MM:SS monospace font)
- Patient (first name + small ward pill)
- Intent (colored pill)
- Handler (colored pill)
- Summary (muted text, truncated)

Intent pill colors:
- "📅 Schedule" → blue
- "💊 Medication" → purple
- "➡️ Next Step" → teal
- "🚨 Escalation" → red (with subtle red row background)
- "💬 Question" → orange
- "👨‍👩‍👧 Family" → green

Handler pill colors:
- "⚡ Automatic" → gray
- "✨ AI" → violet/purple
- "🚨 Alert" → red

Example rows:
- 14:31:42 | Roberto | Post-Op ICU | 💊 Medication (purple) | ✨ AI (violet) | "Explained Captopril 25mg purpose and dosage"
- 14:30:15 | Maria | Surgical Ward B | 📅 Schedule (blue) | ⚡ Automatic (gray) | "Sent today's schedule: 3 procedures"
- 14:28:03 | Fábio | Medical Ward A | 🚨 Escalation (red) | 🚨 Alert (red) | "Intense pain reported — care team notified"
- 14:25:44 | Roberto | Post-Op ICU | 💬 Question (orange) | ✨ AI (violet) | "Answered fasting question before echocardiogram"
- 14:22:11 | Maria | Surgical Ward B | ➡️ Next Step (teal) | ⚡ Automatic (gray) | "Physiotherapy session at 10:00"

Alternating subtle row background.
Newest row at top has a very subtle highlight (just arrived).

---

## SCREEN 3 — ESCALATIONS

Page title: "Escalations"

Two tabs: "Pending (2)" | "Resolved"
Pending tab is selected.

Two escalation cards side by side (or stacked on smaller screens):

Escalation Card 1 (PENDING):
- 4px solid red left border
- Very subtle red background tint on the card
- Top row: "Roberto Alves" bold + "Post-Op ICU" badge + "Bed 03A"
- "8 minutes ago" in red text
- "Dr. Ana Ferreira" in small muted text
- Reason box (slightly different bg, rounded): 
  "I'm feeling intense chest pain and having difficulty breathing"
- Full-width red primary button: "Resolve Escalation"

Escalation Card 2 (PENDING):
- Same design
- Patient: "Fábio Lima" — Medical Ward A — Bed 07C
- "3 minutes ago" — more urgent
- Reason: "I need help, the oxygen feels insufficient"
- Same resolve button

Below the pending cards, show a resolved section header and 2 resolved cards
in gray/muted style with "Resolved by Nurse Silva at 13:45" footer.

In the dark theme version of this screen, show a toast notification in the
bottom-right corner: "🚨 New escalation — Fábio Lima, Medical Ward A"
with a subtle red-tinted background. This demonstrates the real-time alert system.

Empty state for when no pending escalations:
Large green checkmark SVG illustration centered + 
"No pending escalations" in 18px
"All patients are doing well! 💚" in muted text

---

## SCREEN 4 — PATIENT DETAIL

Page title: "Patient Detail" (back arrow on the left)

Patient header (full width, above the two columns):
- 64px avatar circle "RA" in blue
- "Roberto Alves" in 24px bold
- "62 years • Post-Op ICU • Bed 03A"
- "Post-op cardiac bypass" as a blue condition pill
- "Dr. Ana Ferreira • Admitted April 9, 2026" in small muted text
- Right side: "Family Sharing: Active ✓" in green pill

Two columns below:

LEFT COLUMN (60%):

Section "Today's Schedule" — with expand/collapse arrow, currently expanded:
3 appointment cards:
- "✅ 06:00 — Blood collection — Room" (completed, text strikethrough, green check)
- "🔵 09:00 — Echocardiogram — Imaging Room 2nd Floor"
  Below: "Preparation: Stay lying down and resting" in muted amber text
  Amber badge: "In 35 minutes"
- "🔵 11:00 — Respiratory physiotherapy — Room"

Section "Current Medications" — expanded:
3 medication cards:
- "Captopril" bold + "25mg" gray badge + "Oral" blue badge
  Frequency: "Every 12 hours" muted
  Expandable: "Purpose: To control blood pressure" — currently expanded
- "Aspirin" + "100mg" + "Oral"
  "Daily" + "Purpose: To prevent blood clot formation"
- "Enoxaparin" + "40mg" + "Subcutaneous"
  Amber "Due in 45 min" badge

Section "Sharing" — collapsed, show collapsed state.

RIGHT COLUMN (40%):

Header: "Conversation with Bedside" + "+5511991110001" in small muted text

Chat area (scrollable):
- Patient bubble (left, gray, rounded right): "what exams do I have today?" — 14:15
- Bedside bubble (right, blue, rounded left): "Hello Roberto! Here's your schedule for today:
  📅 06:00 Blood collection ✅ completed
  📅 09:00 Echocardiogram — Imaging Room 2nd floor
  📅 11:00 Respiratory physiotherapy..." — 14:15
- Patient bubble (red tint): "I'm feeling a lot of pain" — 14:22
- Bedside bubble (slightly different, alert style): "Understood Roberto, I'm notifying 
  your care team right now 🔔 A nurse will come to you shortly..." — 14:22
- Patient bubble: "what is captopril for?" — 14:31
- Bedside bubble: "Captopril is a medication that helps control your blood pressure. 
  Think of it as relaxing your blood vessels so your heart works with less effort. 
  Your next dose is at 20:00 today. Any other questions?" — 14:31

At the very bottom of the right column:
Text input field: "Send message as care team..."
Blue send button with arrow icon

---

## SCREEN 5 — ADD PATIENT (Admin Panel)

Page title: "Add Patient"

Three tabs: "New Patient" (active) | "Add Appointment" | "Add Medication"

"New Patient" tab content:
Two-column form layout.

Left column fields:
- Full Name (label above, text input, placeholder "e.g. Roberto Alves")
- WhatsApp Number (label, text input, placeholder "+55 11 99999-9999")
- Age (label, number input)
- Medical Condition (label, text input, placeholder "Plain language description")

Right column fields:
- Ward (label, select dropdown showing "Post-Op ICU")
- Bed Number (label, text input, placeholder "e.g. 03A")
- Admission Date (label, date picker, showing today's date)
- Attending Physician (label, text input)

Full-width primary blue button below both columns:
"Register Patient & Send Welcome Message 📱"

Small note in muted text below button:
"A welcome WhatsApp message will be sent automatically to the patient upon registration"

---

## SCREEN 6 — FAMILY PAGE (Mobile View)

This is completely different from the dashboard.
No sidebar, no top bar, no dark mode.
Always white background. Designed for mobile (show inside a phone frame 375px wide).

Top: "Bedside" in primary blue color, 24px, centered
Subtitle: "Informações do Paciente" in muted text, centered

Divider line

"Você está acompanhando" in muted text, small, centered
"Roberto" in 28px warm text, centered
"UTI Pós-Operatória • Hospital Isaac Newton" in muted text, centered

Section card "Agenda de Hoje":
- Clean white card with subtle border
- 3 list items:
  - ✅ "06:00 — Coleta de sangue" (completed)
  - "09:00 — Ecocardiograma"
  - "11:00 — Fisioterapia respiratória"

Section card "Medicamentos Atuais":
- 3 list items:
  - "Captopril 25mg — Para controlar a pressão arterial"
  - "Aspirina 100mg — Para prevenir coágulos sanguíneos"
  - "Enoxaparina 40mg — Para prevenir trombose"

Footer centered:
"Atualizado às 14:32"
"Powered by Bedside" in primary color

---

## DELIVERY REQUEST

Please generate:
1. Screens 1 through 5 in LIGHT theme
2. Screens 1 through 5 in DARK theme
3. Screen 6 (Family Page) in light only — show inside a mobile phone frame
4. Show the theme toggle button clearly in both states (sun icon for light, moon icon for dark)

5. A simple architecture diagram showing the system flow:
   Patient Phone → WhatsApp (Evolution API) → Bedside AI Backend → Supabase Database → Nurse Dashboard
   Use the same brand colors (#0EA5E9 primary). Include icons for each component.
   This will be used as a visual aid in the hackathon pitch presentation.

Use real Brazilian patient names and realistic medical data throughout.
All UI text in English (the patient WhatsApp messages can be in Portuguese — that's realistic).
The Family Page (Screen 6) is in Portuguese — it is designed for Brazilian patients' families.
Make this look like a real, premium product worthy of being presented at a Harvard hackathon.
The design quality should match Linear or Vercel — not a generic hospital system.
