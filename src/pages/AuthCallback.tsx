// src/pages/AuthCallback.tsx
import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { api } from "../lib/api";

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const code = params.get("code");

      // 1) Finalize Supabase session from OAuth code
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          return navigate("/login?error=callback", { replace: true });
        }
      } else {
        await new Promise((r) => setTimeout(r, 150));
      }

      // 2) Where did we intend to send the user after login?
      // ✅ default is Landing
      const redirectTo = sessionStorage.getItem("post_login_redirect") || "/";
      sessionStorage.removeItem("post_login_redirect");

      // 3) Check if this is a "new" user who still needs onboarding
      let needsOnboarding = false;
      try {
        const me = await api.me();

        // Signup onboarding always sets a valid age.
        // If age is missing or clearly invalid, treat as not onboarded.
        if (!me.age || me.age < 18 || me.age > 99) {
          needsOnboarding = true;
        }
      } catch (err) {
        console.error("Failed to load profile after auth callback", err);
      }

      // 4) Route based on onboarding status
      if (needsOnboarding) {
        // Send them through LoginPage's onboarding phase
        navigate("/login", {
          replace: true,
          state: {
            onboarding: true,
            from: { pathname: redirectTo },
          },
        });
      } else {
        navigate(redirectTo, { replace: true });
      }
    })();
  }, [params, navigate]);

  return (
    <div className="min-h-screen grid place-items-center text-gray-600">
      <Loader2 className="h-5 w-5 animate-spin" /> Finalizing sign-in…
    </div>
  );
}