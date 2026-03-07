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
import LandingPage_mobile from "./pages_mobile/LandingPage_mobile";
import LoginPage_mobile from "./pages_mobile/LoginPage_mobile";
import AuthCallback_mobile from "./pages_mobile/AuthCallback_mobile";
import ResetPasswordPage_mobile from "./pages_mobile/ResetPasswordPage_mobile";
import ChatbotPage_mobile from "./pages_mobile/ChatbotPage_mobile";
import ConversationsPage_mobile from "./pages_mobile/ConversationsPage_mobile";
import ProfilePage_mobile from "./pages_mobile/ProfilePage_mobile";
import AdminPage_mobile from "./pages_mobile/AdminPage_mobile";
import AdminUserJourneyPage_mobile from "./pages_mobile/AdminUserJourneyPage_mobile";
import MobileOnlyPage_mobile from "./pages_mobile/MobileOnlyPage_mobile";

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

        {/* MOBILE-FIRST ROUTES */}
        <Route path="/m" element={<LandingPage_mobile />} />
        <Route path="/m/login" element={<LoginPage_mobile />} />
        <Route path="/m/auth/callback" element={<AuthCallback_mobile />} />
        <Route
          path="/m/reset-password"
          element={<ResetPasswordPage_mobile />}
        />
        <Route path="/m/mobile" element={<MobileOnlyPage_mobile />} />

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

          <Route path="/m/chatbot" element={<ChatbotPage_mobile />} />
          <Route path="/m/conversations" element={<ConversationsPage_mobile />} />
          <Route path="/m/profile" element={<ProfilePage_mobile />} />

          {/* ADMIN */}
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/users/:id" element={<AdminUserJourneyPage />} />
          <Route path="/m/admin" element={<AdminPage_mobile />} />
          <Route
            path="/m/admin/users/:id"
            element={<AdminUserJourneyPage_mobile />}
          />
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
