---
version: alpha
name: Formino
colors:
  canvas: "#f2f5f0"
  surface: "#ffffff"
  ink: "#182d26"
  muted: "#53695e"
  forest: "#163c31"
  primary: "#236247"
  on-dark-muted: "#e0ece4"
  selected: "#e5f1e9"
  highlight: "#e2f4ac"
typography:
  body:
    fontFamily: "Vazirmatn, Segoe UI, Tahoma, sans-serif"
    fontSize: "16px"
    lineHeight: 1.8
rounded:
  card: "16px"
  hero: "20px"
spacing:
  compact: "8px"
  item: "12px"
  inset: "16px"
  section: "24px"
components:
  app:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
  secondary-text:
    textColor: "{colors.muted}"
  active-navigation:
    backgroundColor: "{colors.selected}"
  session-panel:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.on-dark-muted}"
    rounded: "{rounded.hero}"
  session-action:
    backgroundColor: "{colors.highlight}"
    textColor: "{colors.forest}"
  primary-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
---

## Overview

Formino is a Persian, RTL training log for home workouts. It serves a quick glance before a set as well as longer planning and progress reviews. The visual reference is a printed training log with bold session labels, compact rows, and clear stage changes. The current program and storage behavior come from README_FA.md and server.js.

## Colors

The shared interface block in style.css owns the runtime values. Canvas, surface, ink, muted, forest, primary, selected, and highlight map to `--bg`, `--white`, `--text`, `--muted`, `--deep`, `--green`, `--lightgreen`, and `--lime`. Forest marks the next session and training surfaces. Lime identifies their main action and progress. The light secondary text on these panels maps to `--on-dark-muted`. Use text, icons, or explicit selection states alongside calendar and workout colors.

## Typography

Use the bundled Vazirmatn variable font for Persian copy and standard controls. The base is 16px with a generous line height. Use 14px for common actions and 12px for secondary metadata. Keep tabular numerals in timers and isolate English exercise names and filenames. Keep user-facing copy direct and use the existing informal singular register.

## Layout

The right sidebar is the main desktop navigation. At 760px and below it becomes a scrollable drawer, with four common destinations in the bottom bar. The calendar keeps seven equal weekday columns, with details below it. Use 8/12/16/24px spacing tiers for control groups, rows, padding and section separation. Tables scroll within their own frame when needed. Preserve space above the fixed bottom bar for focus and notifications. During an active workout, the compact two-clock bar sticks to the top of the workout content. Scroll targets account for its height.

## Elevation & Depth

Use a quiet shadow and the `--line` border (#dce5dd) for cards. Use the higher-contrast `--control-line` border (#839a8b) for controls. Dialogs use the browser top layer and a dark scrim. Dashboard decoration stays inside the session panel.

## Shapes

The default card radius is 16px. The session panel uses 20px. Buttons and inputs use tighter corners so controls remain distinct from surfaces. Round badges mark brief statuses.

## Components

- Navigation uses `data-nav` and `aria-current`. The mobile drawer uses the same sidebar and restores focus on dismissal.
- Native select and date inputs are the shared choices. Browser constraints own basic validation. App-owned messages cover workflow checks.
- The movement library uses the same guide IDs as workout stages and exercise cards. Search accepts Persian and English names, previous names, aliases, and exercise IDs. Guide titles and search terms describe the equipment and variation used by Formino.
- The shared HTML dialog handles exercise reference and confirmations. Escape and cancel dismiss it. Destructive actions name what they affect, with the existing extra confirmation for resetting today's workout.
- Set controls show the next target, the rest countdown, and the state of the SQLite write. Unconfirmed set changes remain recoverable in browser storage while the local server is unreachable. A divergent server revision is reviewed in the shared dialog before replacement.
- The calendar previews changes using the same scheduler as the saved view. Undo restores the calendar restrictions from the most recent successful calendar edit in this tab.
- Icons use the existing inline SVG symbol set with consistent outlines. Decorative icons are hidden from assistive technology.

## Do's and Don'ts

- Lead with the next usable action. Keep secondary controls near the content they affect.
- Use readable labels and maintain focus when updating an active control or expanding a details panel.
- Use the existing light palette and reduce motion when requested by the browser.
- Avoid decorative status badges, repeated labels, and color-only distinctions.

