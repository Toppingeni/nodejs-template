import type { JSX } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./context";

interface PrivateRouteProps {
  children?: JSX.Element;
  roles?: string[];
}

export default function PrivateRoute({ children, roles }: PrivateRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === "true";

  if (bypassAuth) {
    return children ?? <Outlet />;
  }

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200"
        role="status"
        aria-label="กำลังตรวจสอบสิทธิ์"
      >
        <div className="flex flex-col items-center gap-4">
          <svg
            className="h-10 w-10 animate-spin text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-sm font-medium text-slate-600">
            กำลังตรวจสอบสิทธิ์...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={`/login?redirectTo=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  if (roles && roles.length > 0) {
    const userType = user.UserType ?? "";
    const hasRole = roles.includes(userType);
    if (!hasRole) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
          <div className="rounded-2xl border border-red-200 bg-white/70 p-8 text-center shadow-lg backdrop-blur-xl">
            <p className="mb-2 text-xl font-bold text-red-600">
              ไม่มีสิทธิ์เข้าถึง
            </p>
            <p className="mb-6 text-sm text-slate-600">
              คุณไม่มีสิทธิ์เพียงพอในการเข้าถึงหน้านี้
            </p>
            <a
              href="/"
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700"
            >
              กลับหน้าหลัก
            </a>
          </div>
        </div>
      );
    }
  }

  return children ?? <Outlet />;
}
