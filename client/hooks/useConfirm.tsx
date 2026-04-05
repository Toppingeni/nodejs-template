import { useState, useCallback, useRef } from "react";
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

interface ConfirmOptions {
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
}

const defaultOptions: Required<ConfirmOptions> = {
    title: "ยืนยันการดำเนินการ",
    description: "คุณต้องการดำเนินการนี้หรือไม่?",
    confirmText: "ยืนยัน",
    cancelText: "ยกเลิก",
    variant: "default",
};

export function useConfirm() {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<Required<ConfirmOptions>>(defaultOptions);
    const resolveRef = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback((opts?: ConfirmOptions): Promise<boolean> => {
        setOptions({ ...defaultOptions, ...opts });
        setOpen(true);

        return new Promise<boolean>((resolve) => {
            resolveRef.current = resolve;
        });
    }, []);

    const handleConfirm = useCallback(() => {
        setOpen(false);
        resolveRef.current?.(true);
        resolveRef.current = null;
    }, []);

    const handleCancel = useCallback(() => {
        setOpen(false);
        resolveRef.current?.(false);
        resolveRef.current = null;
    }, []);

    function ConfirmDialog() {
        return (
            <AlertDialog open={open} onOpenChange={(v) => !v && handleCancel()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{options.title}</AlertDialogTitle>
                        <AlertDialogDescription>{options.description}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancel}>
                            {options.cancelText}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            className={
                                options.variant === "destructive"
                                    ? "bg-red-600 hover:bg-red-700"
                                    : "bg-gradient-to-r from-blue-600 to-indigo-600"
                            }
                        >
                            {options.confirmText}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );
    }

    return { confirm, ConfirmDialog };
}
