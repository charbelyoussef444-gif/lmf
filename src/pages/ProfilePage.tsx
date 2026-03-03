// src/pages/ProfilePage.tsx
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type MutableRefObject,
} from "react";
import {
  Loader2,
  Sparkles,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  Heart,
  ListChecks,
  ShieldAlert,
  Image as ImageIcon,
  XCircle,
  Check,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, type ProfileResponse } from "../lib/api";

import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";

type GenderPreference = "women" | "men" | "everyone";

type Profile = {
  id: string;
  full_name: string;
  gender?: string | null;
  age?: number | null;

  // this page displays a single string
  location?: string | null;

  personality_weight: number;
  interests_weight: number;
  verified: boolean;
  is_admin?: boolean;
  admin?: boolean;

  preferred_min_age?: number | null;
  preferred_max_age?: number | null;
  preferred_gender?: GenderPreference | null;

  preferred_max_distance_km?: number | null;
};

type Interest = { id: number; name: string; category?: string | null };

type AgeRangeSliderProps = {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (minVal: number, maxVal: number) => void;
};

function AgeRangeSlider({
  min,
  max,
  valueMin,
  valueMax,
  onChange,
}: AgeRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState<"min" | "max" | null>(null);

  const clamp = (val: number) => Math.min(Math.max(val, min), max);
  const valueToPercent = (val: number) => ((val - min) / (max - min)) * 100;

  const handlePointerMove = (clientX: number) => {
    if (!dragging || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    if (rect.width === 0) return;

    const ratio = (clientX - rect.left) / rect.width;
    let raw = min + ratio * (max - min);
    let rounded = Math.round(raw);
    rounded = clamp(rounded);

    if (dragging === "min") {
      const newMin = Math.min(rounded, valueMax - 1); // always < max
      onChange(newMin, valueMax);
    } else {
      const newMax = Math.max(rounded, valueMin + 1); // always > min
      onChange(valueMin, newMax);
    }
  };

  useEffect(() => {
    if (!dragging) return;

    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX);
    const onTouchMove = (e: TouchEvent) =>
      handlePointerMove(e.touches[0]?.clientX ?? 0);

    const stop = () => setDragging(null);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", stop);
    window.addEventListener("touchcancel", stop);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", stop);
      window.removeEventListener("touchcancel", stop);
    };
  }, [dragging, valueMin, valueMax, min, max]);

  const minPercent = valueToPercent(valueMin);
  const maxPercent = valueToPercent(valueMax);

  return (
    <div className="mt-2 select-none">
      <div ref={trackRef} className="relative mt-2 h-16">
        <div className="pointer-events-none absolute left-0 right-0 top-2">
          <div
            className="absolute -translate-x-1/2 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-slate-50 shadow-sm dark:bg-slate-100 dark:text-slate-900"
            style={{ left: `${minPercent}%` }}
          >
            {valueMin}
          </div>
          <div
            className="absolute -translate-x-1/2 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-slate-50 shadow-sm dark:bg-slate-100 dark:text-slate-900"
            style={{ left: `${maxPercent}%` }}
          >
            {valueMax}
          </div>
        </div>

        <div className="absolute left-0 right-0 top-[70%] h-1 -translate-y-1/2 rounded-full bg-slate-200 dark:bg-slate-800" />

        <div
          className="absolute top-[70%] h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500"
          style={{
            left: `${minPercent}%`,
            right: `${100 - maxPercent}%`,
          }}
        />

        <button
          type="button"
          onMouseDown={() => setDragging("min")}
          onTouchStart={(e) => {
            e.preventDefault();
            setDragging("min");
          }}
          className="absolute top-[70%] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-slate-900 shadow-sm ring-2 ring-indigo-200 transition hover:scale-105 dark:bg-slate-100 dark:border-slate-900 dark:ring-indigo-900/50"
          style={{ left: `${minPercent}%` }}
          aria-label="Minimum age"
        />

        <button
          type="button"
          onMouseDown={() => setDragging("max")}
          onTouchStart={(e) => {
            e.preventDefault();
            setDragging("max");
          }}
          className="absolute top-[70%] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-slate-900 shadow-sm ring-2 ring-rose-200 transition hover:scale-105 dark:bg-slate-100 dark:border-slate-900 dark:ring-rose-900/50"
          style={{ left: `${maxPercent}%` }}
          aria-label="Maximum age"
        />
      </div>
    </div>
  );
}

