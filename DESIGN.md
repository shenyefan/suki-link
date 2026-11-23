---
version: 1.0-draft
name: SUKI Link — Geist
description: Vercel-style subtraction for an edge short-link service. A near-white sheet carrying near-black ink, 1px hairlines for all structure, Geist Sans and Geist Mono as the only faces. Color exists in exactly one place — the mesh gradient on public hero surfaces. The dashboard is a sidebar console in Vercel's dashboard language: a collapsible left sidebar, a slim top bar with breadcrumb, hairline row lists, settings cards with a footer action strip.

colors:
  light:
    canvas: '#FAFAFA'
    canvas-elevated: '#FFFFFF'
    hairline-soft: '#F2F2F2'
    hairline: '#EBEBEB'
    hairline-strong: '#D9D9D9'
    ink: '#171717'
    body: '#4D4D4D'
    mute: '#8F8F8F'
    faint: '#A1A1A1'
    primary: '#171717'
    on-primary: '#FFFFFF'
    link: '#0070F3'
    link-deep: '#0761D1'
    link-soft: '#D3E5FF'
    error: '#EE0000'
    error-deep: '#C50000'
    error-soft: '#FFE5E5'
    warning: '#F5A623'
    warning-deep: '#AB570A'
    warning-soft: '#FFEFCF'
  dark:
    canvas: '#000000'
    canvas-elevated: '#0A0A0A'
    hairline-soft: '#1A1A1A'
    hairline: '#242424'
    hairline-strong: '#333333'
    ink: '#EDEDED'
    body: '#A1A1A1'
    mute: '#8F8F8F'
    faint: '#707070'
    primary: '#EDEDED'
    on-primary: '#0A0A0A'
    link: '#52A8FF'
    link-deep: '#3291FF'
    link-soft: '#0A2A4D'
    error: '#FF6166'
    error-deep: '#E5484D'
    error-soft: '#3C1618'
    warning: '#FFB224'
    warning-deep: '#F1A10D'
    warning-soft: '#3A2A0A'
  accent:
    violet: '#7928CA'
    cyan: '#50E3C2'
    pink: '#FF0080'
    magenta: '#EB367F'
    gradient-develop-start: '#007CF0'
    gradient-develop-end: '#00DFD8'
    gradient-preview-start: '#7928CA'
    gradient-preview-end: '#FF0080'
    gradient-ship-start: '#FF4D4D'
    gradient-ship-end: '#F9CB28'

typography:
  family:
    sans: "'Geist Variable', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', Arial, sans-serif"
    mono: "'Geist Mono Variable', 'SF Mono', ui-monospace, monospace"
  display-xl: { fontSize: 48px, fontWeight: 600, lineHeight: 48px, letterSpacing: -2.4px }
  heading-lg: { fontSize: 32px, fontWeight: 600, lineHeight: 40px, letterSpacing: -1.28px }
  heading-md: { fontSize: 20px, fontWeight: 600, lineHeight: 28px, letterSpacing: -0.4px }
  heading-sm: { fontSize: 16px, fontWeight: 600, lineHeight: 24px, letterSpacing: -0.32px }
  label-sm: { fontSize: 14px, fontWeight: 500, lineHeight: 20px, letterSpacing: -0.28px }
  mono-eyebrow: { fontSize: 12px, fontWeight: 500, lineHeight: 16px, letterSpacing: 0, textTransform: uppercase, family: mono }
  body-lg: { fontSize: 16px, fontWeight: 400, lineHeight: 24px }
  body-md: { fontSize: 14px, fontWeight: 400, lineHeight: 20px }
  body-sm: { fontSize: 12px, fontWeight: 400, lineHeight: 16px }
  button-lg: { fontSize: 16px, fontWeight: 500, lineHeight: 20px }
  button-md: { fontSize: 14px, fontWeight: 500, lineHeight: 20px }
  code: { fontSize: 14px, fontWeight: 400, lineHeight: 20px, family: mono }
  metric: { fontSize: 32px, fontWeight: 600, lineHeight: 40px, letterSpacing: -1.28px, fontVariantNumeric: tabular-nums }

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 40px
  3xl: 64px
  4xl: 96px
  section: 128px

rounded:
  none: 0px
  xs: 4px
  sm: 6px
  md: 12px
  lg: 16px
  pill: 100px
  full: 9999px

