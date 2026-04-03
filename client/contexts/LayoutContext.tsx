import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const SIDEBAR_STORAGE_KEY = "sidebar_collapsed";
const MOBILE_BREAKPOINT = 768;

interface LayoutContextValue {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

interface LayoutProviderProps {
  children: ReactNode;
}

export function LayoutProvider({ children }: LayoutProviderProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    // Auto-collapse on mobile at initial load
    if (
      typeof window !== "undefined" &&
      window.innerWidth < MOBILE_BREAKPOINT
    ) {
      return true;
    }
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      return stored === "true";
    } catch {
      return false;
    }
  });

  // Auto-collapse on mobile resize
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsSidebarCollapsed(true);
      }
    };

    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Persist to localStorage (desktop only — mobile always collapses)
  useEffect(() => {
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    if (!isMobile) {
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarCollapsed));
      } catch {
        // ignore storage errors
      }
    }
  }, [isSidebarCollapsed]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  }, []);

  return (
    <LayoutContext.Provider
      value={{ isSidebarCollapsed, toggleSidebar, setSidebarCollapsed }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout(): LayoutContextValue {
  const ctx = useContext(LayoutContext);
  if (!ctx) {
    throw new Error("useLayout ต้องใช้ภายใน LayoutProvider");
  }
  return ctx;
}
