import { RouteObject } from "react-router-dom";
import { LoginPage, TokenLogin, PrivateRoute } from "@/auth";
import MainLayout from "@/components/layout/MainLayout";
import { HomePage } from "@/pages/index/HomePage";
import { SamplePage } from "@/pages/sample/SamplePage";
import { NotFoundPage } from "@/pages/notFound/NotFoundPage";

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
        { index: true, element: <HomePage /> },
        { path: "sample", element: <SamplePage /> },
      ],
    },
    { path: "*", element: <NotFoundPage /> },
  ];
}
