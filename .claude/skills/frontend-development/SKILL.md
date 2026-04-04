---
name: "frontend-development"
description: "Orchestrates frontend feature development for OPPN (React 18 + Vite + Tailwind). Use when building new pages, components, forms, or UI features. Guides through design → build → review workflow using specialized agents. Also use for frontend bug fixes, UI changes, or adding new components."
---

# Frontend Development (OPPN)

A systematic workflow for building frontend features. Orchestrates the full cycle: design specification → implementation → code review, delegating to specialized agents at each phase.

## Workflow Overview

```
Phase 1: Understand Requirements
    ↓
Phase 2: Design Specification (agent: frontend-design-spec)
    ↓
Phase 3: Implementation (agent: frontend-builder)
    ↓
Phase 4: Code Review (agent: code-reviewer)
```

---

## Phase 1: Understand Requirements

### Objectives

- Clarify what the user wants to build
- Identify scope: new page, new component, modification, or bug fix
- Determine if backend API exists or needs to be built first

### Questions to Ask (if unclear)

1. **What**: What page/component/feature are you building?
2. **Data**: What data does this display or collect? Does the API exist?
3. **Scope**: New page, add to existing page, or modify existing component?
4. **Special behavior**: Any specific interactions, validations, or edge cases?

### Decision Point: Route to Correct Workflow

| Scenario                                          | Workflow                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| **New page or complex feature**                   | Phase 2 → 3 → 4 (full workflow)                                   |
| **Small change** (add hook, fix bug, connect API) | Skip to Phase 3 → 4                                               |
| **Full-stack feature** (needs backend too)        | Run `backend-development` skill for API first, then continue here |
| **Design only** (wireframe/spec request)          | Phase 2 only                                                      |

---

## Phase 2: Design Specification

### Agent: `frontend-design-spec`

Launch the **frontend-design-spec** agent with a prompt that includes:

1. The user's requirements (what they want to build)
2. Project context: React 18 + Vite + Tailwind CSS + shadcn/ui (Radix UI)
3. **Design system** from skill: **`design-system`** (colors, glassmorphism, typography, icons, spacing)
4. Styling conventions from [references/styling-conventions.md](references/styling-conventions.md)
5. Shared components that MUST be used from [references/shared-components.md](references/shared-components.md)
6. Any existing pages/components to reference for consistency

### What the Agent Produces

- Component breakdown with layout specs
- User flow with all states (loading, empty, error, success)
- Form fields with validation rules (if applicable)
- Responsive behavior notes

### After Design Spec

- Present the design spec to the user
- **Get approval before proceeding to Phase 3**
- If user requests changes, re-run frontend-design-spec with feedback

---

## Phase 3: Implementation

### Agent: `frontend-builder`

Launch the **frontend-builder** agent with a prompt that includes:

1. The approved design spec from Phase 2 (or user's direct instructions for small tasks)
2. Shared components reference: [references/shared-components.md](references/shared-components.md)
3. Styling conventions: [references/styling-conventions.md](references/styling-conventions.md)
4. Page template to follow: [templates/page-template.md](templates/page-template.md)
5. Form template to follow (if applicable): [templates/form-template.md](templates/form-template.md)
6. Key rules:
    - MUST use shared components (never recreate)
    - MUST use React Hook Form + Zod for all forms (never native `<form>`)
    - MUST use React Query for data fetching (never raw fetch/useEffect)
    - MUST use Tailwind classes (never inline styles)
    - NEVER modify `components/ui/` (shadcn/ui primitives)

### What the Agent Produces

- Working React components with TypeScript
- TanStack Query hooks for data fetching
- Zod validation schemas for forms
- All states handled (loading, error, empty, success)

---

## Phase 4: Code Review

### Agent: `code-reviewer`

**ALWAYS run this after Phase 3 completes.** Do not wait for the user to ask.

Launch the **code-reviewer** agent to check:

- Shared components used correctly (not duplicated)
- Form pattern followed (React Hook Form + Zod, not native `<form>`)
- React Query used for all API calls
- No inline styles, no `any` types
- Glassmorphism styling conventions followed
- Accessibility basics (ARIA labels, keyboard navigation)

### If Issues Found

- P0/P1 issues: Fix immediately, then re-run code-reviewer
- P2-P4 issues: Present to user for decision

---

## Commands

- `npm run dev:frontend` — Start dev server
- `npm run lint:client` — Lint client code
- `npm run build:client` — Build client

## References

- [Shared Components](references/shared-components.md) — All shared components with imports and usage
- [Styling Conventions](references/styling-conventions.md) — Glassmorphism theme, Tailwind patterns

## Templates

- [Page Template](templates/page-template.md) — Standard page structure with header, filters, content
- [Form Template](templates/form-template.md) — React Hook Form + Zod pattern

## DON'Ts

- DON'T create duplicate components — use shared ones
- DON'T use native `<form>` — use `<Form>` component
- DON'T write custom search/badge/pagination/loading — use shared components
- DON'T modify shadcn/ui components in `components/ui/`
- DON'T use inline styles — use Tailwind classes
- DON'T use `any` type — use proper TypeScript types

## Related Skills

- `design-system` — **Read FIRST** before any UI work. Project's visual identity (colors, glassmorphism, spacing, icons)
