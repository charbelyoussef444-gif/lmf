// Mobile replica of /likeminded/src/screens/auth/WelcomeScreen.tsx

import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Lightbulb, MessageCircle, Heart } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
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

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/auth/callback" },
      });
    } catch (e: any) {
      const msg = String(e?.message || "");
      const cancelled =
        msg.includes("cancel") || e?.code === "SIGN_IN_CANCELLED";
      if (!cancelled) {
        alert("Sign in failed: " + (msg || "Try again"));
      }
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

          <button
            className="m-btn-ghost"
            onClick={handleGoogle}
            disabled={googleLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1S8.7 6 12 6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.5 14.7 2.6 12 2.6 6.8 2.6 2.6 6.8 2.6 12S6.8 21.4 12 21.4c6.9 0 9.5-4.8 9.5-7.4 0-.5-.1-.9-.1-1.3H12z"
              />
            </svg>
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </button>

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
