// Mobile replica of /likeminded/src/screens/auth/LoginScreen.tsx

import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import MobileAppShell from "../../layouts/MobileAppShell";
import MobileHeader from "../../layouts/MobileHeader";
import { Input, GradientButton } from "../../components/Primitives";
import { supabase } from "../../../lib/supabaseClient";

export default function MobileLoginScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialMode = params.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState<"login" | "register">(initialMode);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    fullName?: string;
  }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (mode === "register" && !fullName.trim())
      e.fullName = "Full name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    else if (mode === "register" && password.length < 6)
      e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (error) throw error;
        alert("Check your email to verify your account.");
      }
    } catch (e: any) {
      alert(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileAppShell bare className="md:hidden">
      <MobileHeader title="" onBack={() => navigate("/")} />

      <div className="flex flex-1 flex-col px-5 pb-6">
        <h1
          className="m-large-title"
          style={{ color: "var(--m-text-primary)", marginBottom: 4 }}
        >
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </h1>
        <p
          className="m-body"
          style={{ color: "var(--m-text-secondary)", marginBottom: 24 }}
        >
          {mode === "login"
            ? "Sign in to continue"
            : "Sign up to start matching"}
        </p>

        <div
          className="rounded-[12px] border p-4"
          style={{
            backgroundColor: "var(--m-surface)",
            borderColor: "var(--m-border-glass)",
          }}
        >
          {mode === "register" ? (
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              error={errors.fullName}
            />
          ) : null}

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
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            error={errors.password}
          />

          {mode === "login" ? (
            <div className="flex justify-end -mt-2">
              <Link
                to="/reset-password"
                className="m-subhead"
                style={{ color: "var(--m-text-link)", fontWeight: 600 }}
              >
                Forgot Password?
              </Link>
            </div>
          ) : null}
        </div>

        <GradientButton
          title={mode === "login" ? "Sign In" : "Create Account"}
          onClick={onSubmit}
          loading={loading}
          disabled={!email || !password || (mode === "register" && !fullName)}
          className="mt-6"
        />

        <div className="flex items-center justify-center gap-1 py-6">
          <span className="m-body" style={{ color: "var(--m-text-secondary)" }}>
            {mode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}
          </span>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setErrors({});
            }}
            className="m-body bg-transparent border-0 cursor-pointer"
            style={{
              color: "var(--m-primary)",
              fontWeight: 600,
            }}
          >
            {mode === "login" ? "Create Account" : "Sign In"}
          </button>
        </div>
      </div>
    </MobileAppShell>
  );
}
