import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "../../../../shared/utils/index";
import type { Sample } from "../../../../shared/types/sample";

interface SampleTableProps {
  data: Sample[];
  isLoading: boolean;
  onEdit: (sample: Sample) => void;
  onDelete: (sample: Sample) => void;
}

const columnHelper = createColumnHelper<Sample>();

function StatusBadge({ status }: { status: string }) {
  if (status === "A") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
        ใช้งาน
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
      ลบแล้ว
    </span>
  );
}

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
            onClick={() => onDelete(info.row.original)}
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
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="overflow-hidden rounded-2xl bg-white/70 shadow-sm backdrop-blur-xl">
      {/* Table */}
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
                  className="px-4 py-12 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="rounded-full bg-slate-100 p-4">
                      <svg
                        className="h-8 w-8 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                    </div>
                    <p className="font-medium">ไม่พบข้อมูล</p>
                    <p className="text-sm text-slate-400">
                      ลองเปลี่ยนเงื่อนไขการค้นหาหรือสร้างข้อมูลใหม่
                    </p>
                  </div>
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

      {/* Pagination */}
      {!isLoading && table.getPageCount() > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <p className="text-sm text-slate-500">
            แสดง{" "}
            <span className="font-medium text-slate-700">
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}
            </span>{" "}
            –{" "}
            <span className="font-medium text-slate-700">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                data.length,
              )}
            </span>{" "}
            จาก{" "}
            <span className="font-medium text-slate-700">{data.length}</span>{" "}
            รายการ
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="หน้าก่อนหน้า"
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-sm text-slate-600">
              หน้า {table.getState().pagination.pageIndex + 1} /{" "}
              {table.getPageCount()}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="หน้าถัดไป"
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
