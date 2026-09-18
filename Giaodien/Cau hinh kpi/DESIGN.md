---
name: IT Service & KPI Governance
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#3755c3'
  on-secondary: '#ffffff'
  secondary-container: '#708cfd'
  on-secondary-container: '#00217a'
  tertiary: '#005e6e'
  on-tertiary: '#ffffff'
  tertiary-container: '#00788c'
  on-tertiary-container: '#d7f6ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#dde1ff'
  secondary-fixed-dim: '#b8c4ff'
  on-secondary-fixed: '#001453'
  on-secondary-fixed-variant: '#173bab'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system establishes a high-reliability, enterprise-grade interface tailored for hospital IT infrastructures and complex operational organizations adhering to ITIL standards.

### Brand Personality & Philosophy
- **Clinical Precision & Operational Calm:** Healthcare IT demands zero ambiguity. The visual language conveys systematic reliability, order, and high diagnostic speed under high-stakes SLA windows.
- **Audience:** Hospital IT directors, systems engineers, department heads (clinical & administrative), and service desk technicians handling mission-critical medical records (HIS/EMR/PACS) and hardware requests.
- **Emotional Response:** Inspires trust, instantaneous clarity during emergency dispatch (Code Red incidents), and impartial fairness in objective KPI scoring and resolution tracking.

### Design Movement
**Corporate Modern / Modern Enterprise Data Architecture:** A disciplined fusion of structured utility grids, soft architectural radius tiers (`rounded-xl`), restrained ambient drop-shadows, and high-contrast diagnostic status cues. It eliminates decorative noise to prioritize rapid ticket triage, SLA adherence clocks, and transparent KPI metrics.

## Colors

The palette balances technical authority with rapid visual diagnostic triage across ticket statuses and performance bands.

### Palette Architecture
- **Primary Blue (`#2563EB`):** Main interactive brand driver for active controls, primary actions, standard priorities, and active nav states.
- **Deep IT Blue (`#1E40AF`):** Structural anchor used for top-level headers, active master sidebar nodes, and mission-critical action bars.
- **Cyber Cyan (`#06B6D4`):** Telemetry accent for automated alerts, live-refresh counters, system health indicators, and real-time SLA trackers.
- **Slate Neutral (`#0F172A`):** Deep charcoal ink base paired with `#F8FAFC` (app canvas backdrop) and `#F1F5F9` (segmented controls and panel borders) providing zero-glare readability.

### Semantic Triage & KPI Indicators
- **Emerald (`#10B981`):** Resolved tickets, normal SLA, Grade-A KPI achievements.
- **Amber (`#F59E0B`):** In-progress status, warning thresholds (SLA remaining < 20%), review queues.
- **Rose (`#EF4444`):** Emergency/Urgent tickets, SLA breaches, high-severity operational outage incidents.
- **Violet (`#8B5CF6`):** Pending supervisor approval, change-advisory board (CAB) review, managerial sign-off.

## Typography

The typography pairs **Plus Jakarta Sans** for crisp, structural section titles and dashboard headers with **Inter** for dense, readable data tables, SLA timers, and incident logs.

### Localization & Vietnamese Support
Both font families are configured with complete Latin Extended glyph sets to preserve accent marks, diacritics, and vertical metric stability across Vietnamese IT terminology (e.g., "Phiếu yêu cầu", "Thời hạn cam kết SLA", "Điểm đánh giá hiệu suất").

### Data & Numerics
Numeric readouts in ticket counts, countdowns, and KPI percentiles use tabular figures (`font-variant-numeric: tabular-nums`) to prevent alignment shifts during real-time data streaming.

## Layout & Spacing

The layout is built on an adaptive 12-column grid designed for dense information presentation without cognitive overload.

### Responsive Breakpoints & Grid Rhythm
- **Desktop (≥ 1280px):** 12-column fluid grid, 24px (`1.5rem`) gutters, 32px (`2rem`) margins. Persistent left navigation drawer (260px) and optional right triage drawer (360px).
- **Tablet (768px – 1279px):** 8-column layout, 20px (`1.25rem`) gutters, 24px (`1.5rem`) outer margin. The navigation condenses to an icon rail (72px).
- **Mobile (< 768px):** 4-column layout, 16px (`1rem`) gutters, 16px (`1rem`) outer margin. Ticket tables transform into modular card decks.

### Layout Philosophy
Components respect an 8pt base grid for spacing (`space-xs` = 4px, `space-sm` = 8px, `space-md` = 16px, `space-lg` = 24px, `space-xl` = 32px), creating aligned columns across complex KPI matrices and incident timelines.

