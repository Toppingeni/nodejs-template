# Layout — Sidebar & Navbar (Header)

## โครงสร้าง

```
client/components/layout/
├── MainLayout.tsx     # Layout หลัก: Header + Sidebar + Content
├── Sidebar.tsx        # Sidebar navigation (collapsible + role-based)
└── Header.tsx         # Top navbar (user menu, mobile menu button)

client/contexts/
└── LayoutContext.tsx   # Sidebar collapse state (persist localStorage)
```

## Layout Diagram

```
┌──────────────────────────────────────────────┐
│  Header (sticky top, z-50, backdrop-blur)    │
│  [≡ mobile] [Logo + Title]     [User ▼]     │
├──────┬───────────────────────────────────────┤
│      │                                       │
│  S   │         Main Content                  │
│  i   │         (flex-1, overflow-auto)       │
│  d   │                                       │
│  e   │         <children />                  │
│  b   │                                       │
│  a   │                                       │
│  r   │                                       │
│      │                                       │
└──────┴───────────────────────────────────────┘

Desktop: Sidebar visible (w-64 / w-16 collapsed)
Mobile:  Sidebar hidden → Sheet overlay จากซ้าย
```

---

## MainLayout (`components/layout/MainLayout.tsx`)

```tsx
import { ReactNode, useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-slate-50 overflow-hidden relative">
      {/* Background gradient + ambient glows */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 -z-10" />

      <Header onMobileMenuClick={() => setIsMobileMenuOpen(true)} />

      {/* dvh = dynamic viewport height (handle mobile browser address bar) */}
      <div className="flex h-[calc(100dvh-4rem)]">
        {/* Desktop Sidebar */}
        <div className="hidden md:block h-full">
          <Sidebar />
        </div>

        <main className="flex-1 overflow-auto relative pb-5 md:pb-0">
          {children}

          {/* Mobile Sidebar — Sheet overlay */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetContent side="left" className="p-0 w-[85vw] sm:w-[350px]">
                <Sidebar isMobile onClose={() => setIsMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
        </main>
      </div>
    </div>
  );
}
```

### ใช้งานในทุก Page

```tsx
export function SamplePage() {
  return (
    <MainLayout>
      <div className="p-6">{/* Page content */}</div>
    </MainLayout>
  );
}
```

---

## Header (`components/layout/Header.tsx`)

```tsx
import { LogOut, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/auth';
import { useLogout } from '@/tanstackQuery/useApi';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface HeaderProps {
  onMobileMenuClick?: () => void;
}

export function Header({ onMobileMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const logoutMutation = useLogout();

  return (
    <header className="h-16 bg-white/70 backdrop-blur-lg border-b border-white/20 px-6 flex items-center justify-between shadow-sm sticky top-0 z-50">
      <div className="flex items-center space-x-6">
        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={onMobileMenuClick}>
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        {/* Logo + Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl hidden md:flex overflow-hidden bg-white">
            <img src="/favicon.ico" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold">App Title</h1>
            <p className="text-sm text-muted-foreground hidden md:block">คำอธิบายระบบ</p>
          </div>
        </div>
      </div>

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center space-x-3 rounded-full">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold">{user?.UserName}</p>
            </div>
            <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{user?.UserName}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/* เพิ่ม menu items ตามต้องการ */}
          <DropdownMenuItem onClick={() => logoutMutation.mutate()} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            ออกจากระบบ
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
```

---

## Sidebar (`components/layout/Sidebar.tsx`)

### Features

- **Collapsible**: กดปุ่ม toggle → ย่อเป็น icon-only (w-16) / ขยาย (w-64)
- **Tooltip**: mode collapsed แสดง tooltip ชื่อเมนูเมื่อ hover
- **Active route**: highlight ด้วย gradient สีน้ำเงิน + shadow
- **Role-based**: กรองเมนูตาม user role
- **Mobile**: เปิดเต็มจอ, กดเมนู → ปิด sheet อัตโนมัติ
- **Persist**: เก็บสถานะ collapse ใน localStorage

