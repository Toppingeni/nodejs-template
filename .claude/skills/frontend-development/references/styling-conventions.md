# Styling Conventions Reference

## Glassmorphism Theme

| Element                   | Tailwind Classes                                                     |
| ------------------------- | -------------------------------------------------------------------- |
| Card/Container Background | `bg-white/70 backdrop-blur-xl`                                       |
| Border                    | `border-slate-200/60`                                                |
| Shadow                    | `shadow-lg shadow-blue-500/30`                                       |
| Radius                    | `rounded-xl` or `rounded-2xl`                                        |
| Spacing                   | `p-4 md:p-6`, `gap-3`                                                |
| Primary Buttons           | `bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl` |
| Tables                    | `rounded-2xl bg-white/70 shadow-sm backdrop-blur-xl`                 |

## Common Patterns

### Page Container

```html
<div className="p-6 space-y-6">
    <!-- content -->
</div>
```

### Card

```html
<div
    className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-lg shadow-blue-500/30 p-4 md:p-6"
>
    <!-- content -->
</div>
```

### Header Section

```html
<div className="flex items-center justify-between">
    <div>
        <h1 className="text-2xl font-bold">Title</h1>
        <p className="text-sm text-muted-foreground">Description</p>
    </div>
    <ActionButtons />
</div>
```

### Primary Button

```html
<button
    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all"
>
    Action
</button>
```

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Radix UI (shadcn/ui)
- React Router DOM
- React Query (TanStack Query)
- React Hook Form + Zod
- Lucide React (icons)

## Rules

- **DO** use Tailwind classes only
- **DO** use Radix UI primitives (Dialog, Sheet, Dropdown, etc.)
- **DO** use Lucide React for icons
- **DON'T** use inline styles
- **DON'T** use CSS modules
- **DON'T** hardcode colors — use Tailwind theme