shadow:
  whisper: '0px 1px 1px rgba(0,0,0,0.04)'
  floating: '0px 2px 2px rgba(0,0,0,0.04), 0px 8px 16px -4px rgba(0,0,0,0.08), 0 0 0 1px var(--hairline)'
  modal: '0px 1px 1px rgba(0,0,0,0.02), 0px 8px 16px -4px rgba(0,0,0,0.04), 0px 24px 32px -8px rgba(0,0,0,0.06), 0 0 0 1px var(--hairline)'

motion:
  fast: 150ms
  base: 200ms
  ease: 'cubic-bezier(0.175, 0.885, 0.32, 1.1)'
  ease-out: 'cubic-bezier(0.16, 1, 0.3, 1)'
  crossfade-distance: 8px
  step-distance: 8px
---

## Overview

SUKI Link is an exercise in subtraction. The page is a near-white sheet (`{colors.canvas}`) carrying near-black ink (`{colors.ink}`), and almost nothing else competes. Headings, body copy, primary buttons and the 1px hairlines that define every card, row and input draw from one ink-and-grey ladder. Color is allowed in exactly one place: the soft multi-stop **mesh gradient** that blooms behind the headline on public hero surfaces (home, login, visitor pages).

The product has two surfaces, and the button shape tells you which one you are on:

| Surface     | Routes                                                           | Character                                                                                 | Primary control                   |
| ----------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------- |
| **Public**  | `/`, `/login`, `/password`, `/confirm`, `/expired`, `/not-found` | Centered hero on the mesh gradient, large tightly-tracked Geist headline                  | Black **pill** (`{rounded.pill}`) |
| **Console** | `/dashboard/*`                                                   | Sidebar console: collapsible left sidebar, slim top bar, hairline lists and setting cards | Tight 6px square (`{rounded.sm}`) |

The console reads like documentation that happens to manage links — engineered, exact, monospaced where the data is technical (slugs, URLs, counts), and confident enough to have no decoration at all.

**Key characteristics**

- One ink (`{colors.ink}`) for headings, primary fills and the darkest text; a deliberate grey ladder `ink → body → mute → faint`.
- 1px hairlines (`{colors.hairline}`) are the structural workhorse; shadows only for floating layers.
- Mesh gradient only on public heroes; the console has zero chromatic decoration.
- Geist Sans for UI and prose; Geist Mono for slugs, URLs, metrics, code and uppercase eyebrows. No third face.
- Pills on public surfaces, 6px squares in the console — never mixed within one surface.
- Light and dark are both first-class; dark follows Vercel's console: pure black canvas, `#0A0A0A` cards, `#242424` hairlines.

## Colors

### Brand & accent

- **Ink** (`{colors.ink}` / `{colors.primary}`): headings, primary button fill, wordmark, darkest text. Never pure `#000` text in light mode.
- **Link blue** (`{colors.link}`): inline links, focus rings, the active / positive signal (success, "active" status dot, selected chart series). Pressed tone `{colors.link-deep}`, pale wash `{colors.link-soft}` for selected rows and info notices.
- **Accent family** (`{colors.violet}`, `{colors.cyan}`, `{colors.pink}`, `{colors.magenta}`) and the three named gradients (develop, preview, ship): only as mesh-gradient stops and, in the analytics page, as additional chart series. Never as chrome fills, borders or text.

### Surface

- **Canvas** (`{colors.canvas}`): page background on both surfaces.
- **Elevated** (`{colors.canvas-elevated}`): cards, list containers, inputs, buttons, menus, modals.
- **Hairline-soft** (`{colors.hairline-soft}`): inset wells, the settings-card footer strip, skeleton fill, hovered rows.

### Text

| Token   | Light on canvas | Dark on canvas | Use                                                                       |
| ------- | --------------- | -------------- | ------------------------------------------------------------------------- |
| `ink`   | 17.2:1          | 17.9:1         | Headings, values, slugs, primary labels                                   |
| `body`  | 8.1:1           | 8.1:1          | Paragraph text, nav links, table cells, target URLs                       |
| `mute`  | 3.1:1           | 6.5:1          | Supplementary metadata only (timestamps next to a full tooltip), eyebrows |
| `faint` | 2.5:1           | 4.2:1          | Placeholders and disabled labels only                                     |

Contrast contract: anything a user must read to complete a task uses `ink` or `body`. `mute` in light mode is below AA and is only allowed for text that is supplementary (its information is available elsewhere, e.g. a relative time whose absolute time is in a tooltip) or for `{typography.mono-eyebrow}` labels that sit next to a heading.

### Borders

