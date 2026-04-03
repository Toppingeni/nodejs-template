import { Link } from "react-router-dom";
import {
  BarChart3,
  FileText,
  Users,
  Activity,
  ArrowRight,
  Database,
} from "lucide-react";
import { useAuth } from "@/auth/context";

interface StatCard {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const statCards: StatCard[] = [
  {
    label: "ข้อมูลทั้งหมด",
    value: "128",
    icon: Database,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    label: "ผู้ใช้งาน",
    value: "24",
    icon: Users,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
  {
    label: "รายงาน",
    value: "16",
    icon: BarChart3,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
  },
  {
    label: "กิจกรรมวันนี้",
    value: "42",
    icon: Activity,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
];

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-full space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold md:text-3xl">หน้าหลัก</h1>
        <p className="mt-1 text-blue-100">
          ยินดีต้อนรับ{user?.UserName ? `, ${user.UserName}` : ""} เข้าสู่ระบบ
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-xl transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="mt-1 text-3xl font-bold text-slate-800">
                    {card.value}
                  </p>
                </div>
                <div className={`rounded-xl p-3 ${card.bgColor}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-700">เมนูลัด</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/sample"
            className="group flex items-center justify-between rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-xl transition-all hover:shadow-md hover:ring-2 hover:ring-blue-200"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-blue-50 p-3">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">ข้อมูลตัวอย่าง</p>
                <p className="text-sm text-slate-500">จัดการข้อมูล Sample</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
