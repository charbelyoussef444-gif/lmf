// Mobile replica of /likeminded/src/screens/profile/LocationScreen.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, MapPin, CheckCircle2 } from "lucide-react";
import MobileAppShell from "../../layouts/MobileAppShell";
import MobileHeader from "../../layouts/MobileHeader";
import {
  GradientButton,
  LoadingSpinner,
} from "../../components/Primitives";
import { api, type CityRow, type ProfileResponse } from "../../../lib/api";

export default function MobileLocationScreen() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [search, setSearch] = useState("");
  const [loadingCities, setLoadingCities] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.me().catch(() => null), api.getCities("Lebanon").catch(() => [])])
      .then(([p, list]) => {
        if (cancelled) return;
        setProfile(p);
        setSelectedId(p?.location_id ?? null);
        const sorted = [...list].sort((a, b) => a.city.localeCompare(b.city));
        setCities(sorted);
      })
      .catch(() => !cancelled && setError("Failed to load cities"))
      .finally(() => !cancelled && setLoadingCities(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () =>
      search.trim()
        ? cities.filter((c) =>
            c.city.toLowerCase().includes(search.toLowerCase())
          )
        : cities,
    [cities, search]
  );

  const selectedCity = cities.find((c) => c.id === selectedId) || null;
  const hasChanged = selectedId !== profile?.location_id;

  const handleSave = async () => {
    if (!selectedId || !hasChanged || !profile) return;
    setSaving(true);
    setError("");
    try {
      await api.completeOnboarding({
        age: profile.age ?? 18,
        location_id: selectedId,
        gender: (profile.gender as any) ?? null,
        preferred_min_age: profile.preferred_min_age ?? null,
        preferred_max_age: profile.preferred_max_age ?? null,
        preferred_gender: (profile.preferred_gender as any) ?? null,
        preferred_max_distance_km: profile.preferred_max_distance_km ?? null,
      });
      navigate(-1);
    } catch (e: any) {
      setError(e?.message || "Failed to update location");
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobileAppShell bare className="md:hidden">
      <MobileHeader title="My Location" onBack={() => navigate(-1)} />
      <div className="flex flex-1 flex-col px-4 pb-4">
        {/* Current Location card */}
        <div
          className="rounded-[12px] p-4 mt-3 mb-3"
          style={{
            background: "var(--m-surface)",
            border: "1px solid var(--m-border-glass)",
          }}
        >
          <div
            className="m-footnote mb-2"
            style={{
              color: "var(--m-text-secondary)",
              textTransform: "uppercase",
            }}
          >
            Current Location
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={18} color="var(--m-primary)" />
            <span
              className="m-body"
              style={{ color: "var(--m-text-primary)", fontWeight: 600 }}
            >
              {selectedCity?.city ??
                profile?.location_label ??
                "Not set"}
            </span>
          </div>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-3"
          style={{
            background: "var(--m-surface-tertiary)",
            borderRadius: 10,
            height: 44,
          }}
        >
          <Search size={18} color="var(--m-text-tertiary)" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cities..."
            className="flex-1 bg-transparent border-0 outline-none m-body"
            style={{ color: "var(--m-text-primary)" }}
          />
          {search.length > 0 ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="bg-transparent border-0"
              aria-label="Clear search"
            >
              <X size={18} color="var(--m-text-tertiary)" />
            </button>
          ) : null}
        </div>

        {/* List */}
        <div
          className="flex-1 overflow-y-auto mt-2"
          style={{ WebkitOverflowScrolling: "touch", minHeight: 200 }}
        >
          {loadingCities ? (
            <LoadingSpinner />
          ) : filtered.length === 0 ? (
            <p
              className="m-body text-center"
              style={{ color: "var(--m-text-tertiary)", marginTop: 24 }}
            >
              No cities found
            </p>
          ) : (
            filtered.map((c, idx) => {
              const isActive = c.id === selectedId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className="flex w-full items-center justify-between bg-transparent border-0 text-left"
                  style={{
                    minHeight: 44,
                    paddingTop: 12,
                    paddingBottom: 12,
                    paddingLeft: 4,
                    paddingRight: 4,
                    borderTop:
                      idx === 0
                        ? "none"
                        : "1px solid var(--m-separator-light)",
                  }}
                >
                  <div className="flex-1 text-left">
                    <div
                      className="m-body"
                      style={{
                        color: isActive
                          ? "var(--m-primary)"
                          : "var(--m-text-primary)",
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      {c.city}
                    </div>
                    {c.admin_name ? (
                      <div
                        className="m-footnote"
                        style={{
                          color: "var(--m-text-tertiary)",
                          marginTop: 2,
                        }}
                      >
                        {c.admin_name}
                      </div>
                    ) : null}
                  </div>
                  {isActive ? (
                    <CheckCircle2 size={22} color="var(--m-primary)" />
                  ) : null}
                </button>
              );
            })
          )}
        </div>

        {error ? (
          <p
            className="m-footnote text-center"
            role="alert"
            style={{ color: "var(--m-error)", marginTop: 8 }}
          >
            {error}
          </p>
        ) : null}

        <div className="pt-3">
          <GradientButton
            title="Save Location"
            onClick={handleSave}
            disabled={!hasChanged || !selectedId}
            loading={saving}
          />
        </div>
      </div>
    </MobileAppShell>
  );
}
