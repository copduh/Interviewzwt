import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import apiClient from "@/integrations/api/client";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Interview from "./pages/Interview";
import VoiceInterview from "./pages/VoiceInterview";
import Feedback from "./pages/Feedback";
import CustomJob from "./pages/CustomJob";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const { user } = await apiClient.me();
        if (mounted) setUser(user);
      } catch (error) {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    check();
    const handleAuthChange = () => {
      // Re-check current user when auth status changes
      check();
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => { 
      mounted = false;
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Index />} />
            <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <Auth />} />
            <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/auth" />} />
            <Route path="/interview/:jobRoleId" element={user ? <Interview /> : <Navigate to="/auth" />} />
            <Route path="/voice-interview/:sessionId" element={user ? <VoiceInterview /> : <Navigate to="/auth" />} />
            <Route path="/feedback/:sessionId" element={user ? <Feedback /> : <Navigate to="/auth" />} />
            <Route path="/custom-job" element={user ? <CustomJob /> : <Navigate to="/auth" />} />
            <Route path="/pricing" element={user ? <Pricing /> : <Navigate to="/auth" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

export default App;
