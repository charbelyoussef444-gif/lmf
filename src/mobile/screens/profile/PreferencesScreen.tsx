// Mobile replica of /likeminded/src/screens/profile/PreferencesScreen.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, AlertCircle } from "lucide-react";
import MobileAppShell from "../../layouts/MobileAppShell";
import MobileHeader from "../../layouts/MobileHeader";
import {
  Chip,
  GradientButton,
  LoadingSpinner,
} from "../../components/Primitives";
import { api } from "../../../lib/api";

const GENDER_OPTIONS = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "everyone", label: "Everyone" },
] as const;

type PrefGender = (typeof GENDER_OPTIONS)[number]["value"];

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

export default function MobilePreferencesScreen() {
  const navigate = useNavigate();

  // Originals for dirty check
  const [origMinAge, setOrigMinAge] = useState(18);
  const [origMaxAge, setOrigMaxAge] = useState(35);
  const [origGender, setOrigGender] = useState<PrefGender | null>(null);
  const [origDistance, setOrigDistance] = useState(75);

  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(35);
  const [prefGender, setPrefGender] = useState<PrefGender | null>(null);
  const [maxDistance, setMaxDistance] = useState(75);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then((p) => {
        if (cancelled || !p) return;
        const mi = p.preferred_min_age ?? 18;
        const ma = p.preferred_max_age ?? 35;
        const dist = p.preferred_max_distance_km ?? 75;
        const g = (p.preferred_gender as PrefGender | null) ?? null;
        setMinAge(mi);
        setMaxAge(ma);
        setMaxDistance(dist);
        setPrefGender(g);
        setOrigMinAge(mi);
        setOrigMaxAge(ma);
        setOrigDistance(dist);
        setOrigGender(g);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const hasChanges = useMemo(
    () =>
      minAge !== origMinAge ||
      maxAge !== origMaxAge ||
      prefGender !== origGender ||
      maxDistance !== origDistance,
    [
      minAge,
      maxAge,
      prefGender,
      maxDistance,
      origMinAge,
      origMaxAge,
      origGender,
      origDistance,
    ]
  );

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 2200);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateMatchPreferences({
        preferred_min_age: minAge,
        preferred_max_age: maxAge,
        preferred_gender: prefGender,
        preferred_max_distance_km: maxDistance,
      });
      setOrigMinAge(minAge);
      setOrigMaxAge(maxAge);
      setOrigGender(prefGender);
      setOrigDistance(maxDistance);
      showToast("success", "Preferences saved successfully");
    } catch {
      showToast("error", "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MobileAppShell bare className="md:hidden">
        <MobileHeader title="Preferences" onBack={() => navigate(-1)} />
        <LoadingSpinner fullScreen />
      </MobileAppShell>
    );
  }

  return (
    <MobileAppShell bare className="md:hidden">
      <MobileHeader title="Preferences" onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Age Range */}
        <div
          className="m-section-title"
          style={{ marginTop: 20, marginBottom: 8, paddingLeft: 4 }}
        >
          AGE RANGE
        </div>
        <div
          className="rounded-[12px] p-4"
          style={{
            background: "var(--m-surface)",
            border: "1px solid var(--m-border-glass)",
          }}
        >
          <div
            className="m-title2 text-center"
            style={{ color: "var(--m-text-primary)", marginBottom: 12 }}
          >
            {minAge} — {maxAge}
          </div>
          <DualRangeSlider
            min={18}
            max={99}
            minValue={minAge}
            maxValue={maxAge}
            onChange={([mi, ma]) => {
              setMinAge(mi);
              setMaxAge(ma);
            }}
          />
          <div className="flex justify-between mt-1">
            <span
              className="m-caption1"
              style={{ color: "var(--m-text-tertiary)" }}
            >
              18
            </span>
            <span
              className="m-caption1"
              style={{ color: "var(--m-text-tertiary)" }}
            >
              99
            </span>
          </div>
        </div>

        {/* Gender */}
        <div
          className="m-section-title"
          style={{ marginTop: 20, marginBottom: 8, paddingLeft: 4 }}
        >
          INTERESTED IN
        </div>
        <div
          className="rounded-[12px] p-4"
          style={{
            background: "var(--m-surface)",
            border: "1px solid var(--m-border-glass)",
          }}
        >
          <div className="flex flex-wrap gap-2">
            {GENDER_OPTIONS.map((g) => (
              <Chip
                key={g.value}
                label={g.label}
                selected={prefGender === g.value}
                onClick={() => setPrefGender(g.value)}
              />
            ))}
          </div>
        </div>

        {/* Distance */}
        <div
          className="m-section-title"
          style={{ marginTop: 20, marginBottom: 8, paddingLeft: 4 }}
        >
          MAXIMUM DISTANCE
        </div>
        <div
          className="rounded-[12px] p-4"
          style={{
            background: "var(--m-surface)",
            border: "1px solid var(--m-border-glass)",
          }}
        >
          <div
            className="m-title2 text-center"
            style={{ color: "var(--m-text-primary)", marginBottom: 12 }}
          >
            {maxDistance} km
          </div>
          <SingleSlider
            min={5}
            max={200}
            step={5}
            value={maxDistance}
            onChange={setMaxDistance}
          />
          <div className="flex justify-between mt-1">
            <span
              className="m-caption1"
              style={{ color: "var(--m-text-tertiary)" }}
            >
              5 km
            </span>
            <span
              className="m-caption1"
              style={{ color: "var(--m-text-tertiary)" }}
            >
              200 km
            </span>
          </div>
        </div>

        <div className="mt-6">
          <GradientButton
            title="Save Preferences"
            onClick={handleSave}
            loading={saving}
            disabled={!hasChanges}
          />
        </div>
      </div>

      {toast ? (
        <div
          className="fixed left-4 right-4 flex items-center gap-2 rounded-[12px] px-4 py-3"
          style={{
            bottom: "calc(90px + env(safe-area-inset-bottom, 0))",
            background:
              toast.type === "success" ? "var(--m-success)" : "var(--m-error)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            zIndex: 50,
          }}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={20} color="#fff" />
          ) : (
            <AlertCircle size={20} color="#fff" />
          )}
          <span
            className="m-subhead"
            style={{ color: "#fff", fontWeight: 600, flex: 1 }}
          >
            {toast.text}
          </span>
        </div>
      ) : null}
    </MobileAppShell>
  );
}
