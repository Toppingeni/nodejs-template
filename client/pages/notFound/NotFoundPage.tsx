import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <div className="text-center space-y-6">
        <h1 className="text-8xl font-bold text-slate-300">404</h1>
        <h2 className="text-2xl font-bold text-slate-700">
          ไม่พบหน้าที่ต้องการ
        </h2>
        <p className="text-muted-foreground">
          หน้าที่คุณกำลังค้นหาอาจถูกย้ายหรือลบออกแล้ว
        </p>
        <Button
          asChild
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl"
        >
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            กลับหน้าหลัก
          </Link>
        </Button>
      </div>
    </div>
  );
}
