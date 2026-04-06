// src/App.tsx
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useEffect, useMemo } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

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

// Google Web Client ID — MUST match lmm/src/config/env.ts GOOGLE_WEB_CLIENT_ID
// so web and mobile resolve to the same Supabase identity for the same Google account.
// Can be overridden via VITE_GOOGLE_WEB_CLIENT_ID env var.
const GOOGLE_WEB_CLIENT_ID =
  (import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as string | undefined) ||
  "6780217929-luhf3mk3t9i5lkl18b70tm853i8rjlao.apps.googleusercontent.com";

function AuthedAppShell() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // ping last-active for logged-in users
  useEffect(() => {
    if (loading || !user) return;
    api.mePingOncePerTab().catch(() => {});
  }, [user, loading]);

  // normalize path (remove trailing slash)
  const path = useMemo(
    () => location.pathname.replace(/\/+$/, "") || "/",
    [location.pathname]
  );

  // detect mobile (basic UA check)
  const isMobile =
    typeof window !== "undefined" &&
    /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
      navigator.userAgent
    );

  /**
   * ✅ MOBILE RULES:
   * Only allow admin + sign-in related routes on mobile.
   * Everything else -> /mobile
   */
  const mobileAllowed =
    path === "/mobile" ||
    path === "/login" ||
    path === "/auth/callback" ||
    path === "/reset-password" ||
    path === "/admin" ||
    path.startsWith("/admin/");

  // only enforce mobile gate after initial render (avoid weird early redirects)
  if (isMobile && !mobileAllowed) {
    return <Navigate to="/mobile" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-300">
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
  return (
    <GoogleOAuthProvider clientId={GOOGLE_WEB_CLIENT_ID}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <AuthedAppShell />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
