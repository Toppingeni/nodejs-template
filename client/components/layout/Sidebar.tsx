import { ChevronLeft, ChevronRight } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useLayout } from "../../contexts/LayoutContext";
import { useUserRole } from "../../contexts/UserRoleContext";
import { cn } from "../../lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Icons8Home, Icons8Database } from "../shared/icons/Icons8";

interface MenuItem {
    label: string;
    path: string;
    icon: React.ElementType;
    roles?: string[];
}

const menuItems: MenuItem[] = [
    { label: "หน้าหลัก", path: "/", icon: Icons8Home },
    { label: "ตัวอย่าง CRUD", path: "/sample", icon: Icons8Database },
];

interface SidebarProps {
    onItemClick?: () => void;
}

export default function Sidebar({ onItemClick }: SidebarProps) {
    const { isSidebarCollapsed, toggleSidebar } = useLayout();
    const { hasAnyRole } = useUserRole();

    const visibleItems = menuItems.filter((item) => !item.roles || hasAnyRole(item.roles));

    return (
        <aside
            className={cn(
                "relative flex h-full flex-col border-r border-slate-200/60 bg-white/70 backdrop-blur-xl transition-all duration-300",
                isSidebarCollapsed ? "w-16" : "w-64",
            )}
            aria-label="แถบนำทางด้านข้าง"
        >
            {/* Collapse toggle — desktop only */}
            <button
                type="button"
                onClick={toggleSidebar}
                className="absolute -right-3 top-6 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 md:flex"
                aria-label={isSidebarCollapsed ? "ขยายแถบด้านข้าง" : "ย่อแถบด้านข้าง"}
            >
                {isSidebarCollapsed ? (
                    <ChevronRight className="h-3.5 w-3.5" />
                ) : (
                    <ChevronLeft className="h-3.5 w-3.5" />
                )}
            </button>

            {/* Menu items */}
            <nav
                className={cn(
                    "flex flex-col gap-1 pt-4",
                    isSidebarCollapsed ? "p-1.5 pt-4" : "p-3 pt-4",
                )}
                role="navigation"
            >
                {visibleItems.map((item) => {
                    const Icon = item.icon;

                    const linkContent = (
                        <NavLink
                            to={item.path}
                            end={item.path === "/"}
                            onClick={onItemClick}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/40",
                                    isActive
                                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                                    isSidebarCollapsed && "justify-center px-1 py-2",
                                )
                            }
                            aria-label={isSidebarCollapsed ? item.label : undefined}
                        >
                            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                            {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                        </NavLink>
                    );

                    if (isSidebarCollapsed) {
                        return (
                            <Tooltip key={item.path} delayDuration={200}>
                                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                <TooltipContent side="right">{item.label}</TooltipContent>
                            </Tooltip>
                        );
                    }

                    return <div key={item.path}>{linkContent}</div>;
                })}
            </nav>

            {/* Icons8 attribution (free license) */}
            <div className="mt-auto border-t border-slate-200/60 p-3">
                {!isSidebarCollapsed && (
                    <a
                        href="https://icons8.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center text-[10px] text-slate-400 transition hover:text-slate-600"
                    >
                        Icons by Icons8
                    </a>
                )}
            </div>
        </aside>
    );
}