- **Hairline** (`{colors.hairline}`): every card, list container, row divider, input, the sidebar's right edge and the top bar's bottom border.
- **Hairline-strong** (`{colors.hairline-strong}`): input and ghost-button border on hover; dividers inside floating menus.

### Semantic

| State   | Fill / text                                                      | Soft wash               | Use                                              |
| ------- | ---------------------------------------------------------------- | ----------------------- | ------------------------------------------------ |
| Error   | `{colors.error}`                                                 | `{colors.error-soft}`   | Validation, destructive buttons, KV sync failure |
| Warning | `{colors.warning}` (dot / icon) · `{colors.warning-deep}` (text) | `{colors.warning-soft}` | Expired links, unsaved / unconfigured states     |
| Success | `{colors.link}`                                                  | `{colors.link-soft}`    | Active status dot, success toast                 |

### Mesh gradient

A CSS composition of 4–5 blurred radial gradients using `gradient-develop-*`, `gradient-preview-*` and `gradient-ship-*` stops, placed behind the hero headline (upper half of the viewport), max opacity 0.55 in light and 0.35 in dark, `filter: blur(64px)`, `pointer-events: none`, `aria-hidden`. It drifts very slowly (a 20s alternating transform of ≤ 24px) and is static under reduced motion. It never appears inside `/dashboard`.

## Typography

### Families and loading

- **Geist Sans** and **Geist Mono**, self-hosted through `@fontsource-variable/geist` and `@fontsource-variable/geist-mono`. No Google Fonts or CDN.
- CJK text falls back to PingFang SC / Hiragino Sans GB / Microsoft YaHei / Noto Sans SC.
- Weights are binary: 600 for headings and metrics, 500 for buttons, labels and eyebrows, 400 for everything else. No light, black or italic.

### Hierarchy

| Token                       | Size | Weight | Line height | Tracking | Use                                                        |
| --------------------------- | ---- | ------ | ----------- | -------- | ---------------------------------------------------------- |
| `{typography.display-xl}`   | 48px | 600    | 48px        | -2.4px   | Public hero headline (home wordmark, visitor page title)   |
| `{typography.heading-lg}`   | 32px | 600    | 40px        | -1.28px  | Console page title                                         |
| `{typography.metric}`       | 32px | 600    | 40px        | -1.28px  | Analytics stat values (tabular numerals)                   |
| `{typography.heading-md}`   | 20px | 600    | 28px        | -0.4px   | Settings card title, modal title                           |
| `{typography.heading-sm}`   | 16px | 600    | 24px        | -0.32px  | Panel / chart titles                                       |
| `{typography.label-sm}`     | 14px | 500    | 20px        | -0.28px  | Field labels, active tab, row primary text                 |
| `{typography.mono-eyebrow}` | 12px | 500    | 16px        | 0        | Uppercase Geist Mono eyebrows above titles and stat values |
| `{typography.body-lg}`      | 16px | 400    | 24px        | 0        | Public page body                                           |
| `{typography.body-md}`      | 14px | 400    | 20px        | 0        | Default console body, nav links, table cells               |
| `{typography.body-sm}`      | 12px | 400    | 16px        | 0        | Metadata, helper captions, chart axes                      |
| `{typography.button-lg}`    | 16px | 500    | 20px        | 0        | Public pill buttons                                        |
| `{typography.button-md}`    | 14px | 500    | 20px        | 0        | Console buttons, tabs                                      |
| `{typography.code}`         | 14px | 400    | 20px        | 0        | Slugs, short URLs, target URLs, JSON preview               |

Mobile (≤ 640px): `display-xl` drops to 36px / 40px / -1.8px; `heading-lg` to 24px / 32px / -0.96px.

### Principles

- The larger the heading, the tighter the tracking. Negative tracking is tuned for Latin; when a heading is mostly CJK, cap tracking at `-0.02em` so Han characters do not collide.
- Geist Mono has exactly three roles: technical data (slugs, URLs, counts in tables), metrics, and uppercase eyebrows.
- Numbers in tables, stat tiles and charts use `font-variant-numeric: tabular-nums`.

## Layout

### Spacing

Base unit 4px; tokens `{spacing.xxs}` 4 → `{spacing.section}` 128. Card interiors `{spacing.lg}` (24px); list rows `{spacing.sm}` × `{spacing.md}`; public hero bands `{spacing.4xl}`–`{spacing.section}` vertical.

### Containers

