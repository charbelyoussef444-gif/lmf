import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
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

/**
 * App shell for authenticated users
 */
function AuthedAppShell() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // detect mobile device
  const isMobile =
    typeof window !== "undefined" &&
    /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
      navigator.userAgent
    );

  // ping last-active for logged-in users
  useEffect(() => {
    if (loading || !user) return;
    api.mePingOncePerTab().catch(() => {});
  }, [user, loading]);

  // redirect mobile users to mobile page
  if (isMobile && location.pathname !== "/mobile") {
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
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AuthedAppShell />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
