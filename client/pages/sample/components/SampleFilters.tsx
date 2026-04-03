import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { SampleFilters as SampleFiltersType } from "../../../../shared/types/sample";
import type { RecordStatus } from "../../../../shared/types/database";

interface SampleFiltersProps {
  filters: SampleFiltersType;
  onChange: (filters: SampleFiltersType) => void;
}

export function SampleFilters({ filters, onChange }: SampleFiltersProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onChange({
      ...filters,
      status: value === "" ? undefined : (value as RecordStatus),
    });
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="text"
          placeholder="ค้นหาชื่อ, คำอธิบาย..."
          value={filters.search ?? ""}
          onChange={handleSearchChange}
          className="pl-9 bg-white/80 border-slate-200 focus:bg-white"
          aria-label="ค้นหาข้อมูล"
        />
      </div>

      {/* Status filter */}
      <div className="sm:w-44">
        <select
          value={filters.status ?? ""}
          onChange={handleStatusChange}
          className="flex h-10 w-full items-center rounded-md border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 ring-offset-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="กรองตามสถานะ"
        >
          <option value="">ทั้งหมด</option>
          <option value="A">ใช้งาน</option>
          <option value="D">ลบแล้ว</option>
        </select>
      </div>
    </div>
  );
}