| Surface | Max width                              | Gutters                                                       |
| ------- | -------------------------------------- | ------------------------------------------------------------- |
| Public  | 1200px                                 | 24px; content column ≤ 480px for forms, ≤ 720px for headlines |
| Console | 1200px (main area, beside the sidebar) | 32px (24px ≤ 1023px, 16px ≤ 640px)                            |

### Page archetypes

**Public hero** (`/`, `/login`, visitor pages): full-viewport `{colors.canvas}` with the mesh gradient in the upper half; a single centered column — `{typography.mono-eyebrow}` (e.g. the slug or a status code), `{typography.display-xl}` headline, then at most one form and one pill CTA. A small footer row at the bottom with the wordmark and the theme switch.

**Console shell** (`/dashboard/*`): a left sidebar plus a main area, built on shadcn `Sidebar` (`SidebarProvider`, `collapsible="icon"`).

```
┌────────────────┬─────────────────────────────────────────────────────┐
│ ◼ SUKI Link    │ ▣  链接 / 全部                                       │  top bar 56px: trigger + breadcrumb
│ ┌────────────┐ ├─────────────────────────────────────────────────────┤  1px hairline
│ │ 搜索    ⌘K │ │  LINKS                                              │  eyebrow
│ └────────────┘ │  链接                              [搜索] [新建]    │  page header: heading-lg + actions
│                │  ┌───────────────────────────────────────────────┐  │
│ ▸ 链接         │  │ row                                           │  │  hairline list container
│   统计         │  │ row                                           │  │
│   设置         │  │ row                                           │  │
│                │  └───────────────────────────────────────────────┘  │
│                │                                                     │
│ ┌────────────┐ │                                                     │
│ │ ◯ 名称     │ │                                                     │  user block → menu
│ └────────────┘ │                                                     │
└────────────────┴─────────────────────────────────────────────────────┘
   240px, right hairline        main: max 1200px content, centered
```

- **Sidebar** (240px expanded, 56px icon rail collapsed): `{colors.canvas}` with a 1px right hairline. From top to bottom:
  - Brand row (56px, aligned with the top bar): logo mark (`public/favicon.svg`, 24px, `{rounded.sm}`) + wordmark `SUKI Link` in `{typography.label-sm}`; the deployment host below it in `{typography.body-sm}` mono `{colors.mute}`.
  - `command-trigger` as a full-width search field.
  - Nav: 链接 (`Link2`), 统计 (`ChartLine`), 设置 (`Settings`) — see Components → Sidebar nav.
  - Footer: `user-block` (avatar, name, email) opening a menu with the theme switch and 退出登录.
