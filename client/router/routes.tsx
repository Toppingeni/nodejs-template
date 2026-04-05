import React, { lazy, Suspense } from "react";
import { RouteObject } from "react-router-dom";
import { LoginPage, TokenLogin, PrivateRoute } from "@/auth";
import MainLayout from "@/components/layout/MainLayout";
import { PageLoader } from "@/components/shared/loading/PageLoader";

const HomePage = lazy(() =>
    import("@/pages/index/HomePage").then((m) => ({ default: m.HomePage })),
);
const SamplePage = lazy(() =>
    import("@/pages/sample/SamplePage").then((m) => ({ default: m.SamplePage })),
);
const NotFoundPage = lazy(() =>
    import("@/pages/notFound/NotFoundPage").then((m) => ({ default: m.NotFoundPage })),
);

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
    return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export function generateRoutes(): RouteObject[] {
    return [
        { path: "/login", element: <LoginPage /> },
        { path: "/token-login", element: <TokenLogin /> },
        {
            path: "/",
            element: (
                <PrivateRoute>
                    <MainLayout />
                </PrivateRoute>
            ),
            children: [
                {
                    index: true,
                    element: (
                        <SuspenseWrapper>
                            <HomePage />
                        </SuspenseWrapper>
                    ),
                },
                {
                    path: "sample",
                    element: (
                        <SuspenseWrapper>
                            <SamplePage />
                        </SuspenseWrapper>
                    ),
                },
            ],
        },
        {
            path: "*",
            element: (
                <SuspenseWrapper>
                    <NotFoundPage />
                </SuspenseWrapper>
            ),
        },
    ];
}
