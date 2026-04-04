# Page Template

Standard structure for all new pages.

```typescript
import { useState } from "react";
import { PageLoader } from "@/components/shared/loading";
import { SearchInput } from "@/components/shared/search";
import { TablePagination, EmptyState } from "@/components/shared/table";

// Types
interface Filters {
  search?: string;
  status?: string;
}

// Page Component
export function FeatureNamePage() {
  const [filters, setFilters] = useState<Filters>({});
  const [editItem, setEditItem] = useState<FeatureType | null>(null);

  // Data fetching via React Query
  const { data, isLoading } = useFeatureList(filters);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Feature Title</h1>
          <p className="text-sm text-muted-foreground">Feature description</p>
        </div>
        <Button
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl"
          onClick={() => setEditItem({} as FeatureType)}
        >
          + Add New
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <SearchInput
          value={filters.search ?? ""}
          onChange={(value) => setFilters({ ...filters, search: value || undefined })}
          placeholder="Search..."
          className="flex-1"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <PageLoader />
      ) : !data?.length ? (
        <EmptyState
          title="No data found"
          description="Try adjusting your filters"
        />
      ) : (
        <>
          {/* Table or content here */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-sm">
            {/* Table content */}
          </div>

          {/* Pagination */}
          <TablePagination
            currentPage={pageIndex}
            totalPages={totalPages}
            totalItems={data.length}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Form Dialog/Sheet */}
      {editItem && (
        <FeatureFormDialog
          item={editItem}
          onClose={() => setEditItem(null)}
          onSuccess={() => { /* invalidate query */ }}
        />
      )}
    </div>
  );
}
```
