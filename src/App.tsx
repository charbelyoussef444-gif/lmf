// src/App.tsx
import {
  BrowserRouter,
  HashRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";

import LandingPage from "./pages/LandingPage";
import ChatbotPage from "./pages/ChatbotPage";
import ConversationsPage from "./pages/ConversationsPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import AuthCallback from "./pages/AuthCallback";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AdminPage from "./pages/Admin";
import AdminUserJourneyPage from "./pages/AdminUserJourneyPage";
import MobileOnlyPage from "./pages/MobileOnlyPage";

import { AuthProvider, useAuth } from "./auth/AuthProvider";
import ProtectedRoute from "./auth/ProtectedRoute";
import { ThemeProvider } from "./theme/ThemeProvider";
import { api } from "./lib/api";
import { hasSupabaseConfig } from "./lib/supabaseClient";

function AuthedAppShell() {
  const { user, loading } = useAuth();

  // ping last-active for logged-in users
  useEffect(() => {
    if (loading || !user) return;
    api.mePingOncePerTab().catch(() => {});
  }, [user, loading]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-300">
      {!hasSupabaseConfig && (
        <div className="mx-auto max-w-5xl px-4 pt-4">
          <div className="rounded-xl border border-amber-300 bg-amber-100 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-100">
            Mobile preview is running without Supabase keys. Add
            <code className="mx-1 font-mono">VITE_SUPABASE_URL</code> and
            <code className="mx-1 font-mono">VITE_SUPABASE_ANON_KEY</code>
            to enable authentication.
          </div>
        </div>
      )}
      <Routes>
        {/* MOBILE PAGE */}
        <Route path="/mobile" element={<MobileOnlyPage />} />

        {/* PUBLIC ROUTES */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* PROTECTED ROUTES */}
        <Route element={<ProtectedRoute />}>
          <Route path="/chatbot" element={<ChatbotPage />} />
          <Route path="/conversations" element={<ConversationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* ADMIN */}
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/users/:id" element={<AdminUserJourneyPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  const isNativeCapacitorRuntime =
    typeof window !== "undefined" &&
    !!(window as Window & { Capacitor?: unknown }).Capacitor;

  const Router = isNativeCapacitorRuntime ? HashRouter : BrowserRouter;

  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AuthedAppShell />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}