function normalizeProfile(p: ProfileResponse): Profile {
  return {
    id: p.id,
    full_name: p.full_name,
    gender: p.gender ?? null,
    age: p.age ?? null,
    location: (p.location_label ?? null) as string | null,
    personality_weight: p.personality_weight,
    interests_weight: p.interests_weight,
    verified: p.verified,
    is_admin: p.is_admin,
    admin: p.admin,
    preferred_min_age: p.preferred_min_age ?? null,
    preferred_max_age: p.preferred_max_age ?? null,
    preferred_gender: (p.preferred_gender ?? null) as GenderPreference | null,
    preferred_max_distance_km: p.preferred_max_distance_km ?? null,
  };
}

function kmToMiles(km: number): number {
  return km * 0.621371;
}

type KycSlot = {
  file: File | null;
  preview: string | null;
};

export default function ProfilePage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const [allInterests, setAllInterests] = useState<Interest[]>([]);
  const [pendingInterests, setPendingInterests] = useState<Interest[]>([]);
  const [updatingInterests, setUpdatingInterests] = useState(false);

  // backend returns 3-slot array now: ["", "", ""]
  const [photos, setPhotos] = useState<string[]>(["", "", ""]);
  const [uploading, setUploading] = useState(false);
  const [uploadingPos, setUploadingPos] = useState<1 | 2 | 3 | null>(null);
  const [removingPos, setRemovingPos] = useState<1 | 2 | 3 | null>(null);

  const [savingPreferences, setSavingPreferences] = useState(false);

  const [kycStatus, setKycStatus] = useState<
    | {
        status: "unverified" | "pending" | "verified";
        reasons: { reason: string; created_at: string }[];
      }
    | null
  >(null);
  const [kycBusy, setKycBusy] = useState(false);

  // 3 required KYC slots with previews (in this exact order)
  const [kycSlots, setKycSlots] = useState<KycSlot[]>([
    { file: null, preview: null },
    { file: null, preview: null },
    { file: null, preview: null },
  ]);

  // saved indicators
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [interestsSaved, setInterestsSaved] = useState(false);
  const [photosSaved, setPhotosSaved] = useState(false);
  const [kycSaved, setKycSaved] = useState(false);

  const prefsSavedTimer = useRef<number | null>(null);
  const interestsSavedTimer = useRef<number | null>(null);
  const photosSavedTimer = useRef<number | null>(null);
  const kycSavedTimer = useRef<number | null>(null);

  function flashSaved(
    which: "prefs" | "interests" | "photos" | "kyc",
    ms = 2200
  ) {
    const clear = (ref: MutableRefObject<number | null>) => {
      if (ref.current) window.clearTimeout(ref.current);
      ref.current = window.setTimeout(() => {
        if (which === "prefs") setPrefsSaved(false);
        if (which === "interests") setInterestsSaved(false);
        if (which === "photos") setPhotosSaved(false);
        if (which === "kyc") setKycSaved(false);
      }, ms);
    };

    if (which === "prefs") {
      setPrefsSaved(true);
      clear(prefsSavedTimer);
    }
    if (which === "interests") {
      setInterestsSaved(true);
      clear(interestsSavedTimer);
    }
    if (which === "photos") {
      setPhotosSaved(true);
      clear(photosSavedTimer);
    }
    if (which === "kyc") {
      setKycSaved(true);
      clear(kycSavedTimer);
    }
  }

  useEffect(() => {
    return () => {
      if (prefsSavedTimer.current) window.clearTimeout(prefsSavedTimer.current);
      if (interestsSavedTimer.current)
        window.clearTimeout(interestsSavedTimer.current);
      if (photosSavedTimer.current)
        window.clearTimeout(photosSavedTimer.current);
      if (kycSavedTimer.current) window.clearTimeout(kycSavedTimer.current);
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [p, ints, ph, kyc, allInts] = await Promise.all([
          api.me(),
          api.myInterests(),
          api.myPhotos(),
          api.meKycStatus().catch(() => null),
          api.allInterests
            ? api.allInterests().catch(() => [] as Interest[])
            : Promise.resolve([] as Interest[]),
        ]);

        const pp = normalizeProfile(p);

        // sane default if missing
        if (pp.preferred_max_distance_km == null) pp.preferred_max_distance_km = 80;

        setProfile(pp);

        // NO LIMIT: keep all returned interests as pending
        setPendingInterests(ints);

        // backend returns fixed 3 slots; still guard
        setPhotos(
          Array.isArray(ph) ? (ph.length === 3 ? ph : ["", "", ""]) : ["", "", ""]
        );
        setAllInterests(allInts);

        if (kyc) {
          setKycStatus(kyc);
        } else {
          setKycStatus({
            status: p.verified ? "verified" : "unverified",
            reasons: [],
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function toggleInterest(int: Interest) {
    setPendingInterests((prev) => {
      const exists = prev.some((i) => i.id === int.id);
      if (exists) return prev.filter((i) => i.id !== int.id);
      return [...prev, int];
    });
  }

  function removeSelectedInterest(id: number) {
    setPendingInterests((prev) => prev.filter((i) => i.id !== id));
  }

  async function saveInterests() {
    setUpdatingInterests(true);
    try {
      const names = pendingInterests.map((i) => i.name);
      const updated = await api.putInterests(names);
      setPendingInterests(updated);
      flashSaved("interests");
    } catch (err) {
      console.error(err);
      alert("Failed to save interests.");
    } finally {
      setUpdatingInterests(false);
    }
  }

  async function uploadGallery(e: ChangeEvent<HTMLInputElement>, pos: 1 | 2 | 3) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadingPos(pos);
    try {
      await api.uploadGalleryPhoto(file, pos);
      const ph = await api.myPhotos();
      setPhotos(ph.length === 3 ? ph : ["", "", ""]);
      flashSaved("photos");
    } catch (err) {
      console.error(err);
      alert("Failed to upload photo.");
    } finally {
      e.target.value = "";
      setUploading(false);
      setUploadingPos(null);
    }
  }

  async function removeGallery(pos: 1 | 2 | 3) {
    setRemovingPos(pos);
    try {
      await api.deleteGalleryPhoto(pos);
      const ph = await api.myPhotos();
      setPhotos(ph.length === 3 ? ph : ["", "", ""]);
      flashSaved("photos");
    } catch (err) {
      console.error(err);
      alert("Failed to remove photo.");
    } finally {
      setRemovingPos(null);
    }
  }

  function onPickKycFile(e: ChangeEvent<HTMLInputElement>, idx: 0 | 1 | 2) {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    setKycSlots((prev) => {
      const next = [...prev];
      if (next[idx]?.preview) URL.revokeObjectURL(next[idx]!.preview!);
      next[idx] = { file, preview: URL.createObjectURL(file) };
      return next;
    });

    e.target.value = "";
  }

  function clearKycSlot(idx: 0 | 1 | 2) {
    setKycSlots((prev) => {
      const next = [...prev];
      if (next[idx]?.preview) URL.revokeObjectURL(next[idx]!.preview!);
      next[idx] = { file: null, preview: null };
      return next;
    });
  }

  useEffect(() => {
    return () => {
      for (const s of kycSlots) {
        if (s.preview) URL.revokeObjectURL(s.preview);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitKycTriplet() {
    const f1 = kycSlots[0]?.file;
    const f2 = kycSlots[1]?.file;
    const f3 = kycSlots[2]?.file;

    if (!f1 || !f2 || !f3) {
      alert("Please upload all 3 verification images.");
      return;
    }

    setKycBusy(true);
    try {
      await api.meKycUpload([f1, f2, f3]);
      const kyc = await api.meKycStatus();
      setKycStatus(kyc);
      flashSaved("kyc");

      setKycSlots((prev) => {
        prev.forEach((s) => {
          if (s.preview) URL.revokeObjectURL(s.preview);
        });
        return [
          { file: null, preview: null },
          { file: null, preview: null },
          { file: null, preview: null },
        ];
      });
    } catch (err) {
      console.error(err);
      alert("Failed to upload verification images.");
    } finally {
      setKycBusy(false);
    }
  }

  async function cancelKyc() {
    if (!confirm("Cancel your pending verification request?")) return;
    setKycBusy(true);
    try {
      await api.meKycCancel();
      const kyc = await api.meKycStatus();
      setKycStatus(kyc);
      flashSaved("kyc");
    } catch (err) {
      console.error(err);
      alert("Failed to cancel verification request.");
    } finally {
      setKycBusy(false);
    }
  }

  async function savePreferences() {
    if (!profile) return;

    const dist = profile.preferred_max_distance_km ?? 80;
    if (dist < 1 || dist > 500) {
      alert("Max distance must be between 1 and 500 km.");
      return;
    }

    setSavingPreferences(true);
    try {
      const payload = {
        preferred_min_age: profile.preferred_min_age ?? null,
        preferred_max_age: profile.preferred_max_age ?? null,
        preferred_gender: profile.preferred_gender ?? null,
        preferred_max_distance_km: dist,
      };

      const updated = await api.updateMatchPreferences(payload);
      const pp = normalizeProfile(updated);
      if (pp.preferred_max_distance_km == null) pp.preferred_max_distance_km = 80;
      setProfile(pp);
      flashSaved("prefs");
    } catch (err) {
      console.error(err);
      alert("Failed to save preferences.");
    } finally {
      setSavingPreferences(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-500 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-400 grid place-items-center transition-colors duration-300">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-50 transition-colors duration-300 grid place-items-center">
        <div className="rounded-3xl border border-slate-200 bg-white/80 px-6 py-4 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
          Profile not found.
        </div>
      </div>
    );
  }

  const selectedInterestIds = new Set(pendingInterests.map((i) => i.id));

  const interestsByCategory: Record<string, Interest[]> = allInterests.reduce(
    (acc, int) => {
      const key = int.category?.trim() || "Other";
      if (!acc[key]) acc[key] = [];
      acc[key].push(int);
      return acc;
    },
    {} as Record<string, Interest[]>
  );

  const sortedCategories = Object.keys(interestsByCategory).sort((a, b) =>
    a.localeCompare(b)
  );

  const minLimit = 18;
  const maxLimit = 99;

  let ageMin = profile.preferred_min_age ?? minLimit;
  let ageMax = profile.preferred_max_age ?? Math.min(maxLimit, ageMin + 10);

  if (ageMin < minLimit) ageMin = minLimit;
  if (ageMin > maxLimit - 1) ageMin = maxLimit - 1;
  if (ageMax <= ageMin) ageMax = Math.min(maxLimit, ageMin + 1);

  const distanceMin = 1;
  const distanceMax = 200;
  const recommendedMinKm = 60;
  const recommendedMaxKm = 90;

  const distanceValue = Math.min(
    distanceMax,
    Math.max(distanceMin, profile.preferred_max_distance_km ?? 80)
  );

  const distancePct =
    ((distanceValue - distanceMin) / (distanceMax - distanceMin)) * 100;

  const recLeftPct =
    ((recommendedMinKm - distanceMin) / (distanceMax - distanceMin)) * 100;
  const recRightPct =
    ((recommendedMaxKm - distanceMin) / (distanceMax - distanceMin)) * 100;

  const milesValue = kmToMiles(distanceValue);
  const recMinMi = kmToMiles(recommendedMinKm);
  const recMaxMi = kmToMiles(recommendedMaxKm);

  const kycAllSelected =
    !!kycSlots[0]?.file && !!kycSlots[1]?.file && !!kycSlots[2]?.file;

  const kycCards: Array<{
    title: string;
    subtitle: string;
    hint: string;
  }> = [
    {
      title: "1) ID / Passport",
      subtitle: "Your identification document",
      hint: "Must match your profile name, age, and gender.",
    },
    {
      title: "2) Face selfie",
      subtitle: "A clear photo of your face",
      hint: "Good lighting, no filters, face fully visible.",
    },
    {
      title: "3) Selfie + ID",
      subtitle: "You holding your ID next to your face",
      hint: "Face + ID visible in the same photo.",
    },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-50 transition-colors duration-300">
      <style>{`
        input.distance-range[type="range"]{
          -webkit-appearance:none;
          appearance:none;
          height:4px;
          border-radius:9999px;
          background-color: rgb(226 232 240);
          background-image: linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #f43f5e 100%);
          background-repeat: no-repeat;
          background-size: var(--pct) 100%;
          outline:none;
        }

        .dark input.distance-range[type="range"]{
          background-color: rgb(30 41 59);
        }

        input.distance-range[type="range"]::-webkit-slider-thumb{
          -webkit-appearance:none;
          appearance:none;
          width:16px;
          height:16px;
          border-radius:9999px;
          background:#0f172a;
          border:2px solid #ffffff;
          box-shadow:0 1px 2px rgba(0,0,0,0.25);
          cursor:pointer;
        }

        input.distance-range[type="range"]::-moz-range-track{
          height:4px;
          border-radius:9999px;
          background:transparent;
        }

        input.distance-range[type="range"]::-moz-range-thumb{
          width:16px;
          height:16px;
          border-radius:9999px;
          background:#0f172a;
          border:2px solid #ffffff;
          box-shadow:0 1px 2px rgba(0,0,0,0.25);
          cursor:pointer;
        }

        .dark input.distance-range[type="range"]::-webkit-slider-thumb{
          background:#f8fafc;
          border-color:#0f172a;
        }
        .dark input.distance-range[type="range"]::-moz-range-thumb{
          background:#f8fafc;
          border-color:#0f172a;
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 left-0 right-0 mx-auto h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,_rgba(129,140,248,0.25),_transparent_60%)] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,_rgba(244,114,182,0.18),_transparent_60%)] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-4 sm:px-6 lg:px-8">
        <AppHeader />

        <main className="flex-1 py-8 space-y-8">
          {/* Profile */}
          <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm shadow-slate-200/60 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/30">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Profile
              </h2>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-300" />
                <span>Core details for matching</span>
              </div>
            </div>
            <div className="mt-4 grid gap-4 text-sm text-slate-700 dark:text-slate-200 sm:grid-cols-2">
              <div className="space-y-1">
                <div>
                  <span className="font-medium text-slate-900 dark:text-slate-50">
                    Name:
                  </span>{" "}
                  {profile.full_name}
                </div>
                {profile.age ? (
                  <div>
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      Age:
                    </span>{" "}
                    {profile.age}
                  </div>
                ) : null}
                {profile.gender ? (
                  <div>
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      Gender:
                    </span>{" "}
                    {profile.gender}
                  </div>
                ) : null}
                {profile.location ? (
                  <div>
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      Location:
                    </span>{" "}
                    {profile.location}
                  </div>
                ) : null}
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  {profile.verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                      <ShieldCheck className="h-3.5 w-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      Not verified yet
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Your profile details help us understand who you are and what kind of people
                  you’re likely to click with.
                </div>
              </div>
            </div>
          </section>

          {/* Verification */}
          <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm shadow-slate-200/60 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/30">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-500 dark:text-rose-300" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Verification
              </h2>

              {kycSaved && (
                <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-emerald-300/60 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-900/20 dark:text-emerald-200">
                  <Check className="h-3.5 w-3.5" /> Saved
                </span>
              )}
            </div>

            {/* ✅ VERIFIED: show CTA to conversations */}
            {kycStatus?.status === "verified" && (
              <div className="mt-4 space-y-3">
                <p className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                  <ShieldCheck className="h-4 w-4" />
                  Your account is verified.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/conversations")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-slate-50 hover:bg-black dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  Go to matches <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* ✅ PENDING: note + refresh button */}
            {kycStatus?.status === "pending" && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Your verification is pending review.</span>
                </div>

                <div className="mt-2 text-[11px] opacity-90">
                  When it’s approved, refresh this page to see your verified status.
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-900/60"
                  >
                    <RefreshCw className="h-4 w-4" /> Refresh
                  </button>

                  <button
                    type="button"
                    onClick={cancelKyc}
                    disabled={kycBusy}
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-50 disabled:opacity-60 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-900/60"
                  >
                    {kycBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}{" "}
                    Cancel request
                  </button>
                </div>
              </div>
            )}

            {kycStatus?.status === "unverified" && (
              <div className="mt-4 space-y-4 text-xs text-slate-600 dark:text-slate-300">
                <p>
                  Upload the <span className="font-medium">three required images</span> below.
                  If your request was denied, check the reasons and re-upload.
                </p>

                {!!kycStatus?.reasons?.length && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-800 dark:bg-rose-950/40">
                    <div className="mb-2 text-xs font-semibold text-rose-700 dark:text-rose-200">
                      Previous rejection reasons
                    </div>
                    <ul className="space-y-1 text-[11px] text-rose-800 dark:text-rose-100">
                      {kycStatus.reasons.map((r, idx) => (
                        <li key={idx}>
                          <span className="opacity-70">
                            {new Date(r.created_at).toLocaleString()}
                          </span>
                          <span className="ml-2">{r.reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {([0, 1, 2] as const).map((idx) => {
                    const slot = kycSlots[idx];
                    const meta = kycCards[idx];
                    const has = !!slot.file;

                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/70"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                              {meta.title}
                            </div>
                            <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                              {meta.subtitle}
                            </div>
                          </div>

                          {has && (
                            <button
                              type="button"
                              onClick={() => clearKycSlot(idx)}
                              disabled={kycBusy}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/70 disabled:opacity-60"
                              title="Remove"
                              aria-label={`Remove KYC image ${idx + 1}`}
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
                          <div className="relative flex h-28 items-center justify-center">
                            {slot.preview ? (
                              <img
                                src={slot.preview}
                                alt={`kyc-${idx + 1}`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                                <ImageIcon className="h-6 w-6" />
                                <span className="text-[10px]">No image selected</span>
                              </div>
                            )}

                            <label
                              className={[
                                "absolute inset-0 flex cursor-pointer items-center justify-center text-[11px] font-medium text-white backdrop-blur-[1px] transition",
                                slot.preview
                                  ? "bg-slate-900/35 opacity-0 hover:opacity-100"
                                  : "bg-slate-900/25 opacity-100",
                                kycBusy ? "pointer-events-none opacity-100" : "",
                              ].join(" ")}
                            >
                              <span className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5">
                                <Upload className="h-4 w-4" />
                                {slot.preview ? "Replace" : "Upload"}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => onPickKycFile(e, idx)}
                              />
                            </label>
                          </div>
                        </div>

                        <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">
                          {meta.hint}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {kycAllSelected ? (
                      <span className="inline-flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                        All 3 images selected. Ready to submit.
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-rose-500 dark:text-rose-300" />
                        Please select all 3 images to submit.
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={submitKycTriplet}
                    disabled={kycBusy || !kycAllSelected}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-slate-50 hover:bg-black disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                  >
                    {kycBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    {kycBusy ? "Submitting…" : "Submit verification"}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Match preferences */}
          <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm shadow-slate-200/60 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/30">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-indigo-500 dark:text-indigo-300" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Match preferences
              </h2>

              {prefsSaved && (
                <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-emerald-300/60 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-900/20 dark:text-emerald-200">
                  <Check className="h-3.5 w-3.5" /> Saved
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              This shapes who we prioritize showing you. It guides matching but doesn’t act
              as a hard filter.
            </p>

            <div className="mt-4 space-y-4 text-sm text-slate-700 dark:text-slate-200">
              <div>
                <div className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Preferred age range
                </div>
                <AgeRangeSlider
                  min={minLimit}
                  max={maxLimit}
                  valueMin={ageMin}
                  valueMax={ageMax}
                  onChange={(newMin, newMax) =>
                    setProfile({
                      ...profile,
                      preferred_min_age: newMin,
                      preferred_max_age: newMax,
                    })
                  }
                />
              </div>

              <div>
                <div className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Gender preference
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "women" as GenderPreference, label: "Women" },
                    { value: "men" as GenderPreference, label: "Men" },
                    { value: "everyone" as GenderPreference, label: "Everyone" },
                  ].map((opt) => {
                    const active = profile.preferred_gender === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={savingPreferences}
                        onClick={() =>
                          setProfile({
                            ...profile,
                            preferred_gender: opt.value,
                          })
                        }
                        className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition disabled:opacity-60 ${
                          active
                            ? "border-slate-900 bg-slate-900 text-slate-50 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                            : "border-slate-300 bg-white text-slate-700 hover:border-indigo-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-400"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Max distance
                  </div>

                  <div className="text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="font-medium">{distanceValue} km</span>
                    <span className="opacity-70"> · </span>
                    <span className="font-medium">{Math.round(milesValue)} mi</span>
                  </div>
                </div>

                <div className="relative">
                  <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2">
                    <div className="relative h-1 rounded-full bg-transparent">
                      <div
                        className="absolute h-1 rounded-full bg-emerald-400/35 dark:bg-emerald-300/20"
                        style={{
                          left: `${Math.max(0, Math.min(100, recLeftPct))}%`,
                          width: `${Math.max(
                            0,
                            Math.min(100, recRightPct) - Math.min(100, recLeftPct)
                          )}%`,
                        }}
                      />
                      <div
                        className="absolute -top-1 h-3 w-[2px] rounded bg-emerald-500/70 dark:bg-emerald-300/40"
                        style={{ left: `${Math.max(0, Math.min(100, recLeftPct))}%` }}
                      />
                      <div
                        className="absolute -top-1 h-3 w-[2px] rounded bg-emerald-500/70 dark:bg-emerald-300/40"
                        style={{ left: `${Math.max(0, Math.min(100, recRightPct))}%` }}
                      />
                    </div>
                  </div>

                  <input
                    type="range"
                    min={distanceMin}
                    max={distanceMax}
                    value={distanceValue}
                    disabled={savingPreferences}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        preferred_max_distance_km: Number(e.target.value),
                      })
                    }
                    className="distance-range w-full disabled:opacity-70"
                    style={{ ["--pct" as any]: `${distancePct}%` }}
                    aria-label="Maximum distance in kilometers"
                  />
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>We’ll prioritize matches within this radius.</span>
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/60 bg-emerald-50 px-2 py-0.5 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-900/20 dark:text-emerald-200">
                      Recommended: {recommendedMinKm}–{recommendedMaxKm} km
                      <span className="opacity-70">
                        ({Math.round(recMinMi)}–{Math.round(recMaxMi)} mi)
                      </span>
                    </span>
                    <span className="opacity-70">UI max {distanceMax} km</span>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={savePreferences}
                disabled={savingPreferences}
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-slate-50 hover:bg-black disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              >
                {savingPreferences ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : prefsSaved ? (
                  <Check className="h-4 w-4" />
                ) : null}
                {savingPreferences ? "Saving…" : prefsSaved ? "Saved" : "Save preferences"}
              </button>
            </div>
          </section>

          {/* Interests */}
          <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm shadow-slate-200/60 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/30">
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-violet-500 dark:text-violet-300" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Interests
              </h2>

              <span className="ml-auto inline-flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5 dark:border-slate-700 dark:bg-slate-900">
                  {pendingInterests.length} selected
                </span>
                {interestsSaved && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/60 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-900/20 dark:text-emerald-200">
                    <Check className="h-3.5 w-3.5" /> Saved
                  </span>
                )}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Pick everything that feels like you. Your selections are only saved when you
              click “Save interests”.
            </p>

            <div className="mt-4">
              <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Selected
              </div>
              <div className="flex flex-wrap gap-2">
                {pendingInterests.length === 0 && (
                  <span className="text-[11px] text-slate-400">Nothing selected yet.</span>
                )}
                {pendingInterests.map((i) => (
                  <span
                    key={i.id}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <span>{i.name}</span>
                    {i.category && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        · {i.category}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeSelectedInterest(i.id)}
                      aria-label={`Remove ${i.name}`}
                      className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-60"
                      disabled={updatingInterests}
                      title="Remove"
                    >
                      <XCircle className="h-4 w-4 opacity-70" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-1 flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                <span>Available interests</span>
                {allInterests.length > 0 && (
                  <span className="normal-case tracking-normal text-[10px] text-slate-400 dark:text-slate-500">
                    Tap to add / remove
                  </span>
                )}
              </div>
              <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/70">
                {allInterests.length === 0 && (
                  <span className="text-[11px] text-slate-400">
                    No interests found. (You may need to add them in the admin/backend.)
                  </span>
                )}

                {sortedCategories.map((cat) => {
                  const items = interestsByCategory[cat] || [];
                  if (!items.length) return null;
                  const label = cat === "Other" ? "Other / uncategorized" : cat;

                  return (
                    <div key={cat} className="mb-3 last:mb-0">
                      <div className="mb-1 flex items-center justify-between">
                        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          {label}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">
                          {items.length} item{items.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {items.map((int) => {
                          const active = selectedInterestIds.has(int.id);
                          return (
                            <button
                              key={int.id}
                              type="button"
                              onClick={() => toggleInterest(int)}
                              disabled={updatingInterests}
                              className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition disabled:opacity-50 ${
                                active
                                  ? "border-slate-900 bg-slate-900 text-slate-50 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                                  : "border-slate-300 bg-white text-slate-700 hover:border-indigo-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-400"
                              }`}
                            >
                              {int.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={saveInterests}
                  disabled={updatingInterests}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-slate-50 hover:bg-black disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  {updatingInterests ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : interestsSaved ? (
                    <Check className="h-4 w-4" />
                  ) : null}
                  {updatingInterests ? "Saving…" : interestsSaved ? "Saved" : "Save interests"}
                </button>
                {updatingInterests && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Saving…
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Gallery */}
          <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm shadow-slate-200/60 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/30">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-500 dark:text-rose-300" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Gallery photos
              </h2>

              {photosSaved && (
                <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-emerald-300/60 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-900/20 dark:text-emerald-200">
                  <Check className="h-3.5 w-3.5" /> Saved
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Upload up to three photos that feel like you. You can update them anytime.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((pos) => {
                const p = pos as 1 | 2 | 3;
                const hasPhoto = !!photos[p - 1];
                const busy = uploadingPos === p || removingPos === p;

                return (
                  <div
                    key={p}
                    className="group relative flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
                  >
                    {hasPhoto ? (
                      <img
                        src={photos[p - 1]}
                        alt={`gallery-${p}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">Empty slot {p}</span>
                    )}

                    {hasPhoto && (
                      <button
                        type="button"
                        onClick={() => removeGallery(p)}
                        disabled={busy}
                        className="absolute right-2 top-2 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/70 disabled:opacity-60"
                        aria-label={`Remove photo ${p}`}
                        title="Remove"
                      >
                        {removingPos === p ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </button>
                    )}

                    <label
                      className={[
                        "absolute inset-0 z-10 flex cursor-pointer items-center justify-center text-xs font-medium text-white backdrop-blur-[1px] transition",
                        hasPhoto
                          ? "bg-slate-900/40 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
                          : "bg-slate-900/25 opacity-100 pointer-events-auto",
                        busy ? "opacity-100 pointer-events-none" : "",
                      ].join(" ")}
                    >
                      {uploadingPos === p ? (
                        <>
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Uploading…
                        </>
                      ) : (
                        <>
                          <Upload className="mr-1 h-4 w-4" /> Upload
                        </>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => uploadGallery(e, p)}
                      />
                    </label>
                  </div>
                );
              })}
            </div>

            {uploading && (
              <div className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
              </div>
            )}
          </section>
        </main>

        <AppFooter />
      </div>
    </div>
  );
}