- **Collapse**: the top-bar trigger and `⌘B` toggle between expanded and icon rail; the state persists in the shadcn sidebar cookie. In the rail only icons remain, each with a right-side tooltip; the brand row shows the logo mark only.
- **Top bar** (56px, sticky, `{colors.canvas}`, bottom hairline): sidebar trigger `button-icon`, a vertical 1 × 16px hairline, then the breadcrumb (`{typography.body-md}`, current page `{colors.ink}`, ancestors `{colors.body}`, separators `/` in `{colors.hairline-strong}`). Gains `{shadow.whisper}` once the main area scrolls.
- **Main area**: `{colors.canvas}`, content column max 1200px centered, padding-top `{spacing.xl}`. Each page starts with a page header: `{typography.mono-eyebrow}` + `{typography.heading-lg}` on the left, the page's actions on the right (one `button-primary` at most).
- **Settings archetype**: inside the main area, a secondary section nav (200px, sticky, same item style as the sidebar nav) on the left and setting cards stacked with `{spacing.lg}` gaps on the right. Sections: 跳转、链接、统计、边缘数据 (the 统计 card shows only the current platform's credentials: TEO on EdgeOne, Zone ID + API Token on Cloudflare; hidden on Vercel / Node). ≤ 1023px the section nav becomes a horizontal `segmented` row above the cards.
- **Analytics archetype**: toolbar row (time-range `segmented` 24 小时 / 7 天 / 30 天, slug filter) right-aligned in the page header; a stat-tile row (访问总数, 环比); full-width time-series card; `geo-map` card; 2-up grid of top-list cards (来源、设备、浏览器、系统, and 链接 in the site-wide view). On EdgeOne an extra section follows with the TEO panels (流量与带宽、安全拦截、云函数、Pages 构建). Grids reflow 4 → 2 → 1. The page is identical across the three data sources; a source badge (TEO / Cloudflare / 数据库) sits next to the page title.

### Breakpoints

| Name    | Width     | Changes                                                                                                                                                                                                                                                        |
| ------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mobile  | ≤ 767px   | Sidebar becomes an off-canvas sheet from the left (shadcn mobile sidebar), opened from the top-bar trigger; top bar shows trigger + logo mark + breadcrumb current page; single column; list rows stack; pill CTAs go full width; dialogs become bottom sheets |
| Tablet  | 768–1023  | Sidebar defaults to the icon rail; 2-up grids; list rows hide the created-time column                                                                                                                                                                          |
| Laptop  | 1024–1279 | Sidebar expanded; 4-up stat grid                                                                                                                                                                                                                               |
| Desktop | ≥ 1280    | Main content centered at 1200px                                                                                                                                                                                                                                |

Acceptance widths: 390 / 820 / 1280 / 1600px × light / dark, with no horizontal overflow.

## Elevation & Depth

| Level        | Treatment                                                 | Use                                                     |
| ------------ | --------------------------------------------------------- | ------------------------------------------------------- |
| 0 — Flat     | 1px `{colors.hairline}`, no shadow                        | Cards, list containers, inputs, dividers                |
| 1 — Whisper  | Hairline + `{shadow.whisper}`                             | Top bar after scroll, hovered card                      |
| 2 — Floating | `{shadow.floating}`                                       | Dropdown menus, popovers, tooltips, command menu, toast |
| 3 — Modal    | `{shadow.modal}` + overlay `rgba(0,0,0,0.4)` (dark `0.7`) | Dialogs, sheets, the mobile sidebar                     |

In dark mode shadows are nearly invisible; floating layers rely on the hairline ring and `{colors.canvas-elevated}` against the black canvas. No glows, no glass, no backdrop blur except the dialog overlay.

## Motion

Quiet and fast. Nothing bounces, nothing follows the pointer.

- Color, border and background changes: `{motion.fast}` linear.
- Menus, popovers, tooltips: fade + scale 0.96 → 1, `{motion.fast}` `{motion.ease-out}`.
- Dialogs: fade + scale 0.98 → 1, `{motion.base}`; bottom sheets on mobile slide from 16px.
- Sidebar collapse / expand: width transition `{motion.base}` `{motion.ease-out}`; labels fade out within `{motion.fast}` before the width shrinks. Mobile sidebar sheet slides in from the left, `{motion.base}`.
- Sidebar active-item background and the settings section-nav highlight slide between items (`motion` `layoutId`, `{motion.base}` `{motion.ease-out}`).
- Region content swaps (`Crossfade`): opacity + `{motion.crossfade-distance}` vertical offset. Multi-step flows (`StepSwap`): `{motion.step-distance}` horizontal.
- Console page navigation: route View Transition as a 150ms crossfade only, no slide.
- Buttons: `active:scale-[0.98]`.
- Mesh gradient drift: see Colors → Mesh gradient.
- Reduced motion: everything becomes an instant opacity change; the gradient is static.

## Shapes

| Token            | Value  | Use                                                         |
| ---------------- | ------ | ----------------------------------------------------------- |
| `{rounded.none}` | 0      | Sidebar, top bar, full-bleed bands, row dividers            |
| `{rounded.xs}`   | 4px    | Badges, keyboard hints (`⌘K`), checkbox                     |
| `{rounded.sm}`   | 6px    | Console buttons, inputs, selects, menu items, sidebar items |
| `{rounded.md}`   | 12px   | Cards, list containers, dialogs, code blocks, QR panel      |
| `{rounded.lg}`   | 16px   | Public form panel                                           |
| `{rounded.pill}` | 100px  | Public CTA buttons                                          |
| `{rounded.full}` | 9999px | Avatars, status dots, circular icon buttons                 |

## Iconography

Lucide only, 16px in the console (stroke 1.5), 20px on public pages. Icons are `{colors.body}` by default and `{colors.ink}` when active. Link attribute icons: password `Lock`, confirm `ShieldAlert`, cloaking `EyeOff`, forward query `ArrowRightLeft`, expiry `Clock`.

## Components

shadcn components (style `radix-luma`) restyled in place to these specs.

### Sidebar

**`sidebar`** — shadcn `Sidebar` restyled: `{colors.canvas}`, right hairline, padding `{spacing.sm}`, structure and collapse behavior described in Layout.

**`sidebar-nav-item`** — height 32px, `{rounded.sm}`, padding `0 {spacing.xs}`, 16px Lucide icon + `{typography.body-md}` label with 8px gap. Default `{colors.body}`; hover background `{colors.hairline-soft}`; active background `{colors.hairline-soft}`, text and icon `{colors.ink}`, weight 500 (`aria-current="page"`). Collapsed: 32 × 32px icon button centered in the rail, tooltip on the right.

**`user-block`** — 48px row: 28px avatar (`{rounded.full}`, hairline ring), name `{typography.label-sm}` `{colors.ink}` and email `{typography.body-sm}` `{colors.mute}` (single-line ellipsis), `ChevronsUpDown` icon. Opens a `dropdown-menu` above it: theme `segmented`, 退出登录. Collapsed: avatar only.

**`command-trigger`** — full-width 32px field-like button: `{colors.canvas-elevated}`, hairline, `{rounded.sm}`, search icon, 搜索 in `{colors.faint}`, and a `⌘K` keyboard hint on the right (`{rounded.xs}`, `{typography.body-sm}` mono, hairline border). Collapsed: search `button-icon`. Opens the command menu: jump to a link by slug, create link, go to page, toggle theme.

### Top bar

**`top-bar`** — described in Layout. **`breadcrumb-separator`** — `/` in `{colors.hairline-strong}`, 8px horizontal margin.

### Toggles

**`segmented`** — in-page toggles (sort order, time range presets, chart metric). Container `{colors.hairline-soft}` `{rounded.sm}` with 2px inset; active segment `{colors.canvas-elevated}` + `{shadow.whisper}`.

### Buttons

| Variant             | Surface | Fill                       | Text                  | Border   | Radius           | Height / padding |
| ------------------- | ------- | -------------------------- | --------------------- | -------- | ---------------- | ---------------- |
| `button-pill`       | Public  | `{colors.primary}`         | `{colors.on-primary}` | —        | `{rounded.pill}` | 48px / `0 20px`  |
| `button-pill-ghost` | Public  | `{colors.canvas-elevated}` | `{colors.ink}`        | hairline | `{rounded.pill}` | 48px / `0 20px`  |
| `button-primary`    | Console | `{colors.primary}`         | `{colors.on-primary}` | —        | `{rounded.sm}`   | 36px / `0 12px`  |
| `button-secondary`  | Console | `{colors.canvas-elevated}` | `{colors.ink}`        | hairline | `{rounded.sm}`   | 36px / `0 12px`  |
| `button-tertiary`   | Console | transparent                | `{colors.body}`       | —        | `{rounded.sm}`   | 36px / `0 8px`   |
| `button-error`      | Console | `{colors.error}`           | `#FFFFFF`             | —        | `{rounded.sm}`   | 36px / `0 12px`  |
| `button-icon`       | Console | transparent                | `{colors.body}`       | —        | `{rounded.sm}`   | 32 × 32px        |

Small console size: 32px height, `0 10px`. Hover darkens fills (primary → `{colors.body}` light / `#CCCCCC` dark) or adds `{colors.hairline-soft}` behind ghost variants. Loading replaces the leading icon with a spinner and keeps the width. Each screen has one primary button.

### Inputs & forms

**`text-input`** — `{colors.canvas-elevated}`, 1px hairline, `{rounded.sm}`, height 40px (console 36px), padding `0 {spacing.sm}`, `{typography.body-md}`. Hover border `{colors.hairline-strong}`; focus: border `{colors.ink}` + 3px ring `color-mix({colors.link} 30%, transparent)`. Invalid: border `{colors.error}`, message below in `{typography.body-sm}` `{colors.error}` with an icon.

**`prefix-input`** — slug field: a non-editable prefix segment (`s.example.com/` in `{typography.code}` `{colors.mute}` on `{colors.hairline-soft}`) joined to the input, plus a trailing `button-icon` to regenerate a random slug.

**Labels** sit above fields (`{typography.label-sm}` `{colors.ink}`), 8px gap. No floating labels.

**`switch`** — 32 × 18px, off `{colors.hairline-strong}`, on `{colors.ink}`; label to the left in setting rows.

**`date-time-picker`** — popover calendar; quick presets (1 天 / 7 天 / 30 天) as a `segmented` above the calendar.

### Cards & containers

**`card`** — `{colors.canvas-elevated}`, hairline, `{rounded.md}`, padding `{spacing.lg}`.

**`setting-card`** — the Vercel settings pattern: body (`{spacing.lg}`) with `{typography.heading-md}` title, fields below; a footer strip (`{colors.hairline-soft}`, top hairline, padding `{spacing.sm} {spacing.lg}`) holding status text on the left (`{typography.body-sm}`) and the card's single save button on the right. Destructive cards (rebuild edge data) use an `{colors.error}` border and an `button-error` in the footer.

**`list`** — one card containing rows separated by hairlines, no gaps between rows. A `list-toolbar` above it: search input (flex 1), sort `segmented`, filter dropdown.

**`link-row`** (the links list item), 64px:

| Column     | Content                                                                                                                                |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Primary    | `/slug` in `{typography.code}` `{colors.ink}`; below it the target URL in `{typography.body-sm}` `{colors.body}`, single-line ellipsis |
| Attributes | Lucide attribute icons (Iconography) in `{colors.mute}`, each with a tooltip                                                           |
| Status     | `status-dot` + label: 有效 (`{colors.link}`), 已过期 (`{colors.warning}`)                                                              |
| Time       | relative created time in `{colors.mute}`, absolute time in tooltip                                                                     |
| Actions    | copy short link `button-icon`, `…` menu (编辑、二维码、复制、删除)                                                                     |

Hover: row background `{colors.hairline-soft}`; the whole row opens the edit dialog. Mobile: Primary on top, Status + Time + Actions on a second line; Attributes hide.

**`stat-tile`** — `card` with a `{typography.mono-eyebrow}` label, a `{typography.metric}` value, and a `{typography.body-sm}` delta vs the previous period (`{colors.link}` up / `{colors.error}` down, with arrow icon).

**`chart-card`** — `card` with `{typography.heading-sm}` title and `segmented` metric switch in the header; chart area 280px (200px mobile). Single series: `{colors.ink}` 1.5px line with a 10% ink area fill. Multi-series uses, in order: ink, link, violet, cyan, pink, amber (`gradient-ship-end`). Gridlines `{colors.hairline}` horizontal only; axes `{typography.body-sm}` `{colors.mute}`; tooltip is a Level-2 floating panel with tabular numbers. Charts follow the `dataviz` skill when implemented.

**`top-list`** — rows of label + value with a horizontal bar behind the row (`{colors.hairline-soft}` fill proportional to the max), value right-aligned in mono.

**`geo-map`** — monochrome choropleth: land `{colors.hairline-soft}`, borders `{colors.canvas}`, data scale from `color-mix(ink 10%)` to `ink`; wheel zoom must not scroll the page.

**`qr-panel`** — white square (also white in dark mode, required for scanning) inside a `card`, `{rounded.md}`, 16px quiet zone, the short URL below in `{typography.code}`, actions: 下载 PNG, 复制链接.

**`code-block`** — JSON import preview: `{colors.canvas-elevated}`, hairline, `{rounded.md}`, `{typography.code}`, padding `{spacing.md}`, max height 320px with internal scroll.

### Dialogs & menus

**`dialog`** — `{colors.canvas-elevated}`, `{rounded.md}`, `{shadow.modal}`, width 540px (link editor 640px), max height 80vh with internal scroll. Header: `{typography.heading-md}` title, padding `{spacing.lg}`. Footer: same strip as `setting-card` (cancel `button-secondary` left of the primary). Mobile becomes a bottom sheet. Destructive confirmations use `AlertDialog` with `button-error`.

**`dropdown-menu`** — Level 2, `{rounded.md}`, padding 4px, items 36px `{rounded.sm}` `{typography.body-md}`, hover `{colors.hairline-soft}`; destructive items `{colors.error}`.

**`command-menu`** — Level 2, 640px wide, input 48px with bottom hairline, grouped results with `{typography.mono-eyebrow}` group labels.

**`tooltip`** — `{colors.ink}` fill, `{colors.on-primary}` text, `{typography.body-sm}`, `{rounded.sm}`, padding `4px 8px`.

### Status & feedback

**`status-dot`** — 8px `{rounded.full}` dot before a `{typography.body-sm}` label.

**`badge`** — `{rounded.xs}`, height 20px, padding `0 6px`, `{typography.body-sm}` 500; variants gray (`hairline-soft` / `body`), blue (`link-soft` / `link-deep`), amber (`warning-soft` / `warning-deep`), red (`error-soft` / `error`).

**`toast`** (sonner) — bottom-right, Level 2, `{rounded.md}`, `{typography.body-md}`; one toast per error.

**`notice`** — inline banner inside a card: soft semantic wash, 1px border in the semantic color at 30%, `{rounded.sm}`, icon + one line. Used for "未同步到边缘" and "统计未配置".

**`empty-state`** — a `card` with dashed hairline border, centered 40px icon in a `{rounded.full}` hairline circle, `{typography.heading-sm}` title, one `button-primary`. No explanatory paragraph.

**`skeleton`** — `{colors.hairline-soft}` blocks matching the final layout, a slow 1.5s opacity pulse (static under reduced motion).

### Public components

**`hero`** — mesh gradient + centered column as described in Layout. Visitor pages:

| Route        | Eyebrow (mono) | Headline   | Body                                    | Action                          |
| ------------ | -------------- | ---------- | --------------------------------------- | ------------------------------- |
| `/password`  | `/slug`        | 需要密码   | password field                          | `button-pill` 访问              |
| `/confirm`   | `/slug`        | 即将跳转   | target URL in a `code-block`            | `button-pill` 继续访问          |
| `/expired`   | `410`          | 链接已过期 | —                                       | `button-pill-ghost` 返回首页    |
| `/not-found` | `404`          | 链接不存在 | —                                       | `button-pill-ghost` 返回首页    |
| `/login`     | `SUKI LINK`    | 登录       | callback error as `notice` when present | `button-pill` 使用 SUKI ID 登录 |
| `/`          | —              | SUKI Link  | —                                       | `button-pill-ghost` 后台        |

**`theme-switch`** — three-state segmented (跟随系统 / 浅色 / 深色) with Lucide `Monitor`, `Sun`, `Moon`; in the console it lives in the `user-block` menu, on public pages in the footer row.

## Copy rules

- UI language is Simplified Chinese; technical tokens (slug, URL, KV, TEO, HTTP status) stay as-is.
- No descriptive paragraphs, explanatory subtitles or guiding small print on any page; eyebrows are labels (a slug, a status code, a section name), never sentences.
- No sentences built on a “不是……” contrast.
- Keep precise names, field labels, states and error messages.
- Buttons are verbs: 新建、保存、删除、复制、导入、导出、重建.

## Accessibility

- Focus ring on every interactive element: 2px `{colors.link}` outline with 2px offset (`:focus-visible` only).
- Hit targets ≥ 32px in the console, ≥ 44px on public pages and mobile.
- Icon-only buttons have `aria-label`; attribute icons have tooltips and visually hidden text.
- The sidebar is a `<nav aria-label>` landmark; its toggle exposes `aria-expanded`; `⌘B` and `⌘K` shortcuts are listed in the command menu.
- Menus, dialogs, sheets and the command menu use the Radix primitives' keyboard behavior unchanged.
- Status is never conveyed by color alone (dot + label, icon + text).
- `prefers-reduced-motion` handled once at the root (`<MotionConfig reducedMotion="user">`).

## Implementation mapping

`styles.css` defines DESIGN tokens as CSS variables under `:root` and `[data-theme='dark']`, then maps shadcn semantic variables:

| shadcn variable                                 | DESIGN token                                  |
| ----------------------------------------------- | --------------------------------------------- |
| `--background`                                  | `canvas`                                      |
| `--foreground`                                  | `ink`                                         |
| `--card`, `--popover`                           | `canvas-elevated`                             |
| `--card-foreground`                             | `ink`                                         |
| `--primary`                                     | `primary`                                     |
| `--primary-foreground`                          | `on-primary`                                  |
| `--secondary`, `--accent`, `--muted`            | `hairline-soft`                               |
| `--secondary-foreground`, `--accent-foreground` | `ink`                                         |
| `--muted-foreground`                            | `body` (`mute` only via explicit `text-mute`) |
| `--border`, `--input`                           | `hairline`                                    |
| `--ring`                                        | `link`                                        |
| `--destructive`                                 | `error`                                       |
| `--radius`                                      | `rounded.sm` (6px)                            |
| `--sidebar`                                     | `canvas`                                      |
| `--sidebar-foreground`                          | `body`                                        |
| `--sidebar-accent`                              | `hairline-soft`                               |
| `--sidebar-accent-foreground`                   | `ink`                                         |
| `--sidebar-border`                              | `hairline`                                    |
| `--sidebar-ring`                                | `link`                                        |

- Type tokens are `@utility type-*` classes (`type-display-xl`, `type-heading-lg`, `type-metric`, `type-eyebrow`, `type-body-md`, `type-code`, …); do not override Tailwind `--text-*` keys.
- Extra color utilities: `text-mute`, `text-faint`, `bg-hairline-soft`, `border-hairline-strong`, `text-link`.
- Shadows as `shadow-whisper`, `shadow-floating`, `shadow-modal`.
- The mesh gradient is one component (`features/visitor/mesh-gradient.tsx`) used by all public hero routes.
