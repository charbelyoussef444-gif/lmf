// Mobile replica of /likeminded/src/screens/profile/ProfileHomeScreen.tsx

import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  Images,
  Sparkles,
  ShieldCheck,
  MapPin,
  Trash2,
  LogOut,
  Calendar,
  User,
  Moon,
  Sun,
  ChevronRight,
} from "lucide-react";
import MobileAppShell from "../../layouts/MobileAppShell";
import { Avatar, Badge, LoadingSpinner } from "../../components/Primitives";
import { api, type ProfileResponse } from "../../../lib/api";
import { supabase } from "../../../lib/supabaseClient";
import { useTheme } from "../../../theme/ThemeProvider";

type KycStatus = "unverified" | "pending" | "verified";

type TraitScore = { id: number; name: string; score?: number | null };

const SHORT_NAMES: Record<string, string> = {
  "Warmth / Compassion": "Warmth",
  "Honesty-Humility": "Honesty",
  "Attachment Anxiety": "Attach. Anxiety",
  "Attachment Avoidance": "Attach. Avoidance",
  "Openness — Aesthetic / Experiential": "Openness",
  "Repair Orientation": "Repair Orient.",
  "Autonomy / Boundary Respect": "Autonomy",
  "Communication Clarity / Directness": "Communication",
  "Reliability / Dependability in Dyad": "Reliability",
  "Exclusivity Preference": "Exclusivity",
};

