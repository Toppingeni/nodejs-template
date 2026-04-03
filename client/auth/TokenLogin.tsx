import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./context";

function sanitizeRedirect(url: string | null): string {
  if (!url) return "/";
  // Only allow relative paths to prevent open redirects
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin !== window.location.origin) return "/";
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return "/";
  }
}

export default function TokenLogin() {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const redirectTo = sanitizeRedirect(searchParams.get("redirectTo"));

    if (!token) {
      setError("ไม่พบ token ในพารามิเตอร์");
      return;
    }

    try {
      loginWithToken(token);
      navigate(redirectTo, { replace: true });
    } catch {
      setError("Token ไม่ถูกต้องหรือหมดอายุ กรุณาเข้าสู่ระบบใหม่");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
        <div className="rounded-2xl border border-red-200 bg-white/70 p-8 text-center shadow-lg backdrop-blur-xl">
          <p className="mb-4 text-lg font-semibold text-red-600">
            เกิดข้อผิดพลาด
          </p>
          <p className="mb-6 text-sm text-slate-600">{error}</p>
          <a
            href="/login"
            className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700"
          >
            ไปหน้าเข้าสู่ระบบ
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200"
      role="status"
      aria-label="กำลังตรวจสอบ token"
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
          กำลังตรวจสอบ token...
        </p>
      </div>
    </div>
  );
}