```tsx
import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LucideIcon } from 'lucide-react';
import { useLayout } from '@/contexts/LayoutContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// กำหนด menu items — ปรับตามโปรเจกต์
interface MenuItem {
  path: string;
  title: string;
  icon: LucideIcon;
  roles?: string[]; // ถ้าไม่ระบุ = ทุก role เข้าได้
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isMobile = false, onClose }: SidebarProps) {
  const { isSidebarCollapsed, toggleSidebar } = useLayout();
  const isCollapsed = isMobile ? false : isSidebarCollapsed;

  // กำหนด menu groups ที่นี่ (หรือดึงจาก route config)
  const menuGroups: MenuGroup[] = [
    /* ใส่ menu groups ตามโปรเจกต์ */
  ];

  return (
    <aside
      className={cn(
        'bg-white/70 backdrop-blur-xl border-r border-white/40 h-full flex flex-col transition-all duration-300 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]',
        isCollapsed ? 'w-16' : isMobile ? 'w-full' : 'w-64',
      )}
    >
      <div className="flex-1 overflow-y-auto py-2">
        <nav className="space-y-2 px-2">
          {menuGroups.map((group, index) => (
            <div key={group.title} className="mt-4 first:mt-0">
              {/* Group title + collapse toggle (first group only) */}
              {index === 0 ? (
                <div className={cn('flex items-center mb-2', isCollapsed ? 'justify-center' : 'justify-between px-4')}>
                  {!isCollapsed && <span className="text-xs font-semibold text-muted-foreground uppercase">{group.title}</span>}
                  {!isMobile && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleSidebar}>
                      {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {!isCollapsed && <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">{group.title}</div>}
                  {isCollapsed && <div className="h-px bg-border mx-2 my-2" />}
                </>
              )}

              {/* Menu items */}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  const link = (
                    <NavLink
                      to={item.path}
                      onClick={() => isMobile && onClose?.()}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center rounded-xl transition-all duration-300 py-2.5',
                          isCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'space-x-3 px-4',
                          isActive ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-600 hover:bg-white/50 hover:text-blue-700',
                        )
                      }
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!isCollapsed && <span className="font-medium truncate">{item.title}</span>}
                    </NavLink>
                  );

                  // Collapsed → wrap with Tooltip
                  if (isCollapsed) {
                    return (
                      <TooltipProvider key={item.path} delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>{link}</TooltipTrigger>
                          <TooltipContent side="right">{item.title}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  }

                  return <div key={item.path}>{link}</div>;
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
```

---

## LayoutContext (`contexts/LayoutContext.tsx`)

```tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LayoutContextType {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return true;
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  // Auto-collapse on mobile resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setIsSidebarCollapsed(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);

  return (
    <LayoutContext.Provider
      value={{
        isSidebarCollapsed,
        toggleSidebar: () => setIsSidebarCollapsed((prev) => !prev),
        setSidebarCollapsed: setIsSidebarCollapsed,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) throw new Error('useLayout must be used within LayoutProvider');
  return context;
}
```

---

## Styling สำคัญ

| Element       | Style                                                               |
| ------------- | ------------------------------------------------------------------- |
| Header        | `bg-white/70 backdrop-blur-lg sticky top-0 z-50`                    |
| Sidebar       | `bg-white/70 backdrop-blur-xl` + gradient border ขวา                |
| Active menu   | `bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg` |
| Sidebar width | Expanded: `w-64`, Collapsed: `w-16`, Mobile: `w-full`               |
| Content area  | `h-[calc(100dvh-4rem)]` (ลบความสูง header 4rem)                     |
| Transition    | `transition-all duration-300` ทุก animation                         |

## Responsive Behavior

| Screen           | Sidebar               | Menu trigger             |
| ---------------- | --------------------- | ------------------------ |
| Desktop (≥768px) | Visible, collapsible  | Toggle button ใน sidebar |
| Mobile (<768px)  | Hidden, Sheet overlay | Menu icon ใน Header      |
