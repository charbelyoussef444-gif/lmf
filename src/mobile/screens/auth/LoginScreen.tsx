// Mobile replica of /likeminded/src/screens/auth/LoginScreen.tsx +
// RegisterScreen.tsx + EmailVerificationScreen.tsx — unified into one
// screen (auth form → optional OTP verify phase), mirroring the native app.

import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail } from "lucide-react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import MobileAppShell from "../../layouts/MobileAppShell";
import MobileHeader from "../../layouts/MobileHeader";
import {
  Input,
  GradientButton,
  ProgressBar,
} from "../../components/Primitives";
import { supabase } from "../../../lib/supabaseClient";
import { api } from "../../../lib/api";

const LOCKED_COUNTRY = "Lebanon";
const ONBOARDING_FLAG_KEY = "lmf_onboarding_active_v1";

type Phase = "form" | "verify";

export default function MobileLoginScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialMode = params.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState<"login" | "register">(initialMode);

  // Shared form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Register multi-step: 0=name, 1=email, 2=password
  const [step, setStep] = useState(0);

  // Email verification phase (after signUp)
  const [phase, setPhase] = useState<Phase>("form");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState("");
  const [verifyEmail, setVerifyEmail] = useState("");
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const totalSteps = 3;
  const stepTitles = [
    "What's your name?",
    "What's your email?",
    "Create a password",
  ];
  const stepSubtitles = [
    "This is how you'll appear to your matches",
    "We'll use this to sign you in",
    "Must be at least 8 characters",
  ];

  const clearMsgs = () => {
    setErrors({});
    setResendNotice("");
  };

  const validateLogin = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep = () => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!fullName.trim()) e.fullName = "Name is required";
      else if (fullName.trim().length < 2)
        e.fullName = "Name must be at least 2 characters";
    } else if (step === 1) {
      if (!email.trim()) e.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    } else if (step === 2) {
      if (!password) e.password = "Password is required";
      else if (password.length < 8)
        e.password = "Password must be at least 8 characters";
      if (password !== confirmPassword)
        e.confirmPassword = "Passwords do not match";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /** After successful auth: check profile and route to onboarding or main. */
  const postAuthRedirect = async () => {
    try {
      const me = await api.me();
      if (!me?.age || me.age < 18 || me.age > 99) {
        sessionStorage.setItem(ONBOARDING_FLAG_KEY, "1");
        navigate("/onboarding/age-gender", { replace: true });
      } else {
        navigate("/conversations", { replace: true });
      }
    } catch {
      sessionStorage.setItem(ONBOARDING_FLAG_KEY, "1");
      navigate("/onboarding/age-gender", { replace: true });
    }
  };

  const onLogin = async () => {
    if (!validateLogin()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      await postAuthRedirect();
    } catch (e: any) {
      alert(e?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const onRegisterNext = async () => {
    if (!validateStep()) return;
    if (step < totalSteps - 1) {
      setStep(step + 1);
      clearMsgs();
      return;
    }
    // Final step — create account + kick off email OTP
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            full_name: fullName.trim(),
            country: LOCKED_COUNTRY,
          },
        },
      });
      if (error) throw error;

      if (!data.session) {
        // Supabase is configured for 6-digit OTP via custom SMTP — go to verify
        setVerifyEmail(email.trim());
        setOtp(["", "", "", "", "", ""]);
        setPhase("verify");
      } else {
        // Auto-confirm path (rare)
        await postAuthRedirect();
      }
    } catch (e: any) {
      const msg = (e?.message || "").toLowerCase();
      if (
        msg.includes("already registered") ||
        msg.includes("already been registered")
      ) {
        setErrors({
          email: "This email is already registered. Try signing in.",
        });
        setStep(1);
      } else {
        alert(e?.message || "Sign up failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async () => {
    const token = otp.join("");
    if (token.length !== 6) {
      setErrors({ otp: "Enter the 6-digit code." });
      return;
    }
    setVerifying(true);
    clearMsgs();
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: verifyEmail,
        token,
        type: "signup",
      });
      if (error) throw error;
      await postAuthRedirect();
    } catch (e: any) {
      setErrors({ otp: e?.message || "Invalid code. Please try again." });
    } finally {
      setVerifying(false);
    }
  };

  const onResendOtp = async () => {
    setResending(true);
    clearMsgs();
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: verifyEmail,
      });
      if (error) throw error;
      setResendNotice("A new code has been sent to your email.");
    } catch (e: any) {
      setErrors({ otp: e?.message || "Failed to resend." });
    } finally {
      setResending(false);
    }
  };

  // Google sign-in (GIS postMessage → signInWithIdToken). Avoids the redirect-URI
  // flow used by supabase.auth.signInWithOAuth that caused redirect_uri_mismatch.
  const onGoogleSuccess = async (resp: CredentialResponse) => {
    const idToken = resp.credential;
    if (!idToken) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });
      if (error) throw error;
      await postAuthRedirect();
    } catch (e: any) {
      alert(e?.message || "Could not sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  // OTP helpers
  const handleOtpChange = (i: number, val: string) => {
    if (val.length > 1) {
      const digits = val.replace(/\D/g, "").slice(0, 6).split("");
      const next = [...otp];
      digits.forEach((d, idx) => {
        if (i + idx < 6) next[i + idx] = d;
      });
      setOtp(next);
      otpRefs.current[Math.min(i + digits.length, 5)]?.focus();
      return;
    }
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (
    i: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
      const next = [...otp];
      next[i - 1] = "";
      setOtp(next);
    }
  };

  useEffect(() => {
    if (phase === "verify") {
      const t = setTimeout(() => otpRefs.current[0]?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const goBack = () => {
    if (phase === "verify") {
      setPhase("form");
      return;
    }
    if (mode === "register" && step > 0) {
      setStep(step - 1);
      clearMsgs();
      return;
    }
    navigate("/");
  };

  // ── Verify phase ───────────────────────────────────────────────────
  if (phase === "verify") {
    return (
      <MobileAppShell bare className="md:hidden">
        <MobileHeader title="" onBack={goBack} />
        <div className="flex flex-1 flex-col px-5 pb-6">
          <div className="flex justify-center mt-2 mb-4">
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 72,
                height: 72,
                background: "var(--m-primary-muted)",
              }}
            >
              <Mail size={32} color="var(--m-primary)" />
            </div>
          </div>
          <h1
            className="m-large-title text-center mb-1"
            style={{ color: "var(--m-text-primary)" }}
          >
            Verify Your Email
          </h1>
          <p
            className="m-body text-center mb-8"
            style={{ color: "var(--m-text-secondary)" }}
          >
            We sent a 6-digit code to
            <br />
            <span style={{ color: "var(--m-primary)", fontWeight: 600 }}>
              {verifyEmail}
            </span>
          </p>

          <div className="flex justify-center gap-2 mb-3">
            {otp.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  otpRefs.current[i] = el;
                }}
                value={d}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                inputMode="numeric"
                maxLength={1}
                className="text-center outline-none"
                style={{
                  width: 48,
                  height: 56,
                  borderRadius: 10,
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--m-text-primary)",
                  background: d
                    ? "var(--m-primary-muted)"
                    : "var(--m-surface)",
                  border: d
                    ? "1.5px solid var(--m-primary)"
                    : "1.5px solid var(--m-border-glass)",
                }}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          {errors.otp ? (
            <p
              className="m-footnote text-center"
              style={{ color: "var(--m-error)" }}
            >
              {errors.otp}
            </p>
          ) : null}
          {resendNotice ? (
            <p
              className="m-footnote text-center"
              style={{ color: "var(--m-success)" }}
            >
              {resendNotice}
            </p>
          ) : null}

          <GradientButton
            title="Verify Email"
            onClick={onVerifyOtp}
            loading={verifying}
            disabled={otp.join("").length !== 6}
            className="mt-4"
          />

          <button
            type="button"
            onClick={onResendOtp}
            disabled={resending}
            className="m-subhead bg-transparent border-0 mt-4 py-3"
            style={{ color: "var(--m-text-link)", cursor: "pointer" }}
          >
            {resending ? "Sending..." : "Didn't receive the code? Resend"}
          </button>
        </div>
      </MobileAppShell>
    );
  }

  // ── Register multi-step ────────────────────────────────────────────
  if (mode === "register") {
    const progress = (step + 1) / totalSteps;
    return (
      <MobileAppShell bare className="md:hidden">
        <MobileHeader title="" onBack={goBack} />
        <div className="flex flex-1 flex-col px-5 pb-6">
          <div
            className="m-footnote mb-2"
            style={{ color: "var(--m-text-tertiary)" }}
          >
            Step {step + 1} of {totalSteps}
          </div>
          <ProgressBar progress={progress} className="mb-6" />

          <h1
            className="m-large-title"
            style={{ color: "var(--m-text-primary)", marginBottom: 4 }}
          >
            {stepTitles[step]}
          </h1>
          <p
            className="m-body"
            style={{ color: "var(--m-text-secondary)", marginBottom: 20 }}
          >
            {stepSubtitles[step]}
          </p>

          <div
            className="rounded-[12px] border p-4"
            style={{
              backgroundColor: "var(--m-surface)",
              borderColor: "var(--m-border-glass)",
            }}
          >
            {step === 0 ? (
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                autoComplete="name"
                autoFocus
                error={errors.fullName}
              />
            ) : null}
            {step === 1 ? (
              <Input
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                type="email"
                autoComplete="email"
                autoFocus
                error={errors.email}
              />
            ) : null}
            {step === 2 ? (
              <>
                <Input
                  label="Password"
                  isPassword
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  error={errors.password}
                />
                <Input
                  label="Confirm Password"
                  isPassword
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  error={errors.confirmPassword}
                />
              </>
            ) : null}
          </div>

          <GradientButton
            title={step === totalSteps - 1 ? "Create Account" : "Continue"}
            onClick={onRegisterNext}
            loading={loading}
            className="mt-6"
          />

          {step === 0 ? (
            <div className="flex items-center justify-center gap-1 py-5">
              <span
                className="m-body"
                style={{ color: "var(--m-text-secondary)" }}
              >
                Already have an account?
              </span>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setStep(0);
                  clearMsgs();
                }}
                className="m-body bg-transparent border-0 cursor-pointer"
                style={{ color: "var(--m-primary)", fontWeight: 600 }}
              >
                Sign In
              </button>
            </div>
          ) : null}
        </div>
      </MobileAppShell>
    );
  }

  // ── Login ──────────────────────────────────────────────────────────
  return (
    <MobileAppShell bare className="md:hidden">
      <MobileHeader title="" onBack={() => navigate("/")} />
      <div className="flex flex-1 flex-col px-5 pb-6">
        <h1
          className="m-large-title"
          style={{ color: "var(--m-text-primary)", marginBottom: 4 }}
        >
          Welcome Back
        </h1>
        <p
          className="m-body"
          style={{ color: "var(--m-text-secondary)", marginBottom: 24 }}
        >
          Sign in to continue
        </p>

        <div
          className="rounded-[12px] border p-4"
          style={{
            backgroundColor: "var(--m-surface)",
            borderColor: "var(--m-border-glass)",
          }}
        >
          <Input
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            type="email"
            autoComplete="email"
            error={errors.email}
          />
          <Input
            label="Password"
            isPassword
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            error={errors.password}
          />
          <div className="flex justify-end -mt-2">
            <button
              type="button"
              onClick={() => navigate("/reset-password")}
              className="m-subhead bg-transparent border-0 cursor-pointer"
              style={{ color: "var(--m-text-link)", fontWeight: 600 }}
            >
              Forgot Password?
            </button>
          </div>
        </div>

        <GradientButton
          title="Sign In"
          onClick={onLogin}
          loading={loading}
          disabled={!email || !password}
          className="mt-6"
        />

        <div className="flex items-center gap-3 my-5">
          <div
            className="flex-1"
            style={{ height: 1, background: "var(--m-separator-light)" }}
          />
          <span
            className="m-footnote"
            style={{ color: "var(--m-text-tertiary)" }}
          >
            or continue with
          </span>
          <div
            className="flex-1"
            style={{ height: 1, background: "var(--m-separator-light)" }}
          />
        </div>

        <div className="flex justify-center">
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

        <div className="flex items-center justify-center gap-1 py-5">
          <span className="m-body" style={{ color: "var(--m-text-secondary)" }}>
            Don't have an account?
          </span>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setStep(0);
              clearMsgs();
            }}
            className="m-body bg-transparent border-0 cursor-pointer"
            style={{ color: "var(--m-primary)", fontWeight: 600 }}
          >
            Create Account
          </button>
        </div>
      </div>
    </MobileAppShell>
  );
}
