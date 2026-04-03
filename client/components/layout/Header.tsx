import { LogOut, Menu, User } from "lucide-react";
import { useAuth } from "../../auth/context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useLayout } from "../../contexts/LayoutContext";

interface HeaderProps {
  onMobileMenuClick: () => void;
}

export default function Header({ onMobileMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useLayout();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/60 bg-white/70 px-4 backdrop-blur-lg md:px-6">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 md:hidden"
          onClick={onMobileMenuClick}
          aria-label="เปิดเมนู"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop sidebar toggle */}
        <button
          type="button"
          className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 md:flex"
          onClick={toggleSidebar}
          aria-label="ย่อ/ขยายแถบด้านข้าง"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo + App title */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm shadow-blue-500/30">
            <span className="text-xs font-bold text-white">A</span>
          </div>
          <span className="hidden text-base font-semibold text-slate-800 sm:block">
            App Template
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              aria-label="เมนูผู้ใช้"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500">
                <User className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="hidden max-w-[120px] truncate sm:block">
                {user?.UserName ?? "ผู้ใช้งาน"}
              </span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-slate-800">
                  {user?.UserName ?? "ผู้ใช้งาน"}
                </span>
                {user?.ORG && (
                  <span className="text-xs text-slate-500">{user.ORG}</span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              ออกจากระบบ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
