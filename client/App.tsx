import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from "@/auth";
import { ThemeProvider } from "@/theme";
import { LayoutProvider } from "@/contexts/LayoutContext";
import { queryClient } from "@/tanstackQuery";
import { generateRoutes } from "./router/routes";
import "./global.css";

const router = createBrowserRouter(generateRoutes());

function App() {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <LayoutProvider>
              <TooltipProvider>
                <RouterProvider router={router} />
              </TooltipProvider>
            </LayoutProvider>
          </ThemeProvider>
          <Toaster />
          <Sonner />
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
