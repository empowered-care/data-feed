import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/DashboardLayout";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import ProcessReport from "@/pages/ProcessReport";
import QueryPage from "@/pages/QueryPage";
import AlertsPage from "@/pages/AlertsPage";
import SummaryPage from "@/pages/SummaryPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";
import { useEffect } from "react";
import { useAppStore } from "@/store/appStore";

const queryClient = new QueryClient();

function DarkModeInit() {
  const darkMode = useAppStore((s) => s.darkMode);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DarkModeInit />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/process" element={<ProcessReport />} />
            <Route path="/query" element={<QueryPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/summary" element={<SummaryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
