// Mobile replica of /likeminded/src/screens/auth/WelcomeScreen.tsx

import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Lightbulb, MessageCircle, Heart } from "lucide-react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { supabase } from "../../../lib/supabaseClient";
import { api } from "../../../lib/api";
import MobileAppShell from "../../layouts/MobileAppShell";
import logoMark from "../../../assets/likeminded-mark.png";

function FeatureItem({
  iconBg,
  iconColor,
  icon,
  text,
}: {
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div
      className="flex items-center rounded-[12px] border py-3 px-4 gap-3"
      style={{
        backgroundColor: "var(--m-surface)",
        borderColor: "var(--m-border-glass)",
      }}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <span className="m-body font-medium text-[color:var(--m-text-primary)] flex-1">
        {text}
      </span>
    </div>
  );
}

export default function MobileWelcomeScreen() {
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);

  // Google Sign-In via GIS postMessage + signInWithIdToken — same flow as
  // LoginScreen. Avoids the redirect_uri_mismatch that the legacy
  // supabase.auth.signInWithOAuth flow produces in dev / preview.
  async function onGoogleSuccess(resp: CredentialResponse) {
    const idToken = resp.credential;
    if (!idToken) return;
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });
      if (error) throw error;
      // Route by whether onboarding is complete — RootNavigator equivalent.
      try {
        const me = await api.me();
        if (!me?.age || me.age < 18 || me.age > 99) {
          navigate("/onboarding/age-gender", { replace: true });
        } else {
          navigate("/conversations", { replace: true });
        }
      } catch {
        navigate("/conversations", { replace: true });
      }
    } catch (e: any) {
      alert(e?.message || "Could not sign in with Google.");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <MobileAppShell bare className="md:hidden">
      <div className="flex flex-1 flex-col px-5 pb-4 pt-[env(safe-area-inset-top,8px)]">
        {/* Top content */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="flex flex-col items-center mb-3">
            <img
              src={logoMark}
              alt="LikeMinded"
              className="h-28 w-28 object-contain mb-1"
            />
            <div
              className="tracking-wide"
              style={{
                fontSize: 42,
                fontWeight: 300,
                color: "var(--m-text-primary)",
                letterSpacing: 0.5,
              }}
            >
              <span style={{ fontWeight: 300 }}>Like</span>
              <span style={{ fontWeight: 800 }}>Minded</span>
            </div>
          </div>

          <p
            className="m-title3 text-center"
            style={{
              color: "var(--m-text-secondary)",
              fontWeight: 400,
              marginBottom: 32,
            }}
          >
            Connect through personality,
            <br />
            not just profiles
          </p>

          <div className="flex flex-col gap-3 self-stretch">
            <FeatureItem
              iconBg="var(--m-primary-muted)"
              iconColor="var(--m-primary)"
              icon={<Lightbulb size={22} />}
              text="Personality-based matching"
            />
            <FeatureItem
              iconBg="var(--m-secondary-muted)"
              iconColor="var(--m-secondary)"
              icon={<MessageCircle size={22} />}
              text="Meaningful conversations"
            />
            <FeatureItem
              iconBg="var(--m-accent-muted)"
              iconColor="var(--m-accent)"
              icon={<Heart size={22} />}
              text="Deeper connections"
            />
          </div>
        </div>

        {/* Bottom buttons */}
        <div className="flex flex-col gap-3 pb-2">
          <button
            className="m-btn-solid"
            onClick={() => navigate("/login?mode=register")}
          >
            Create Account
          </button>

          <div
            className="flex justify-center"
            style={{
              opacity: googleLoading ? 0.6 : 1,
              pointerEvents: googleLoading ? "none" : "auto",
            }}
          >
            <GoogleLogin
              onSuccess={onGoogleSuccess}
              onError={() => alert("Could not sign in with Google.")}
              useOneTap={false}
              theme="outline"
              size="large"
              text="continue_with"
              shape="pill"
              width="320"
            />
          </div>

          <button
            className="m-header-btn min-h-[44px] w-full text-center bg-transparent border-0"
            onClick={() => navigate("/login")}
            style={{ color: "var(--m-text-tertiary)" }}
          >
            <span className="m-body">
              Already have an account?{" "}
              <span
                style={{
                  fontWeight: 700,
                  color: "var(--m-text-secondary)",
                }}
              >
                Sign In
              </span>
            </span>
          </button>
        </div>
      </div>
    </MobileAppShell>
  );
}
