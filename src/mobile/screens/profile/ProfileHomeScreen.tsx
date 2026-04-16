// Mobile replica of /likeminded/src/screens/profile/ProfileHomeScreen.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  Images,
  Sliders,
  ShieldCheck,
  MapPin,
  Trash2,
  LogOut,
  ChevronRight,
} from "lucide-react";
import MobileAppShell from "../../layouts/MobileAppShell";
import MobileTabBar from "../../layouts/MobileTabBar";
import {
  Avatar,
  Badge,
  LoadingSpinner,
  ProgressBar,
} from "../../components/Primitives";
import { api, type ProfileResponse } from "../../../lib/api";
import { supabase } from "../../../lib/supabaseClient";

type KycStatus = "unverified" | "pending" | "verified";

type TraitScore = { id: number; name: string; score?: number | null };

export default function MobileProfileHomeScreen() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [interestsCount, setInterestsCount] = useState(0);
  const [photosCount, setPhotosCount] = useState(0);
  const [kycStatus, setKycStatus] = useState<KycStatus>("unverified");
  const [traits, setTraits] = useState<TraitScore[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const [p, interests, photos, kyc, ts] = await Promise.all([
        api.me().catch(() => null),
        api.myInterests().catch(() => []),
        api.myPhotos().catch(() => []),
        api.meKycStatus().catch(() => null),
        api.listPersonalityTraits().catch(() => []),
      ]);
      setProfile(p);
      setInterestsCount(interests?.length ?? 0);
      setPhotosCount(
        photos?.filter((x: any) => !!x && x.status === "approved").length ?? 0
      );
      setKycStatus((kyc?.status as KycStatus) ?? "unverified");
      setTraits(
        (ts || []).filter(
          (t) => t.score !== null && t.score !== undefined
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
    navigate("/login");
  };

  if (loading) {
    return (
      <MobileAppShell className="md:hidden">
        <LoadingSpinner fullScreen />
        <MobileTabBar />
      </MobileAppShell>
    );
  }

  const menuItems = [
    {
      title: "Interests",
      Icon: Heart,
      iconBg: "var(--m-primary)",
      value: `${interestsCount} selected`,
      onClick: () => navigate("/profile/interests"),
    },
    {
      title: "Photos",
      Icon: Images,
      iconBg: "var(--m-info)",
      value: `${photosCount}/3`,
      onClick: () => navigate("/profile/gallery"),
    },
    {
      title: "Match Preferences",
      Icon: Sliders,
      iconBg: "var(--m-secondary)",
      onClick: () => navigate("/profile/preferences"),
    },
    {
      title: "Verification",
      Icon: ShieldCheck,
      iconBg: "var(--m-success)",
      value: kycLabel,
      onClick: () => navigate("/profile/verification"),
    },
  ];

  return (
    <MobileAppShell className="md:hidden">
      <div className="px-4 pt-3 pb-4">
        <h1
          className="m-large-title"
          style={{ color: "var(--m-text-primary)", marginBottom: 16 }}
        >
          Profile
        </h1>

        <div
          className="flex items-center gap-3 p-4 rounded-[16px] mb-5"
          style={{
            background:
              "linear-gradient(135deg, var(--m-gradient-start), var(--m-gradient-end))",
          }}
        >
          <Avatar name={profile?.full_name} size={64} />
          <div className="flex-1 min-w-0">
            <div
              className="m-title3 truncate"
              style={{ color: "#fff", fontWeight: 700 }}
            >
              {profile?.full_name || "Your Profile"}
            </div>
            <div
              className="m-footnote flex items-center gap-1 mt-1"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              {profile?.age ? <span>{profile.age}</span> : null}
              {profile?.location_label ? (
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {profile.location_label}
                </span>
              ) : null}
            </div>
            <div className="mt-2">
              <Badge label={kycLabel} variant={kycVariant} />
            </div>
          </div>
        </div>

        <div className="m-list-group mb-5">
          {menuItems.map((m) => {
            const Icon = m.Icon;
            return (
              <button
                key={m.title}
                type="button"
                className="m-list-row"
                onClick={m.onClick}
              >
                <span
                  className="m-icon-circle"
                  style={{ backgroundColor: m.iconBg }}
                >
                  <Icon size={18} color="#fff" />
                </span>
                <span className="m-list-row-title">{m.title}</span>
                {m.value ? (
                  <span
                    className="m-body"
                    style={{ color: "var(--m-text-secondary)" }}
                  >
                    {m.value}
                  </span>
                ) : null}
                <ChevronRight size={18} color="var(--m-text-tertiary)" />
              </button>
            );
          })}
        </div>

        {traits.length > 0 ? (
          <>
            <div
              className="m-section-title"
              style={{ marginLeft: 4, marginBottom: 8 }}
            >
              PERSONALITY TRAITS
            </div>
            <div
              className="rounded-[12px] p-4 mb-5"
              style={{
                background: "var(--m-surface)",
                border: "1px solid var(--m-border-glass)",
              }}
            >
              {traits.slice(0, 6).map((t) => (
                <div key={t.id} className="mb-3 last:mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="m-footnote"
                      style={{
                        color: "var(--m-text-primary)",
                        fontWeight: 500,
                      }}
                    >
                      {t.name}
                    </span>
                    <span
                      className="m-caption1"
                      style={{ color: "var(--m-text-secondary)" }}
                    >
                      {Math.round((t.score ?? 0) * 100)}%
                    </span>
                  </div>
                  <ProgressBar progress={t.score ?? 0} height={6} />
                </div>
              ))}
            </div>
          </>
        ) : null}

        <div className="m-list-group mb-5">
          <button
            type="button"
            className="m-list-row"
            onClick={handleSignOut}
          >
            <span
              className="m-icon-circle"
              style={{ backgroundColor: "var(--m-surface-secondary)" }}
            >
              <LogOut size={18} color="var(--m-text-primary)" />
            </span>
            <span className="m-list-row-title">Sign Out</span>
            <ChevronRight size={18} color="var(--m-text-tertiary)" />
          </button>
          <button
            type="button"
            className="m-list-row"
            onClick={() => navigate("/profile/delete")}
          >
            <span
              className="m-icon-circle"
              style={{ backgroundColor: "var(--m-error-light)" }}
            >
              <Trash2 size={18} color="var(--m-error)" />
            </span>
            <span
              className="m-list-row-title"
              style={{ color: "var(--m-error)" }}
            >
              Delete Account
            </span>
            <ChevronRight size={18} color="var(--m-text-tertiary)" />
          </button>
        </div>
      </div>

      <MobileTabBar />
    </MobileAppShell>
  );
}
