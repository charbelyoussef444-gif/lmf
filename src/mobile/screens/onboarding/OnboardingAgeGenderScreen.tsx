// Mobile replica of /likeminded/src/screens/onboarding/OnboardingAgeGender.tsx
// Step 1 of 3 onboarding flow.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Users, UserSquare2 } from "lucide-react";
import MobileAppShell from "../../layouts/MobileAppShell";
import { GradientButton, ProgressBar } from "../../components/Primitives";

const GENDERS = [
  { value: "man", label: "Man", Icon: User },
  { value: "woman", label: "Woman", Icon: Users },
  { value: "non_binary", label: "Non Binary", Icon: UserSquare2 },
] as const;

type Gender = (typeof GENDERS)[number]["value"];

export default function MobileOnboardingAgeGenderScreen() {
  const navigate = useNavigate();
  const [ageText, setAgeText] = useState(
    sessionStorage.getItem("mob_onb_age") || ""
  );
  const [gender, setGender] = useState<Gender | "">(
    (sessionStorage.getItem("mob_onb_gender") as Gender | null) || ""
  );
  const [error, setError] = useState("");

  const handleAgeChange = (v: string) => {
    const cleaned = v.replace(/[^0-9]/g, "").slice(0, 2);
    setAgeText(cleaned);
    setError("");
  };

  const handleNext = () => {
    const num = parseInt(ageText, 10);
    if (!ageText || Number.isNaN(num)) {
      setError("Please enter your age");
      return;
    }
    if (num < 18) {
      setError("You must be at least 18 years old");
      return;
    }
    if (num > 99) {
      setError("Please enter a valid age");
      return;
    }
    if (!gender) {
      setError("Please select your gender");
      return;
    }
    sessionStorage.setItem("mob_onb_age", String(num));
    sessionStorage.setItem("mob_onb_gender", gender);
    navigate("/onboarding/location");
  };

  return (
    <MobileAppShell bare className="md:hidden">
      <div className="flex flex-1 flex-col px-4 pb-4 pt-2">
        <ProgressBar progress={1 / 3} className="mt-2 mb-2" />
        <div
          className="m-footnote"
          style={{ color: "var(--m-text-tertiary)", marginBottom: 24 }}
        >
          Step 1 of 3
        </div>

        <h1
          className="m-large-title"
          style={{ color: "var(--m-text-primary)", marginBottom: 8 }}
        >
          How old are you?
        </h1>
        <p
          className="m-body"
          style={{ color: "var(--m-text-secondary)", marginBottom: 24 }}
        >
          You must be at least 18 years old
        </p>

        <div className="m-card">
          <div className="flex items-center justify-center gap-3">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={ageText}
              onChange={(e) => handleAgeChange(e.target.value)}
              placeholder="25"
              maxLength={2}
              className="m-large-title bg-transparent border-0 border-b-2 outline-none text-center"
              style={{
                width: 80,
                color: "var(--m-text-primary)",
                borderColor: "var(--m-separator-light)",
                padding: "8px 0",
              }}
              aria-label="Enter your age"
            />
            <span
              className="m-body"
              style={{ color: "var(--m-text-secondary)" }}
            >
              years old
            </span>
          </div>
          <div
            className="m-footnote text-center"
            style={{ color: "var(--m-text-tertiary)", marginTop: 8 }}
          >
            Enter a number between 18 and 99
          </div>
        </div>

        <h2
          className="m-title2"
          style={{
            color: "var(--m-text-primary)",
            marginTop: 24,
            marginBottom: 16,
          }}
        >
          What's your gender?
        </h2>

        <div className="flex gap-2">
          {GENDERS.map((g) => {
            const isSelected = gender === g.value;
            const Icon = g.Icon;
            return (
              <button
                key={g.value}
                type="button"
                onClick={() => {
                  setGender(g.value);
                  setError("");
                }}
                className="flex-1 flex flex-col items-center justify-center gap-2 rounded-[12px]"
                style={{
                  minHeight: 110,
                  padding: "20px 8px",
                  background: isSelected
                    ? "linear-gradient(135deg, var(--m-gradient-start), var(--m-gradient-end))"
                    : "var(--m-surface)",
                  border: isSelected
                    ? "none"
                    : "1.5px solid var(--m-border)",
                  boxShadow: isSelected
                    ? "0 4px 12px var(--m-glow-primary)"
                    : "none",
                }}
                aria-pressed={isSelected}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    background: isSelected
                      ? "rgba(255,255,255,0.2)"
                      : "var(--m-surface-secondary)",
                  }}
                >
                  <Icon
                    size={24}
                    color={
                      isSelected ? "#ffffff" : "var(--m-text-secondary)"
                    }
                  />
                </div>
                <span
                  className="m-subhead"
                  style={{
                    fontWeight: 600,
                    color: isSelected
                      ? "#ffffff"
                      : "var(--m-text-primary)",
                  }}
                >
                  {g.label}
                </span>
              </button>
            );
          })}
        </div>

        {error ? (
          <p
            className="m-footnote text-center"
            role="alert"
            style={{ color: "var(--m-error)", marginTop: 12 }}
          >
            {error}
          </p>
        ) : null}

        <div className="mt-auto pt-6">
          <GradientButton title="Continue" onClick={handleNext} />
        </div>
      </div>
    </MobileAppShell>
  );
}