## Elevation & Depth

Visual hierarchy uses a combined system of ultra-low contrast borders and diffused ambient shadows, avoiding heavy, skeuomorphic drops in favor of enterprise clarity.

### Depth Hierarchy
- **Level 0 (Canvas Base):** Background (`#F8FAFC`). No elevation or borders.
- **Level 1 (Cards, Data Grids, List Modules):** `#FFFFFF` surface with a crisp structural boundary (`1px solid #E2E8F0`) and a resting ambient shadow: `0px 1px 3px rgba(15, 23, 42, 0.04), 0px 1px 2px rgba(15, 23, 42, 0.02)`.
- **Level 2 (Hovered Cards, Splitters, Dropdowns):** `#FFFFFF` surface, border transitions to `#CBD5E1`, with elevation `0px 4px 6px -1px rgba(15, 23, 42, 0.07), 0px 2px 4px -2px rgba(15, 23, 42, 0.05)`.
- **Level 3 (Modals, Urgent Triage Drawers, SLA Escalation Popovers):** Elevated `#FFFFFF` surface with `0px 20px 25px -5px rgba(15, 23, 42, 0.1), 0px 8px 10px -6px rgba(15, 23, 42, 0.05)`.

### Border Integrity
Every container retains a 1px soft slate border (`#E2E8F0` or `#F1F5F9`) ensuring elements stay legible when running on standard institutional or clinical workstation monitors.

## Shapes

The interface balances corporate formality with modern software ergonomics.

### Curvature Tokens
- **Standard (`rounded` / `0.5rem`):** Applied to form inputs, buttons, dropdown triggers, SLA badge tags, and table row selections.
- **Container (`rounded-lg` / `1rem`):** Applied to KPI insight widgets, ticket feed panels, modal dialogue boxes, and notification flyouts.
- **Outer Shell (`rounded-xl` / `1.5rem`):** Applied to large dashboard overview cards, master analytics containers, and high-level workflow wrappers.
- **Circular (`full`):** Reserved exclusively for employee avatars, circular SLA ring meters, and triage status indicator dots.

## Components

### Buttons
- **Primary:** High-visibility Solid Blue (`#2563EB`) with crisp white label text, `0.5rem` border radius, and `space-sm` vertical by `space-md` horizontal padding. Focused with a 2px offset ring (`#06B6D4`).
- **Secondary / Outlined:** `#FFFFFF` background, `1px solid #CBD5E1`, `#0F172A` text. Hover shifts background to `#F8FAFC`.
- **Destructive / Incident Action:** `#EF4444` background or `#FEE2E2` soft surface with `#B91C1C` text for emergency escalation.

### Status Chips & Priority Badges
- **Structure:** Pill or soft-radius (`rounded-md`), `label-sm` typography, inline flex alignment with a 6px status beacon.
- **Completed / Grade A:** Background `#ECFDF5`, text `#065F46`, beacon `#10B981`.
- **In-Progress / Warning:** Background `#FFFBEB`, text `#92400E`, beacon `#F59E0B`.
- **Critical / SLA Breach:** Background `#FEF2F2`, text `#991B1B`, beacon `#EF4444`.
- **Pending Review:** Background `#F5F3FF`, text `#5B21B6`, beacon `#8B5CF6`.

### Cards & KPI Data Tiles
- Built with a `#FFFFFF` surface, `1px solid #E2E8F0`, and `rounded-xl` geometry.
- KPI cards highlight primary metric values using `headline-lg` in `#0F172A`, paired with micro-comparison trend tags (positive green, negative red) and standard sub-labels in `body-sm`.

### Input Fields & Controls
- Standard height: 40px for comfortable clicking and touch accuracy on mobile medical carts.
- `#FFFFFF` background with `1px solid #CBD5E1` border.
- Active/Focus state uses `#2563EB` border with an ambient `#2563EB1A` focus ring.
- Checkboxes and radio buttons use `#2563EB` active fill with crisp white vector checkmarks.

### Ticket Lists & Data Tables
- Header cells: `#F8FAFC` background, `11px` uppercase slate text with `letter-spacing: 0.05em`.
- Alternating row interaction: Clean white background with smooth hover highlight to `#F8FAFC`.
- Cell borders: Subtle bottom boundary (`1px solid #F1F5F9`).

### SLA Progress Clocks
- Dual-color micro progress bars with height 6px, tracking elapsed vs. remaining resolution time. Automatically transitions from `#10B981` to `#F59E0B` at 75% elapsed, and `#EF4444` upon SLA violation.