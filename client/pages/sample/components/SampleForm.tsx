import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SampleFormValues>({
    resolver: zodResolver(sampleSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">ชื่อ *</Label>
        <Input
          id="name"
          placeholder="ระบุชื่อ"
          {...register("name")}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">คำอธิบาย</Label>
        <Textarea
          id="description"
          placeholder="ระบุคำอธิบาย (ไม่บังคับ)"
          rows={3}
          {...register("description")}
        />
      </div>

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
    </form>
  );
}
