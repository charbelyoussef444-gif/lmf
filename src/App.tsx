// src/App.tsx
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
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

// Mobile-replica screens (rendered at < md breakpoint only — desktop UI is untouched)
import MobileMatchesHomeScreen from "./mobile/screens/matches/MatchesHomeScreen";
import MobileConversationScreen from "./mobile/screens/matches/ConversationScreen";
import MobileMatchPhotosScreen from "./mobile/screens/matches/MatchPhotosScreen";
import MobileAssessmentHomeScreen from "./mobile/screens/assessment/AssessmentHomeScreen";
import MobileChatbotScreen from "./mobile/screens/assessment/ChatbotScreen";
import MobileProfileHomeScreen from "./mobile/screens/profile/ProfileHomeScreen";
import MobileInterestsScreen from "./mobile/screens/profile/InterestsScreen";
import MobileGalleryScreen from "./mobile/screens/profile/GalleryScreen";
import MobilePreferencesScreen from "./mobile/screens/profile/PreferencesScreen";
import MobileVerificationScreen from "./mobile/screens/profile/VerificationScreen";
import MobileLocationScreen from "./mobile/screens/profile/LocationScreen";
import MobileDeleteAccountScreen from "./mobile/screens/profile/DeleteAccountScreen";
import MobileOnboardingAgeGenderScreen from "./mobile/screens/onboarding/OnboardingAgeGenderScreen";
import MobileOnboardingLocationScreen from "./mobile/screens/onboarding/OnboardingLocationScreen";
import MobileOnboardingPreferencesScreen from "./mobile/screens/onboarding/OnboardingPreferencesScreen";

import { AuthProvider, useAuth } from "./auth/AuthProvider";
import ProtectedRoute from "./auth/ProtectedRoute";
import { ThemeProvider } from "./theme/ThemeProvider";
import { api } from "./lib/api";

// Google Web Client ID — MUST match lmm/src/config/env.ts GOOGLE_WEB_CLIENT_ID
// so web and mobile resolve to the same Supabase identity for the same Google account.
// Can be overridden via VITE_GOOGLE_WEB_CLIENT_ID env var.
const GOOGLE_WEB_CLIENT_ID =
  (import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as string | undefined) ||
  "
6780217929-luhf3mk3t9i5lkl18b70tm853i8rjlao.apps.googleusercontent.com";

function AuthedAppShell() {
  const { user, loading } = useAuth();
  // Keep useLocation subscription so the component re-renders on route changes
  // (used to be needed for the mobile gate; kept as a harmless no-op reference).
  useLocation();

  // ping last-active for logged-in users
  useEffect(() => {
    if (loading || !user) return;
    api.mePingOncePerTab().catch(() => {});
  }, [user, loading]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-300">
      <Routes>
        {/* /mobile no longer blocks — redirect to home */}
        <Route path="/mobile" element={<Navigate to="/" replace />} />

        {/* PUBLIC ROUTES */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* PROTECTED ROUTES */}
        <Route element={<ProtectedRoute />}>
          {/*
            Shared routes — mobile replica renders at < md (via md:hidden on MobileAppShell),
            existing desktop page wrapped in `hidden md:block` renders at md+. Desktop UI is
            unchanged.
          */}
          <Route
            path="/chatbot"
            element={
              <>
                <MobileAssessmentHomeScreen />
                <div className="hidden md:block">
                  <ChatbotPage />
                </div>
              </>
            }
          />
          <Route
            path="/conversations"
            element={
              <>
                <MobileMatchesHomeScreen />
                <div className="hidden md:block">
                  <ConversationsPage />
                </div>
              </>
            }
          />
          <Route
            path="/profile"
            element={
              <>
                <MobileProfileHomeScreen />
                <div className="hidden md:block">
                  <ProfilePage />
                </div>
              </>
            }
          />

          {/* Mobile-only sub-routes (no desktop equivalent) */}
          <Route path="/chatbot/session" element={<MobileChatbotScreen />} />
          <Route
            path="/conversations/:conversationId"
            element={<MobileConversationScreen />}
          />
          <Route
            path="/conversations/:conversationId/photos"
            element={<MobileMatchPhotosScreen />}
          />
          <Route
            path="/profile/interests"
            element={<MobileInterestsScreen />}
          />
          <Route path="/profile/gallery" element={<MobileGalleryScreen />} />
          <Route
            path="/profile/preferences"
            element={<MobilePreferencesScreen />}
          />
          <Route
            path="/profile/verification"
            element={<MobileVerificationScreen />}
          />
          <Route
            path="/profile/location"
            element={<MobileLocationScreen />}
          />
          <Route
            path="/profile/delete"
            element={<MobileDeleteAccountScreen />}
          />
          <Route
            path="/onboarding/age-gender"
            element={<MobileOnboardingAgeGenderScreen />}
          />
          <Route
            path="/onboarding/location"
            element={<MobileOnboardingLocationScreen />}
          />
          <Route
            path="/onboarding/preferences"
            element={<MobileOnboardingPreferencesScreen />}
          />

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
