import { cn } from "@/lib/utils";
import { getStatusConfig } from "@/constants/status";

interface StatusBadgeProps {
  status: string;
  customLabel?: string;
  className?: string;
}

export function StatusBadge({ status, customLabel, className }: StatusBadgeProps) {
  const config = getStatusConfig(status);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className,
      )}
    >
      {customLabel || config.label}
    </span>
  );
}
