import { CircleX } from "lucide-react";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  title = "ไม่พบข้อมูล",
  description = "ลองเปลี่ยนเงื่อนไขการค้นหาหรือสร้างข้อมูลใหม่",
  icon,
  action,
}: EmptyStateProps) {
  const defaultIcon = (
    <div className="rounded-full bg-slate-100 p-4">
      <CircleX className="h-8 w-8 text-slate-400" />
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
      {icon || defaultIcon}
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="text-sm text-slate-400">{description}</p>
      {action}
    </div>
  );
}
