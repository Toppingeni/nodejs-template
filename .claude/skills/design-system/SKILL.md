---
name: "design-system"
description: "OPPN project design identity and style guide. Use BEFORE building any UI to ensure consistent visual language — colors, glassmorphism, typography, spacing, icons, component patterns. Acts as the project's 'design memory' so AI never produces generic output."
---

# OPPN Design System

The single source of truth for OPPN's visual identity. Reference this skill **before** writing any UI code to ensure every page, component, and form looks like it belongs to the same product.

## When to Use

- **Always** before building new pages or components
- When `frontend-design-spec` agent needs project style context
- When reviewing UI for design consistency
- When creating new shared components

## Design Philosophy

> **Glassmorphism + Gradient Accents** — Clean, modern, semi-transparent surfaces with blue-to-indigo gradient highlights. The UI should feel light, airy, and professional — not flat, not heavy.

---

## 1. Color System

### CSS Variables (Light Mode)

| Token                | HSL Value           | Usage                                        |
| -------------------- | ------------------- | -------------------------------------------- |
| `--primary`          | `221.2 83.2% 53.3%` | Primary blue (buttons, links, active states) |
| `--background`       | `0 0% 100%`         | Page background                              |
| `--foreground`       | `222.2 84% 4.9%`    | Main text                                    |
| `--muted-foreground` | `215.4 16.3% 46.9%` | Secondary text, descriptions                 |
| `--border`           | `214.3 31.8% 91.4%` | Borders                                      |
| `--destructive`      | `0 84.2% 60.2%`     | Error/delete actions                         |
| `--radius`           | `0.75rem`           | Base border radius                           |

### Tailwind Palette (Most Used)

| Purpose              | Classes                                              |
| -------------------- | ---------------------------------------------------- |
| **Primary gradient** | `bg-gradient-to-r from-blue-600 to-indigo-600`       |
| **Primary shadow**   | `shadow-lg shadow-blue-500/30`                       |
| **Surface**          | `bg-white/70 backdrop-blur-xl`                       |
| **Surface border**   | `border border-slate-200/60`                         |
| **Text primary**     | `text-slate-800`                                     |
| **Text secondary**   | `text-slate-600` or `text-muted-foreground`          |
| **Text subtle**      | `text-slate-400` or `text-slate-500`                 |
| **Hover surface**    | `hover:bg-slate-100`                                 |
| **Focus ring**       | `focus:ring-2 focus:ring-blue-500/40`                |
| **Danger text**      | `text-red-600`                                       |
| **Danger hover**     | `focus:bg-red-50 focus:text-red-700`                 |
| **Success badge**    | `bg-emerald-50 text-emerald-700 ring-emerald-600/20` |
| **Error badge**      | `bg-red-50 text-red-700 ring-red-600/20`             |

### Chart Colors

| Chart | HSL           | Use case         |
| ----- | ------------- | ---------------- |
| 1     | `12 76% 61%`  | Primary series   |
| 2     | `173 58% 39%` | Secondary series |
| 3     | `197 37% 24%` | Tertiary series  |
| 4     | `43 74% 66%`  | Fourth series    |
| 5     | `27 87% 67%`  | Fifth series     |

---

## 2. Typography

### Font Stack

```css
font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    sans-serif;
```

### Scale

| Element             | Classes                                  |
| ------------------- | ---------------------------------------- |
| Page title          | `text-2xl font-bold`                     |
| Section heading     | `text-lg font-semibold`                  |
| App title (header)  | `text-base font-semibold text-slate-800` |
| Body text           | `text-sm`                                |
| Description/caption | `text-sm text-muted-foreground`          |
| Small label         | `text-xs text-slate-500`                 |
| Tiny attribution    | `text-[10px] text-slate-400`             |
| Menu item           | `text-sm font-medium`                    |

---

## 3. Surfaces & Containers

### Glassmorphism Card (Primary Pattern)

```
bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-lg shadow-blue-500/30 p-4 md:p-6
```

### Table Container

```
bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-sm
```

### Header Bar

```
sticky top-0 z-30 h-16 border-b border-slate-200/60 bg-white/70 backdrop-blur-lg px-4 md:px-6
```

### Sidebar

```
border-r border-slate-200/60 bg-white/70 backdrop-blur-xl transition-all duration-300
```

### Page Container

```
p-6 space-y-6
```

---

## 4. Interactive Elements

### Primary Button (Gradient)

```
bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all
```

### Outline Button

```
variant="outline"  (shadcn/ui default)
```

### Action Buttons (Footer)

```html
<div className="flex justify-end gap-3 pt-4">
    <button variant="outline">ยกเลิก</button>
    <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">บันทึก</button>
</div>
```

### Icon Button (Toolbar)

```
h-9 w-9 rounded-lg text-slate-600 hover:bg-slate-100 focus:ring-2 focus:ring-blue-500/40
```