export default function MobileProfileHomeScreen() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [kycStatus, setKycStatus] = useState<KycStatus>("unverified");
  const [traits, setTraits] = useState<TraitScore[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const [p, kyc, ts] = await Promise.all([
        api.me().catch(() => null),
        api.meKycStatus().catch(() => null),
        api.listPersonalityTraits().catch(() => []),
      ]);
      setProfile(p);
      setKycStatus((kyc?.status as KycStatus) ?? "unverified");
      setTraits(
        (ts || []).filter(
          (t: any) => t.score !== null && t.score !== undefined
        ) as TraitScore[]
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const kycVariant: "success" | "warning" | "error" =
    kycStatus === "verified"
      ? "success"
      : kycStatus === "pending"
      ? "warning"
      : "error";
  const kycLabel =
    kycStatus === "verified"
      ? "Verified"
      : kycStatus === "pending"
      ? "Pending"
      : "Unverified";

  const handleSignOut = async () => {
    const ok = window.confirm("Sign out of your account?");
    if (!ok) return;
    await supabase.auth.signOut();
    try {
      sessionStorage.clear();
      localStorage.removeItem("sb-auth-token");
    } catch {}
    navigate("/login");
  };

  // Radar chart calculation — mirrors native SVG logic
  const radar = useMemo(() => {
    if (traits.length === 0) return null;
    const n = traits.length;
    const SIZE = 320;
    const CX = SIZE / 2;
    const CY = SIZE / 2;
    const RADIUS = 80;
    const LABEL_RADIUS = RADIUS + 26;
    const GRID_LEVELS = 4;

    const getPoint = (i: number, value: number) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      return {
        x: CX + Math.cos(angle) * RADIUS * value,
        y: CY + Math.sin(angle) * RADIUS * value,
      };
    };

    const dataPoints = traits.map((t, i) => {
      const val = Math.max(t.score ?? 0, 0.05);
      return getPoint(i, val);
    });
    const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

    const gridPolygons = Array.from({ length: GRID_LEVELS }, (_, level) => {
      const frac = (level + 1) / GRID_LEVELS;
      return Array.from({ length: n }, (__, i) => {
        const p = getPoint(i, frac);
        return `${p.x},${p.y}`;
      }).join(" ");
    });

    const labels = traits.map((t, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const x = CX + cosA * LABEL_RADIUS;
      const y = CY + sinA * LABEL_RADIUS;
      const score = Math.round((t.score ?? 0) * 100);
      const shortName =
        SHORT_NAMES[t.name] ||
        (t.name.length > 16 ? t.name.slice(0, 14) + "…" : t.name);
      let anchor: "start" | "middle" | "end" = "middle";
      if (cosA > 0.3) anchor = "start";
      else if (cosA < -0.3) anchor = "end";
      const clampedX = Math.max(40, Math.min(SIZE - 40, x));
      return { x: clampedX, y, shortName, score, anchor };
    });

    return { SIZE, gridPolygons, dataPolygon, dataPoints, labels };
  }, [traits]);

  if (loading) {
    return (
      <MobileAppShell className="md:hidden">
        <LoadingSpinner fullScreen />
      </MobileAppShell>
    );
  }

  const menuItems = [
    {
      title: "My Location",
      Icon: MapPin,
      iconBg: "#FF9500",
      onClick: () => navigate("/profile/location"),
    },
    {
      title: "Match Preferences",
      Icon: Heart,
      iconBg: "#FF6B8A",
      onClick: () => navigate("/profile/preferences"),
    },
    {
      title: "My Interests",
      Icon: Sparkles,
      iconBg: "#8B5CF6",
      onClick: () => navigate("/profile/interests"),
    },
    {
      title: "My Photos",
      Icon: Images,
      iconBg: "#007AFF",
      onClick: () => navigate("/profile/gallery"),
    },
    {
      title: "Verification",
      Icon: ShieldCheck,
      iconBg: "#34C759",
      onClick: () => navigate("/profile/verification"),
    },
  ];

  return (
    <MobileAppShell className="md:hidden">
      <div className="px-4 pt-3 pb-4">
        {/* Header Card */}
        <div
          className="relative flex flex-col items-center rounded-[12px] mt-2 pt-6 pb-5 px-4 overflow-hidden"
          style={{
            background: "var(--m-surface)",
            border: "1px solid var(--m-border-glass)",
          }}
        >
          {/* Gradient accent line */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background:
                "linear-gradient(90deg, var(--m-gradient-end), var(--m-gradient-start))",
            }}
          />
          <Avatar name={profile?.full_name} size={88} />
          <div
            className="m-title1 mt-3"
            style={{ color: "var(--m-text-primary)" }}
          >
            {profile?.full_name || "Your Profile"}
          </div>

          {/* Info chips row */}
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {profile?.age != null ? (
              <span
                className="inline-flex items-center gap-1 rounded-full px-3 py-1"
                style={{
                  background: "var(--m-fill-tertiary)",
                }}
              >
                <Calendar size={14} color="var(--m-text-secondary)" />
                <span
                  className="m-footnote"
                  style={{ color: "var(--m-text-secondary)" }}
                >
                  {profile.age} yrs
                </span>
              </span>
            ) : null}
            {profile?.gender ? (
              <span
                className="inline-flex items-center gap-1 rounded-full px-3 py-1"
                style={{
                  background: "var(--m-fill-tertiary)",
                }}
              >
                <User size={14} color="var(--m-text-secondary)" />
                <span
                  className="m-footnote"
                  style={{ color: "var(--m-text-secondary)" }}
                >
                  {profile.gender}
                </span>
              </span>
            ) : null}
            {profile?.location_label ? (
              <span
                className="inline-flex items-center gap-1 rounded-full px-3 py-1"
                style={{
                  background: "var(--m-fill-tertiary)",
                }}
              >
                <MapPin size={14} color="var(--m-text-secondary)" />
                <span
                  className="m-footnote"
                  style={{ color: "var(--m-text-secondary)" }}
                >
                  {profile.location_label}
                </span>
              </span>
            ) : null}
          </div>

          <div className="mt-3">
            <Badge label={kycLabel} variant={kycVariant} />
          </div>
        </div>

        {/* Menu Section */}
        <div
          className="rounded-[12px] mt-4 overflow-hidden"
          style={{
            background: "var(--m-surface)",
            border: "1px solid var(--m-border-glass)",
          }}
        >
          {menuItems.map((m, i) => {
            const Icon = m.Icon;
            return (
              <Fragment key={m.title}>
                <button
                  type="button"
                  onClick={m.onClick}
                  className="flex w-full items-center px-4 bg-transparent border-0 text-left"
                  style={{ minHeight: 44, paddingTop: 12, paddingBottom: 12 }}
                >
                  <span
                    className="flex items-center justify-center mr-3 flex-shrink-0"
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 7,
                      background: m.iconBg,
                    }}
                  >
                    <Icon size={20} color="#fff" />
                  </span>
                  <span
                    className="m-body flex-1"
                    style={{ color: "var(--m-text-primary)" }}
                  >
                    {m.title}
                  </span>
                  <ChevronRight size={18} color="var(--m-text-tertiary)" />
                </button>
                {i < menuItems.length - 1 ? (
                  <div
                    style={{
                      height: 1,
                      background: "var(--m-separator-light)",
                      marginLeft: 58,
                    }}
                  />
                ) : null}
              </Fragment>
            );
          })}
        </div>

        {/* Preferred Personality Radar */}
        {radar ? (
          <div className="mt-5">
            <div
              className="m-footnote px-1 mb-1"
              style={{
                color: "var(--m-text-secondary)",
                textTransform: "uppercase",
                paddingLeft: 4,
              }}
            >
              PREFERRED PERSONALITY
            </div>
            <div
              className="m-caption1 px-1 mb-2"
              style={{ color: "var(--m-text-tertiary)", paddingLeft: 4 }}
            >
              What you're looking for in a partner
            </div>
            <div
              className="flex justify-center py-2 rounded-[12px]"
              style={{
                background: "var(--m-surface)",
                border: "1px solid var(--m-border-glass)",
              }}
            >
              <svg
                width={radar.SIZE}
                height={radar.SIZE}
                viewBox={`0 0 ${radar.SIZE} ${radar.SIZE}`}
              >
                {radar.gridPolygons.map((pts, idx) => (
                  <polygon
                    key={`grid-${idx}`}
                    points={pts}
                    fill="none"
                    stroke="var(--m-separator)"
                    strokeWidth={1}
                  />
                ))}
                {traits.map((_, i) => {
                  const n = traits.length;
                  const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
                  const x = radar.SIZE / 2 + Math.cos(angle) * 80;
                  const y = radar.SIZE / 2 + Math.sin(angle) * 80;
                  return (
                    <line
                      key={`axis-${i}`}
                      x1={radar.SIZE / 2}
                      y1={radar.SIZE / 2}
                      x2={x}
                      y2={y}
                      stroke="var(--m-separator-light)"
                      strokeWidth={1}
                    />
                  );
                })}
                <polygon
                  points={radar.dataPolygon}
                  fill="var(--m-primary-muted)"
                  stroke="var(--m-primary)"
                  strokeWidth={2}
                />
                {radar.dataPoints.map((p, i) => (
                  <circle
                    key={`dot-${i}`}
                    cx={p.x}
                    cy={p.y}
                    r={3.5}
                    fill="var(--m-primary)"
                  />
                ))}
                {radar.labels.map((l, i) => (
                  <Fragment key={`label-${i}`}>
                    <text
                      x={l.x}
                      y={l.y - 4}
                      fill="var(--m-text-secondary)"
                      fontSize={10}
                      fontWeight={400}
                      textAnchor={l.anchor}
                    >
                      {l.shortName}
                    </text>
                    <text
                      x={l.x}
                      y={l.y + 10}
                      fill="var(--m-primary)"
                      fontSize={11}
                      fontWeight={700}
                      textAnchor={l.anchor}
                    >
                      {l.score}
                    </text>
                  </Fragment>
                ))}
              </svg>
            </div>
          </div>
        ) : null}

        {/* Appearance Section */}
        <div className="mt-5">
          <div
            className="m-footnote px-1 mb-2"
            style={{
              color: "var(--m-text-secondary)",
              textTransform: "uppercase",
              paddingLeft: 4,
            }}
          >
            APPEARANCE
          </div>
          <div
            className="rounded-[12px] overflow-hidden"
            style={{
              background: "var(--m-surface)",
              border: "1px solid var(--m-border-glass)",
            }}
          >
            <button
              type="button"
              onClick={toggleTheme}
              className="flex w-full items-center px-4 bg-transparent border-0 text-left"
              style={{ minHeight: 44, paddingTop: 12, paddingBottom: 12 }}
            >
              <span
                className="flex items-center justify-center mr-3 flex-shrink-0"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 7,
                  background: "var(--m-fill-tertiary)",
                }}
              >
                {isDark ? (
                  <Sun size={20} color="var(--m-primary)" />
                ) : (
                  <Moon size={20} color="var(--m-primary)" />
                )}
              </span>
              <span
                className="m-body flex-1"
                style={{ color: "var(--m-text-primary)" }}
              >
                {isDark ? "Light Mode" : "Dark Mode"}
              </span>
              {isDark ? (
                <Sun size={18} color="var(--m-text-tertiary)" />
              ) : (
                <Moon size={18} color="var(--m-text-tertiary)" />
              )}
            </button>
          </div>
        </div>

        {/* Account Section */}
        <div className="mt-5">
          <div
            className="m-footnote px-1 mb-2"
            style={{
              color: "var(--m-text-secondary)",
              textTransform: "uppercase",
              paddingLeft: 4,
            }}
          >
            ACCOUNT
          </div>
          <div
            className="rounded-[12px] overflow-hidden"
            style={{
              background: "var(--m-surface)",
              border: "1px solid var(--m-border-glass)",
            }}
          >
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center px-4 bg-transparent border-0 text-left"
              style={{ minHeight: 44, paddingTop: 12, paddingBottom: 12 }}
            >
              <span
                className="flex items-center justify-center mr-3 flex-shrink-0"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 7,
                  background: "var(--m-fill-tertiary)",
                }}
              >
                <LogOut size={20} color="var(--m-text-primary)" />
              </span>
              <span
                className="m-body flex-1"
                style={{ color: "var(--m-text-primary)" }}
              >
                Sign Out
              </span>
              <ChevronRight size={18} color="var(--m-text-tertiary)" />
            </button>
            <div
              style={{
                height: 1,
                background: "var(--m-separator-light)",
                marginLeft: 58,
              }}
            />
            <button
              type="button"
              onClick={() => navigate("/profile/delete")}
              className="flex w-full items-center px-4 bg-transparent border-0 text-left"
              style={{ minHeight: 44, paddingTop: 12, paddingBottom: 12 }}
            >
              <span
                className="flex items-center justify-center mr-3 flex-shrink-0"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 7,
                  background: "var(--m-fill-tertiary)",
                }}
              >
                <Trash2 size={20} color="var(--m-error)" />
              </span>
              <span
                className="m-body flex-1"
                style={{ color: "var(--m-error)" }}
              >
                Delete Account
              </span>
              <ChevronRight size={18} color="var(--m-text-tertiary)" />
            </button>
          </div>
        </div>
      </div>
    </MobileAppShell>
  );
}
