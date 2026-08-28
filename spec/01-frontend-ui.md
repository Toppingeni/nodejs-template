# Frontend & UI

## UI Libraries

ใช้ **2 ชุด UI** ร่วมกัน:

1. **shadcn/ui** (Radix Primitives + Tailwind CSS) - component หลัก
   - Button, Card, Dialog, Input, Label, Checkbox, Alert, Toast, etc.
   - อยู่ใน `client/components/ui/`
   - ใช้ `class-variance-authority` + `clsx` สำหรับ variant styling

2. **MUI (Material UI v7)** - ใช้เฉพาะ DateTimePicker
   - **`@mui/x-date-pickers`** — เลือกวันที่+เวลา format `dd/mm/yyyy HH:mm` พร้อม locale ไทย
   - เหตุผลที่ไม่ใช้ shadcn: shadcn ใช้ `react-day-picker` เลือกได้แค่วันที่ ไม่มี time picker, locale ตั้งได้แค่ภาษาแต่ไม่รองรับ datetime format ที่ต้องการ
   - Dependencies ที่ต้องเก็บไว้: `@mui/material`, `@mui/x-date-pickers`, `@emotion/react`, `@emotion/styled`

## Styling

- **Tailwind CSS** เป็น styling หลัก
- Theme support ผ่าน `next-themes` (light/dark mode)
- Custom theme config อยู่ใน `client/theme/`

## Component Structure

```
client/
├── components/
│   ├── ui/             # shadcn/ui base components (button, card, dialog...)
│   └── *.tsx           # App-level shared components (RoleBasedRedirect, etc.)
├── pages/
│   └── <featureName>/  # แต่ละ feature มี folder ของตัวเอง
│       ├── FeatureName.tsx       # Main page component
│       └── components/           # Page-specific components
├── hooks/              # Custom hooks (useMobile, useToast, etc.)
├── contexts/           # React contexts
├── constants/          # App constants
├── types/              # Client-only types
└── utils/              # Client utilities
```

## Forms Pattern

- ใช้ **React Hook Form** + **Zod** สำหรับทุก form
- Pattern:
  ```tsx
  const schema = z.object({ ... });
  type FormValues = z.infer<typeof schema>;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ... },
  });
  ```

## Routing

- ใช้ **React Router DOM** (createBrowserRouter)
- Route config อยู่ใน `client/router/routes.tsx`
- Routes จัดกลุ่มตาม feature
- รองรับ role-based access ผ่าน `roles` property ใน route config
- Protected routes ผ่าน `<PrivateRoute>` wrapper