### Nav Link (Active)

```
bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 rounded-xl
```

### Nav Link (Inactive)

```
text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl
```

### User Menu Trigger

```
rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50
```

### Collapse Toggle (Small Circle)

```
h-6 w-6 rounded-full border border-slate-200 bg-white shadow-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800
```

---

## 5. Spacing & Layout

| Pattern          | Classes                              |
| ---------------- | ------------------------------------ |
| Page padding     | `p-6`                                |
| Card padding     | `p-4 md:p-6`                         |
| Section gap      | `space-y-6`                          |
| Element gap      | `gap-3`                              |
| Nav item gap     | `gap-1` (between items)              |
| Icon + text gap  | `gap-2` or `gap-2.5` or `gap-3`      |
| Button icon size | `h-5 w-5`                            |
| Small icon size  | `h-3.5 w-3.5`                        |
| Avatar size      | `h-7 w-7` (small) `h-8 w-8` (medium) |

### Sidebar Widths

| State     | Width  |
| --------- | ------ |
| Expanded  | `w-64` |
| Collapsed | `w-16` |

---

## 6. Border Radius

| Use case        | Class          |
| --------------- | -------------- |
| Cards, tables   | `rounded-2xl`  |
| Buttons, inputs | `rounded-xl`   |
| Small buttons   | `rounded-lg`   |
| Avatars         | `rounded-full` |
| Base (CSS var)  | `0.75rem`      |

---

## 7. Shadows

| Use case            | Classes                        |
| ------------------- | ------------------------------ |
| Card (prominent)    | `shadow-lg shadow-blue-500/30` |
| Table (subtle)      | `shadow-sm`                    |
| Active nav / button | `shadow-lg shadow-blue-500/30` |
| Small elements      | `shadow-sm`                    |
| Logo box            | `shadow-sm shadow-blue-500/30` |

---

## 8. Transitions & Animation

| Pattern        | Classes                       |
| -------------- | ----------------------------- |
| General hover  | `transition-all`              |
| Specific hover | `transition`                  |
| Sidebar expand | `transition-all duration-300` |
| Nav link hover | `transition-all duration-150` |
| Accordion      | `0.2s ease-out` (keyframe)    |

---

## 9. Icon System

### Icons8 3D Fluency (Primary)

- Style: `3d-fluency` via CDN (`https://img.icons8.com/3d-fluency/94/{slug}.png`)
- Usage: Navigation icons, feature icons, dashboard icons
- Component: `client/components/shared/icons/Icons8.tsx`
- Pattern: `<Icons8Home className="h-5 w-5 shrink-0" />`

### Lucide React (Secondary)

- Usage: UI chrome (chevrons, menu, small utility icons)
- Pattern: `<ChevronRight className="h-3.5 w-3.5" />`

### Rule: Icons8 for features, Lucide for chrome/utility

---

## 10. Accessibility Patterns

| Pattern                 | Implementation                                             |
| ----------------------- | ---------------------------------------------------------- |
| Focus visible           | `focus:outline-none focus:ring-2 focus:ring-blue-500/40`   |
| ARIA labels (collapsed) | `aria-label={isSidebarCollapsed ? item.label : undefined}` |
| Icon decorative         | `aria-hidden="true"` on icons next to text                 |
| Landmark regions        | `role="navigation"`, `aria-label` on `<aside>`, `<nav>`    |
| Thai language labels    | Use Thai for all user-facing labels and aria-labels        |

---

## 11. Logo & Branding

### App Logo (Header)

```
h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm shadow-blue-500/30
```

With white bold initial letter inside: `text-xs font-bold text-white`

### User Avatar

```
h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500
```

---

## 12. Status Badge Config

Defined in `client/constants/status.ts`:

| Status | Label  | Style                                                |
| ------ | ------ | ---------------------------------------------------- |
| `A`    | ใช้งาน | `bg-emerald-50 text-emerald-700 ring-emerald-600/20` |
| `D`    | ลบแล้ว | `bg-red-50 text-red-700 ring-red-600/20`             |

Use `getStatusConfig()` for custom statuses.

---

## Quick Copy-Paste Cheatsheet

```tsx
// Card
<div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-lg shadow-blue-500/30 p-4 md:p-6">

// Primary Button
<Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all">

// Page Header
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-bold">Title</h1>
    <p className="text-sm text-muted-foreground">Description</p>
  </div>
</div>

// Filter Bar
<div className="flex items-center gap-3">

// Table Container
<div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-sm">

// Focus Ring (all interactive elements)
focus:outline-none focus:ring-2 focus:ring-blue-500/40
```

## Related Skills

- `frontend-development` — Full frontend workflow (uses this skill for style context)
- `frontend-design-spec` agent — Produces design specs (should reference this skill)
