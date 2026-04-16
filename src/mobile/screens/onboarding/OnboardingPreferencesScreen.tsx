// Mobile replica of /likeminded/src/screens/onboarding/OnboardingPreferences.tsx
// Step 3 of 3 onboarding flow.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileAppShell from "../../layouts/MobileAppShell";
import { GradientButton, ProgressBar, Chip } from "../../components/Primitives";
import { api } from "../../../lib/api";

const GENDER_PREFS = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "everyone", label: "Everyone" },
] as const;

type PrefGender = (typeof GENDER_PREFS)[number]["value"];

/** Dual range slider — layered inputs so both thumbs are draggable. */
function DualRangeSlider({
  min,
  max,
  minValue,
  maxValue,
  onChange,
}: {
  min: number;
  max: number;
  minValue: number;
  maxValue: number;
  onChange: (v: [number, number]) => void;
}) {
  const pctMin = ((minValue - min) / (max - min)) * 100;
  const pctMax = ((maxValue - min) / (max - min)) * 100;
  return (
    <div className="relative h-7 w-full">
      <div
        className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full"
        style={{ backgroundColor: "var(--m-separator-light)" }}
      />
      <div
        className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full"
        style={{
          backgroundColor: "var(--m-primary)",
          left: `${pctMin}%`,
          right: `${100 - pctMax}%`,
        }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={minValue}
        onChange={(e) => {
          const v = Math.min(Number(e.target.value), maxValue - 1);
          onChange([v, maxValue]);
        }}
        className="m-range-input"
        style={{ zIndex: 2 }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={maxValue}
        onChange={(e) => {
          const v = Math.max(Number(e.target.value), minValue + 1);
          onChange([minValue, v]);
        }}
        className="m-range-input"
        style={{ zIndex: 3 }}
      />
    </div>
  );
}

function SingleSlider({
  min,
  max,
  step,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="relative h-7 w-full">
      <div
        className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full"
        style={{ backgroundColor: "var(--m-separator-light)" }}
      />
      <div
        className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full"
        style={{
          backgroundColor: "var(--m-primary)",
          width: `${pct}%`,
        }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="m-range-input"
        style={{ zIndex: 2 }}
      />
    </div>
  );
}

export default function MobileOnboardingPreferencesScreen() {
  const navigate = useNavigate();
  const [ageRange, setAgeRange] = useState<[number, number]>([22, 35]);
  const [gender, setGender] = useState<PrefGender>("everyone");
  const [distance, setDistance] = useState(50);
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    const ageNum = Number(sessionStorage.getItem("mob_onb_age"));
    const genderRaw = sessionStorage.getItem("mob_onb_gender");
    const locationId = sessionStorage.getItem("mob_onb_location_id");

    if (!ageNum || !genderRaw) {
      alert("Missing info. Please go back and complete all fields.");
      return;
    }

    setLoading(true);
    try {
      await api.completeOnboarding({
        age: ageNum,
        gender: genderRaw as "woman" | "man" | "nonbinary",
        location_id: locationId ? Number(locationId) : null,
        preferred_min_age: ageRange[0],
        preferred_max_age: ageRange[1],
        preferred_gender: gender,
        preferred_max_distance_km: distance,
      });

      // Clear temp storage
      sessionStorage.removeItem("mob_onb_age");
      sessionStorage.removeItem("mob_onb_gender");
      sessionStorage.removeItem("mob_onb_location_id");
      sessionStorage.removeItem("mob_onb_location_label");

      navigate("/conversations", { replace: true });
    } catch (e: any) {
      alert(e?.message || "Could not save preferences. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileAppShell bare className="md:hidden">
      <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-4 pt-2">
        <ProgressBar progress={1} className="mt-2 mb-2" />
        <div
          className="m-footnote"
          style={{ color: "var(--m-text-tertiary)", marginBottom: 24 }}
        >
          Step 3 of 3
        </div>

        <h1
          className="m-large-title"
          style={{ color: "var(--m-text-primary)", marginBottom: 8 }}
        >
          Your preferences
        </h1>
        <p
          className="m-body"
          style={{ color: "var(--m-text-secondary)", marginBottom: 24 }}
        >
          Tell us who you'd like to meet
        </p>

        <div
          className="m-section-title"
          style={{ marginTop: 20, marginBottom: 8, paddingLeft: 4 }}
        >
          AGE RANGE
        </div>
        <div className="m-card">
          <div
            className="m-title2 text-center"
            style={{ color: "var(--m-text-primary)", marginBottom: 12 }}
          >
            {ageRange[0]} — {ageRange[1]}
          </div>
          <DualRangeSlider
            min={18}
            max={99}
            minValue={ageRange[0]}
            maxValue={ageRange[1]}
            onChange={setAgeRange}
          />
          <div className="flex justify-between mt-1">
            <span
              className="m-footnote"
              style={{ color: "var(--m-text-tertiary)" }}
            >
              18
            </span>
            <span
              className="m-footnote"
              style={{ color: "var(--m-text-tertiary)" }}
            >
              99
            </span>
          </div>
        </div>

        <div
          className="m-section-title"
          style={{ marginTop: 20, marginBottom: 8, paddingLeft: 4 }}
        >
          INTERESTED IN
        </div>
        <div className="m-card">
          <div className="flex flex-wrap gap-2">
            {GENDER_PREFS.map((g) => (
              <Chip
                key={g.value}
                label={g.label}
                selected={gender === g.value}
                onClick={() => setGender(g.value)}
              />
            ))}
          </div>
        </div>

        <div
          className="m-section-title"
          style={{ marginTop: 20, marginBottom: 8, paddingLeft: 4 }}
        >
          MAXIMUM DISTANCE
        </div>
        <div className="m-card">
          <div
            className="m-title2 text-center"
            style={{ color: "var(--m-text-primary)", marginBottom: 12 }}
          >
            {distance} km
          </div>
          <SingleSlider
            min={5}
            max={200}
            step={5}
            value={distance}
            onChange={setDistance}
          />
          <div className="flex justify-between mt-1">
            <span
              className="m-footnote"
              style={{ color: "var(--m-text-tertiary)" }}
            >
              5 km
            </span>
            <span
              className="m-footnote"
              style={{ color: "var(--m-text-tertiary)" }}
            >
              200 km
            </span>
          </div>
        </div>

        <div className="mt-6 pb-2">
          <GradientButton
            title="Get Started"
            onClick={handleComplete}
            loading={loading}
          />
        </div>
      </div>
    </MobileAppShell>
  );
}
