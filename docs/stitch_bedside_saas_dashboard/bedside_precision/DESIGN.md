# Design System Specification: Clinical Precision & Editorial Calm

## 1. Overview & Creative North Star
The design system is built upon the North Star of **"The Clinical Curator."** In the high-stakes world of B2B healthcare, software often feels cluttered and anxiety-inducing. This system rejects that chaos. It treats patient data and clinical workflows with the same reverence a high-end gallery treats art—using generous negative space, intentional asymmetry, and a sophisticated tonal hierarchy.

By moving beyond the "standard SaaS dashboard," we utilize a layering philosophy inspired by physical objects—frosted glass, stacked vellum, and soft ambient light. The result is a platform that feels authoritative yet effortless, reducing cognitive load for healthcare professionals through a signature editorial aesthetic.

---

## 2. Colors & Surface Philosophy
Color in this system is not just decorative; it is structural. We move away from the "bordered box" mentality toward a more fluid, atmospheric layout.

### The "No-Line" Rule
Designers are prohibited from using 1px solid borders for primary sectioning. Instead, boundaries are defined by:
- **Background Shifts:** Using `surface-container-low` against a `background` page.
- **Tonal Transitions:** Defining functional zones through subtle shifts in lightness rather than a hard stroke.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the Material-inspired surface tiers to create depth:
- **Surface (Background):** `#f7f9fb` — The canvas.
- **Surface-Container-Low:** `#f2f4f6` — Large structural areas (sidebars, secondary panels).
- **Surface-Container-Lowest (White):** `#ffffff` — Primary content cards that need to "pop."
- **Surface-Container-High:** `#e6e8ea` — High-priority interactive elements or "active" states.

### The "Glass & Gradient" Rule
To elevate the experience, use **Glassmorphism** for floating elements (modals, popovers, navigation). Apply the `surface` color at 70% opacity with a `20px` backdrop-blur. 
**Signature Texture:** For primary CTAs and high-impact headers, use a subtle linear gradient from `primary` (`#006591`) to `primary_container` (`#0ea5e9`) at a 135° angle. This adds "soul" and depth to an otherwise flat digital environment.

---

## 3. Typography
We utilize **Inter** as a singular, powerful typeface. Its neutrality allows our layout's "Editorial" structure to speak.

*   **Display (lg/md/sm):** Used sparingly for high-level data summaries or welcome states. These should have a slight negative letter-spacing (-0.02em) to feel "tight" and premium.
*   **Headline & Title:** These are the anchors. Use `headline-sm` for section headers. Ensure significant padding-top (at least 48px) to let the header breathe.
*   **Body (lg/md/sm):** `body-md` (0.875rem) is our workhorse. We prioritize a generous line-height (1.6) to ensure clinical notes and patient data are highly legible.
*   **Labels:** `label-sm` (uppercase, letter-spacing 0.05em) is used for metadata and category tags to create a rhythmic "Interstate" or "Wayfinding" feel.

---

## 4. Elevation & Depth
We eschew traditional "Drop Shadows" in favor of **Tonal Layering** and **Ambient Light.**

### The Layering Principle
Hierarchy is achieved by "stacking" tiers. A `surface-container-lowest` card sitting on a `surface-container-low` section creates a soft, natural lift. No shadow is required here; the color contrast provides the boundary.

### Ambient Shadows
When an element must float (e.g., a critical diagnostic modal):
- **Blur:** 32px to 64px.
- **Opacity:** 4% - 6%.
- **Color:** Use a tinted version of `on-surface` (a deep navy-blue tint) rather than pure black. This mimics natural light passing through a clinical environment.

### The "Ghost Border" Fallback
If a border is required for accessibility, use the **Ghost Border**: The `outline_variant` token at **15% opacity**. Never use 100% opaque borders for interior layout containment.

---

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary_container`) with `on_primary` text. No border. Radius: `md` (0.375rem).
- **Secondary:** Surface-tinted background (`primary` at 8% opacity). Soft, sophisticated, and low-contrast.
- **Tertiary:** Ghost style. No background until hover. Use for "Cancel" or low-priority actions.

### Cards & Lists
- **Forbid Dividers:** Do not use horizontal lines to separate list items. Use **8px - 12px vertical spacing** and a subtle background hover state (`surface-container-high`).
- **Nesting:** Place clinical data cards inside a `surface-container-low` wrapper to create a "tray" effect.

### Input Fields
- **State-Driven Design:** Default inputs should have no visible border, only a `surface-container-high` background. Upon focus, transition to a `primary` Ghost Border (20% opacity) and a subtle 4px glow.
- **Clinical Validation:** Error states (`error`) must be accompanied by an icon (Lucide) to ensure accessibility without relying solely on color.

### Patient "Status" Chips
- Use the **Tonal Palette**: A `success_container` background with `on_success_container` text. Avoid high-vibrancy "neon" colors; keep them muted and professional.

---

## 6. Do’s and Don’ts

### Do:
*   **Embrace Asymmetry:** Align primary content to the left but allow metadata or "Action Rails" to float with generous right-side margins.
*   **Use Lucide Icons Thoughtfully:** Set icons to a `1.5px` or `1.75px` stroke width. Icons should be `muted-text` color until interacted with.
*   **Nesting over Bordering:** Always try to separate two pieces of content with a subtle background color shift before reaching for a border.

### Don’t:
*   **Don't use pure black (#000000):** Use `on_surface` (#191c1e) for text. Pure black is too harsh for a high-end clinical feel.
*   **Don't crowd the interface:** If a screen feels "full," increase the spacing scale. This system relies on the "Luxury of Space."
*   **Don't use hard-coded shadows:** Always use the Ambient Shadow formula to maintain the "Frosted Glass" aesthetic.
*   **Don't use "Standard" Blue:** Stick strictly to the `primary` (#006591) and `primary_container` (#0ea5e9) values to avoid a "generic SaaS" look.