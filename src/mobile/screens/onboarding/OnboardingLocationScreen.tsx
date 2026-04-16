// Mobile replica of /likeminded/src/screens/onboarding/OnboardingLocation.tsx
// Step 2 of 3 onboarding flow.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, ChevronRight, Search, X, CheckCircle2 } from "lucide-react";
import MobileAppShell from "../../layouts/MobileAppShell";
import { GradientButton, ProgressBar, LoadingSpinner } from "../../components/Primitives";
import { api, type CityRow } from "../../../lib/api";

const COUNTRY = "Lebanon";

export default function MobileOnboardingLocationScreen() {
  const navigate = useNavigate();
  const [cities, setCities] = useState<CityRow[]>([]);
  const [locationId, setLocationId] = useState<number | null>(() => {
    const raw = sessionStorage.getItem("mob_onb_location_id");
    return raw ? Number(raw) : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .getCities(COUNTRY)
      .then((data) => {
        if (cancelled) return;
        const sorted = [...data].sort((a, b) => a.city.localeCompare(b.city));
        setCities(sorted);
      })
      .catch(() => !cancelled && setError("Failed to load cities"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = search.trim()
    ? cities.filter((c) =>
        c.city.toLowerCase().includes(search.toLowerCase())
      )
    : cities;

  const selectedCity = cities.find((c) => c.id === locationId) || null;

  const selectCity = (city: CityRow) => {
    setLocationId(city.id);
    sessionStorage.setItem("mob_onb_location_id", String(city.id));
    sessionStorage.setItem("mob_onb_location_label", city.city);
    setError("");
    setSearch("");
    setShowModal(false);
  };

  const handleNext = () => {
    if (!locationId) {
      setError("Please select your city");
      return;
    }
    navigate("/onboarding/preferences");
  };

  return (
    <MobileAppShell bare className="md:hidden">
      <div className="flex flex-1 flex-col px-4 pb-4 pt-2">
        <ProgressBar progress={2 / 3} className="mt-2 mb-2" />
        <div
          className="m-footnote"
          style={{ color: "var(--m-text-tertiary)", marginBottom: 24 }}
        >
          Step 2 of 3
        </div>

        <h1
          className="m-large-title"
          style={{ color: "var(--m-text-primary)", marginBottom: 8 }}
        >
          Where are you located?
        </h1>
        <p
          className="m-body"
          style={{ color: "var(--m-text-secondary)", marginBottom: 24 }}
        >
          We'll use this to find matches near you
        </p>

        <div
          className="rounded-[12px] overflow-hidden border"
          style={{
            backgroundColor: "var(--m-surface)",
            borderColor: "var(--m-border-glass)",
          }}
        >
          <div
            className="flex items-center justify-between px-4"
            style={{ minHeight: 44, paddingTop: 12, paddingBottom: 12 }}
          >
            <span className="m-body" style={{ color: "var(--m-text-primary)" }}>
              Country
            </span>
            <div className="flex items-center gap-2">
              <MapPin size={20} color="var(--m-text-secondary)" />
              <span
                className="m-body"
                style={{ color: "var(--m-text-secondary)" }}
              >
                {COUNTRY}
              </span>
            </div>
          </div>

          <div
            style={{
              height: 1,
              backgroundColor: "var(--m-separator-light)",
              marginLeft: 16,
            }}
          />

          <button
            type="button"
            className="flex w-full items-center justify-between bg-transparent border-0 px-4"
            style={{ minHeight: 44, paddingTop: 12, paddingBottom: 12 }}
            onClick={() => setShowModal(true)}
          >
            <span className="m-body" style={{ color: "var(--m-text-primary)" }}>
              City
            </span>
            <div className="flex items-center gap-2">
              <span
                className="m-body"
                style={{
                  color: selectedCity
                    ? "var(--m-text-secondary)"
                    : "var(--m-text-tertiary)",
                }}
              >
                {selectedCity ? selectedCity.city : "Select your city"}
              </span>
              <ChevronRight size={18} color="var(--m-text-tertiary)" />
            </div>
          </button>
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
          <GradientButton
            title="Continue"
            onClick={handleNext}
            disabled={!locationId}
          />
        </div>
      </div>

      {showModal ? (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "var(--m-bg-elevated)",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              paddingBottom: "env(safe-area-inset-bottom, 0)",
            }}
          >
            <div
              className="mx-auto"
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: "var(--m-separator-light)",
                marginTop: 8,
                marginBottom: 4,
              }}
            />
            <div className="flex items-center justify-between px-4 py-2">
              <div style={{ width: 50 }} />
              <div
                className="m-headline flex-1 text-center"
                style={{ color: "var(--m-text-primary)" }}
              >
                Select City
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="m-body bg-transparent border-0"
                style={{
                  color: "var(--m-primary)",
                  fontWeight: 600,
                  width: 50,
                  textAlign: "right",
                }}
              >
                Done
              </button>
            </div>

            <div
              className="mx-4 flex items-center gap-2 px-3"
              style={{
                backgroundColor: "var(--m-surface-tertiary)",
                borderRadius: 8,
                height: 44,
              }}
            >
              <Search size={18} color="var(--m-text-tertiary)" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cities..."
                autoFocus
                className="flex-1 bg-transparent border-0 outline-none m-body"
                style={{ color: "var(--m-text-primary)" }}
              />
              {search.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="bg-transparent border-0"
                >
                  <X size={18} color="var(--m-text-tertiary)" />
                </button>
              ) : null}
            </div>

            <div
              className="flex-1 overflow-y-auto mt-2"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {loading ? (
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
                  const isActive = c.id === locationId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectCity(c)}
                      className="flex w-full items-center justify-between bg-transparent border-0 px-4"
                      style={{
                        minHeight: 44,
                        paddingTop: 12,
                        paddingBottom: 12,
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
          </div>
        </div>
      ) : null}
    </MobileAppShell>
  );
}
