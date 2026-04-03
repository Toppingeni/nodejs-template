import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import {
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/badge";
import { TablePagination, EmptyState } from "@/components/shared/table";
import { formatDateTime } from "../../../../shared/utils/index";
import type { Sample } from "../../../../shared/types/sample";

interface SampleTableProps {
  data: Sample[];
  isLoading: boolean;
  onEdit: (sample: Sample) => void;
  onDelete: (id: string) => void;
}

const columnHelper = createColumnHelper<Sample>();

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 animate-pulse rounded bg-slate-200" />
        </td>
      ))}
    </tr>
  );
}

export function SampleTable({
  data,
  isLoading,
  onEdit,
  onDelete,
}: SampleTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns = [
    columnHelper.accessor("name", {
      header: "ชื่อ",
      cell: (info) => (
        <span className="font-medium text-slate-800">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("description", {
      header: "คำอธิบาย",
      cell: (info) => (
        <span className="text-slate-600">{info.getValue() ?? "-"}</span>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor("status", {
      header: "สถานะ",
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor("createdAt", {
      header: "วันที่สร้าง",
      cell: (info) => (
        <span className="text-slate-600">
          {formatDateTime(info.getValue())}
        </span>
      ),
    }),
    columnHelper.accessor("createdBy", {
      header: "ผู้สร้าง",
      cell: (info) => (
        <span className="text-slate-600">{info.getValue() ?? "-"}</span>
      ),
      enableSorting: false,
    }),
    columnHelper.display({
      id: "actions",
      header: "จัดการ",
      cell: (info) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(info.row.original)}
            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            aria-label={`แก้ไข ${info.row.original.name}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(info.row.original.id)}
            className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-700"
            aria-label={`ลบ ${info.row.original.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-hidden rounded-2xl bg-white/70 shadow-sm backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table
          className="w-full text-sm"
          role="table"
          aria-label="ตารางข้อมูลตัวอย่าง"
        >
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-slate-200 bg-slate-50/80"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    scope="col"
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        className={`flex items-center gap-1 ${
                          header.column.getCanSort()
                            ? "cursor-pointer select-none hover:text-slate-800"
                            : "cursor-default"
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                        aria-sort={
                          header.column.getIsSorted() === "asc"
                            ? "ascending"
                            : header.column.getIsSorted() === "desc"
                              ? "descending"
                              : "none"
                        }
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getCanSort() && (
                          <span className="ml-1">
                            {header.column.getIsSorted() === "asc" ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronsUpDown className="h-3 w-3 text-slate-300" />
                            )}
                          </span>
                        )}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12"
                >
                  <EmptyState />
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50/60"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && (
        <TablePagination
          currentPage={pagination.pageIndex}
          totalPages={table.getPageCount()}
          totalItems={data.length}
          pageSize={pagination.pageSize}
          onPageChange={(page) => setPagination({ ...pagination, pageIndex: page })}
        />
      )}
    </div>
  );
}
