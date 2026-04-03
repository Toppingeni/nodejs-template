import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormFieldItem, FormLabel, FormControl, FormMessage } from "@/components/shared/form";
import type { Sample } from "../../../../shared/types/sample";

const sampleSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อ"),
  description: z.string().optional(),
});

type SampleFormValues = z.infer<typeof sampleSchema>;

interface SampleFormProps {
  initialData?: Sample | null;
  onSubmit: (data: SampleFormValues) => void;
  isPending: boolean;
  onCancel: () => void;
}

export function SampleForm({
  initialData,
  onSubmit,
  isPending,
  onCancel,
}: SampleFormProps) {
  const form = useForm<SampleFormValues>({
    resolver: zodResolver(sampleSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
    },
  });

  return (
    <Form form={form} onSubmit={onSubmit} className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormFieldItem>
            <FormLabel required>ชื่อ</FormLabel>
            <FormControl>
              <Input
                placeholder="ระบุชื่อ"
                {...field}
                className={form.formState.errors.name ? "border-red-500" : ""}
              />
            </FormControl>
            <FormMessage />
          </FormFieldItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormFieldItem>
            <FormLabel>คำอธิบาย</FormLabel>
            <FormControl>
              <Textarea
                placeholder="ระบุคำอธิบาย (ไม่บังคับ)"
                rows={3}
                {...field}
              />
            </FormControl>
          </FormFieldItem>
        )}
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="rounded-xl"
        >
          ยกเลิก
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl"
        >
          {isPending ? "กำลังบันทึก..." : initialData ? "อัปเดต" : "สร้าง"}
        </Button>
      </div>
    </Form>
  );
}
