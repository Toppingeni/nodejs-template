# App Bootstrap — Provider Stack & Entry Point

## Client Entry (`client/App.tsx`)

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/auth';
import { ThemeProvider } from '@/theme';
import { queryClient } from '@/tanstackQuery';
import { generateRoutes } from './router/routes';
import './global.css';

const router = createBrowserRouter(generateRoutes());

function App() {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <TooltipProvider>
              <RouterProvider router={router} />
            </TooltipProvider>
          </ThemeProvider>
          <Toaster />
          <Sonner />
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
```

### Provider ลำดับ (นอก → ใน)

1. `StrictMode` — React dev checks
2. `QueryClientProvider` — TanStack Query
3. `AuthProvider` — Auth state (user, token)
4. `ThemeProvider` — Light/dark theme
5. `TooltipProvider` — shadcn/ui tooltips
6. `RouterProvider` — React Router

## PrivateRoute (`client/auth/PrivateRoute.tsx`)

```tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context';

export default function PrivateRoute({ children, roles }: { children: JSX.Element; roles?: string[] }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div>Loading...</div>;

  // Dev bypass
  if (import.meta.env.VITE_BYPASS_AUTH === 'true') return children;

  // ยังไม่ login → redirect ไป /login พร้อม redirectTo
  if (!user) {
    const redirectTo = encodeURIComponent(location.pathname + (location.search || ''));
    return <Navigate to={`/login?redirectTo=${redirectTo}`} replace />;
  }

  // ตรวจ role-based access (ถ้ามี)
  if (roles && roles.length > 0) {
    // ใส่ logic ตรวจ role ตามโปรเจกต์
    // ถ้าไม่มีสิทธิ์ → แสดง Access Denied
  }

  return children;
}
```

## Route Config (`client/router/routes.tsx`)

```tsx
import { RouteObject } from 'react-router-dom';
import { PrivateRoute, LoginPage, TokenLogin } from '../auth';

export interface RouteConfig {
  path: string;
  element: JSX.Element;
  requiresAuth?: boolean;
  roles?: string[];
}

export function generateRoutes(): RouteObject[] {
  return [
    { path: '/login', element: <LoginPage /> },
    { path: '/token-login', element: <TokenLogin /> },
    {
      path: '/',
      element: (
        <PrivateRoute>
          <MainLayout />
        </PrivateRoute>
      ),
      children: [
        { index: true, element: <HomePage /> },
        { path: 'sample', element: <SamplePage /> },
        // เพิ่ม routes ที่นี่
      ],
    },
    { path: '*', element: <NotFound /> },
  ];
}
```

## Server Entry — ดู [06-env-and-deploy.md](06-env-and-deploy.md) สำหรับ `start.ts` และ `node-build.ts`
