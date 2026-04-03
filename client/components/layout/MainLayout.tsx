import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useLayout } from "../../contexts/LayoutContext";
import { Sheet, SheetContent } from "../ui/sheet";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function MainLayout() {
  const { isSidebarCollapsed } = useLayout();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      {/* Ambient glow circles */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-200/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-200/20 blur-3xl" />

      {/* Sticky header */}
      <Header onMobileMenuClick={() => setMobileOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:flex md:shrink-0">
          <Sidebar />
        </div>

        {/* Mobile sidebar — Sheet overlay */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="w-64 p-0 bg-white/90 backdrop-blur-xl"
          >
            <div className="flex h-full flex-col">
              <div className="flex h-16 items-center border-b border-slate-200/60 px-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm">
                    <span className="text-xs font-bold text-white">A</span>
                  </div>
                  <span className="text-base font-semibold text-slate-800">
                    App Template
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar onItemClick={() => setMobileOpen(false)} />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <main
          className={[
            "flex-1 overflow-y-auto transition-all duration-300",
            "h-[calc(100dvh-4rem)]",
          ].join(" ")}
          id="main-content"
        >
          <div
            className={[
              "mx-auto p-4 md:p-6",
              isSidebarCollapsed ? "max-w-screen-xl" : "max-w-screen-xl",
            ].join(" ")}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
