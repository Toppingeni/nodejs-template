import { SearchInput } from "@/components/shared/search";
import type { SampleFilters as SampleFiltersType } from "../../../../shared/types/sample";
import type { RecordStatus } from "../../../../shared/types/database";

interface SampleFiltersProps {
  filters: SampleFiltersType;
  onChange: (filters: SampleFiltersType) => void;
}

export function SampleFilters({ filters, onChange }: SampleFiltersProps) {
  const handleSearchChange = (value: string) => {
    onChange({ ...filters, search: value || undefined });
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
      <SearchInput
        value={filters.search ?? ""}
        onChange={handleSearchChange}
        placeholder="ค้นหาชื่อ, คำอธิบาย..."
        className="flex-1"
      />

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
