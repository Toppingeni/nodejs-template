import { Loader2 } from "lucide-react";

export interface PageLoaderProps {
  text?: string;
}

export function PageLoader({ text = "กำลังโหลด..." }: PageLoaderProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500">{text}</p>
      </div>
    </div>
  );
}
