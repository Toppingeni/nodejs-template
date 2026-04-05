import { useState } from "react";
import { Icons8Plus } from "@/components/shared/icons/Icons8";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    useSamples,
    useCreateSample,
    useUpdateSample,
    useDeleteSample,
} from "@/tanstackQuery/useSampleApi";
import { SampleFilters } from "./components/SampleFilters";
import { SampleTable } from "./components/SampleTable";
import { SampleForm } from "./components/SampleForm";
import type {
    Sample,
    SampleFilters as SampleFiltersType,
    CreateSampleDto,
    UpdateSampleDto,
} from "../../../shared/types/sample";

export function SamplePage() {
    const [filters, setFilters] = useState<SampleFiltersType>({});
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editItem, setEditItem] = useState<Sample | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { data: samples, isLoading } = useSamples(filters);
    const createMutation = useCreateSample();
    const updateMutation = useUpdateSample();
    const deleteMutation = useDeleteSample();

    const handleCreate = (data: CreateSampleDto) => {
        createMutation.mutate(data, {
            onSuccess: () => setIsCreateOpen(false),
        });
    };

    const handleUpdate = (data: UpdateSampleDto) => {
        if (!editItem) return;
        updateMutation.mutate({ id: editItem.id, data }, { onSuccess: () => setEditItem(null) });
    };

    const handleDelete = () => {
        if (!deleteId) return;
        deleteMutation.mutate(deleteId, {
            onSuccess: () => setDeleteId(null),
        });
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">จัดการข้อมูลตัวอย่าง</h1>
                    <p className="text-sm text-muted-foreground">CRUD ตัวอย่างครบ flow</p>
                </div>
                <Button
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/30"
                >
                    <Icons8Plus className="mr-2 h-4 w-4" />
                    สร้างใหม่
                </Button>
            </div>

            {/* Filters */}
            <SampleFilters filters={filters} onChange={setFilters} />

            {/* Table */}
            <SampleTable
                data={samples ?? []}
                isLoading={isLoading}
                onEdit={setEditItem}
                onDelete={(id) => setDeleteId(id)}
            />

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>สร้างข้อมูลใหม่</DialogTitle>
                    </DialogHeader>
                    <SampleForm
                        onSubmit={handleCreate}
                        isPending={createMutation.isPending}
                        onCancel={() => setIsCreateOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>แก้ไขข้อมูล</DialogTitle>
                    </DialogHeader>
                    <SampleForm
                        initialData={editItem}
                        onSubmit={handleUpdate}
                        isPending={updateMutation.isPending}
                        onCancel={() => setEditItem(null)}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
                        <AlertDialogDescription>
                            คุณต้องการลบข้อมูลนี้หรือไม่? การลบจะไม่สามารถกู้คืนได้
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? "กำลังลบ..." : "ลบข้อมูล"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
