# Form Template

Standard pattern for ALL forms. Uses React Hook Form + Zod + shared Form components.

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormField,
  FormFieldItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/shared/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// 1. Define Zod schema
const featureSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อ"),
  description: z.string().optional(),
  status: z.string().min(1, "กรุณาเลือกสถานะ"),
});

type FeatureFormValues = z.infer<typeof featureSchema>;

// 2. Define props
interface FeatureFormProps {
  initialData?: Partial<FeatureFormValues>;
  onSubmit: (data: FeatureFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// 3. Form component
export function FeatureForm({ initialData, onSubmit, onCancel, isSubmitting }: FeatureFormProps) {
  const form = useForm<FeatureFormValues>({
    resolver: zodResolver(featureSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      status: initialData?.status ?? "A",
    },
  });

  return (
    <Form form={form} onSubmit={onSubmit}>
      {/* Text Input */}
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormFieldItem>
            <FormLabel required>ชื่อ</FormLabel>
            <FormControl>
              <Input placeholder="ระบุชื่อ" {...field} />
            </FormControl>
            <FormMessage />
          </FormFieldItem>
        )}
      />

      {/* Optional Text Input */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormFieldItem>
            <FormLabel>รายละเอียด</FormLabel>
            <FormControl>
              <Input placeholder="ระบุรายละเอียด (ถ้ามี)" {...field} />
            </FormControl>
            <FormMessage />
          </FormFieldItem>
        )}
      />

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          ยกเลิก
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
        >
          {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
      </div>
    </Form>
  );
}
```

## Rules

- **NEVER** use native `<form>` tag — always use `<Form>` component
- **NEVER** use raw `register()` — always use `<FormField>` with `render` prop
- **ALWAYS** define Zod schema for validation
- **ALWAYS** use `zodResolver` in `useForm`
- **ALWAYS** include `<FormMessage />` for error display
- **ALWAYS** mark required fields with `<FormLabel required>`
