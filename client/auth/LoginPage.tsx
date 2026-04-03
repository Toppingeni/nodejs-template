import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, LogIn, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "./context";

const loginSchema = z.object({
    userId: z.string().min(1, "กรุณากรอกรหัสผู้ใช้"),
    password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
    remember: z.boolean().default(true),
    enableTracking: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const { loginWithCredentials } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [shouldRedirect, setShouldRedirect] = useState(false);

    const redirectTo = searchParams.get("redirectTo") ?? "/";

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { userId: "", password: "", remember: true, enableTracking: false },
    });

    useEffect(() => {
        if (shouldRedirect) {
            navigate(redirectTo, { replace: true });
        }
    }, [shouldRedirect, navigate, redirectTo]);

    const onSubmit = async (values: LoginFormValues) => {
        setError(null);

        try {
            await loginWithCredentials({
                userId: values.userId,
                password: values.password,
                trackingstatus: values.enableTracking ? "T" : "F",
                remember: values.remember,
            });
            setShouldRedirect(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ";
            setError(message);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
            {/* Ambient blur circles */}
            <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-300/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-300/30 blur-3xl" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-200/20 blur-2xl" />

            {/* Login card */}
            <div className="relative z-10 w-full max-w-md px-4">
                <div className="rounded-2xl border border-white/50 bg-white/70 p-8 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
                    {/* Logo / title */}
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30">
                            <LogIn className="h-7 w-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800">เข้าสู่ระบบ</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            กรุณากรอกข้อมูลเพื่อเข้าใช้งาน
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                        {/* UserId field */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor="userId"
                                className="block text-sm font-medium text-slate-700"
                            >
                                รหัสผู้ใช้
                            </label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                                    <User className="h-4 w-4" />
                                </span>
                                <input
                                    id="userId"
                                    type="text"
                                    autoComplete="username"
                                    {...register("userId")}
                                    className="w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-9 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                                    placeholder="กรอกรหัสผู้ใช้"
                                    disabled={isSubmitting}
                                    aria-describedby={errors.userId ? "userId-error" : undefined}
                                />
                            </div>
                            {errors.userId && (
                                <p id="userId-error" className="text-xs text-red-500" role="alert">
                                    {errors.userId.message}
                                </p>
                            )}
                        </div>

                        {/* Password field */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-slate-700"
                            >
                                รหัสผ่าน
                            </label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                                    <Lock className="h-4 w-4" />
                                </span>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    {...register("password")}
                                    className="w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-9 pr-10 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                                    placeholder="กรอกรหัสผ่าน"
                                    disabled={isSubmitting}
                                    aria-describedby={
                                        errors.password ? "password-error" : undefined
                                    }
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                                    aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p
                                    id="password-error"
                                    className="text-xs text-red-500"
                                    role="alert"
                                >
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Remember me + Tracking toggle */}
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    {...register("remember")}
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    disabled={isSubmitting}
                                />
                                <label
                                    htmlFor="remember"
                                    className="cursor-pointer select-none text-sm text-slate-600"
                                >
                                    จดจำฉัน
                                </label>
                            </div>
                            <div className="flex items-center gap-2">
                                <label
                                    htmlFor="enableTracking"
                                    className="cursor-pointer select-none text-sm text-slate-600"
                                >
                                    อนุญาตให้ติดตาม
                                </label>
                                <input
                                    id="enableTracking"
                                    type="checkbox"
                                    {...register("enableTracking")}
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div
                                role="alert"
                                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                            >
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg
                                        className="h-4 w-4 animate-spin"
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
                                    <span>กำลังเข้าสู่ระบบ...</span>
                                </>
                            ) : (
                                <>
                                    <LogIn className="h-4 w-4" />
                                    <span>เข้าสู่ระบบ</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
