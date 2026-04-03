export const STATUS_CONFIG = {
  A: {
    label: "ใช้งาน",
    className:
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  },
  D: {
    label: "ลบแล้ว",
    className: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
  },
  I: {
    label: "ระงับ",
    className: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  },
  P: {
    label: "รอดำเนินการ",
    className: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
  },
  C: {
    label: "เสร็จสิ้น",
    className: "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20",
  },
} as const;

export type StatusKey = keyof typeof STATUS_CONFIG;

export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status as StatusKey] || {
    label: status,
    className: "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20",
  };
}
