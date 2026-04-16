// Mobile replica of /likeminded/src/screens/profile/GalleryScreen.tsx

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  X,
  Lock,
  ChevronRight,
  RefreshCw,
  Info,
} from "lucide-react";
import MobileAppShell from "../../layouts/MobileAppShell";
import MobileHeader from "../../layouts/MobileHeader";
import { GradientButton, LoadingSpinner } from "../../components/Primitives";
import { api, type GalleryPhotoSlot } from "../../../lib/api";

type LocalPick = { file: File; url: string };

export default function MobileGalleryScreen() {
  const navigate = useNavigate();
  const [serverPhotos, setServerPhotos] = useState<Array<GalleryPhotoSlot | null>>(
    [null, null, null]
  );
  const [localPicks, setLocalPicks] = useState<Array<LocalPick | null>>([
    null,
    null,
    null,
  ]);
  const [kycStatus, setKycStatus] = useState<"unverified" | "pending" | "verified">(
    "unverified"
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRefs = useRef<Array<HTMLInputElement | null>>([null, null, null]);

  const refresh = async () => {
    try {
      const [photos, kyc] = await Promise.all([
        api.myPhotos().catch(() => [null, null, null]),
        api.meKycStatus().catch(() => null),
      ]);
      setServerPhotos([
        photos?.[0] ?? null,
        photos?.[1] ?? null,
        photos?.[2] ?? null,
      ]);
      setKycStatus((kyc?.status as any) ?? "unverified");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const isVerified = kycStatus === "verified";

  const handlePick = (position: 1 | 2 | 3) => {
    if (!isVerified) {
      const ok = window.confirm(
        "Verification required. Would you like to verify now?"
      );
      if (ok) navigate("/profile/verification");
      return;
    }
    fileInputRefs.current[position - 1]?.click();
  };

  const onFileChange = (
    position: 1 | 2 | 3,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setLocalPicks((prev) => {
      const next = [...prev];
      const previous = next[position - 1];
      if (previous) URL.revokeObjectURL(previous.url);
      next[position - 1] = { file: f, url };
      return next;
    });
    e.target.value = "";
  };

  const clearLocalPick = (position: 1 | 2 | 3) => {
    setLocalPicks((prev) => {
      const next = [...prev];
      const pick = next[position - 1];
      if (pick) URL.revokeObjectURL(pick.url);
      next[position - 1] = null;
      return next;
    });
  };

  const deleteServerPhoto = async (position: 1 | 2 | 3) => {
    const ok = window.confirm("Are you sure you want to remove this photo?");
    if (!ok) return;
    try {
      await api.deleteGalleryPhoto(position);
      refresh();
    } catch (e: any) {
      alert(e?.message || "Failed to delete photo");
    }
  };

  const handleUpload = async () => {
    setSaving(true);
    try {
      const jobs: Promise<unknown>[] = [];
      localPicks.forEach((p, i) => {
        if (p) jobs.push(api.uploadGalleryPhoto(p.file, (i + 1) as 1 | 2 | 3));
      });
      await Promise.all(jobs);
      // Cleanup object URLs
      localPicks.forEach((p) => p && URL.revokeObjectURL(p.url));
      setLocalPicks([null, null, null]);
      await refresh();
      alert(
        "Submitted. Your photos were sent for review. You will be notified if anything needs to change."
      );
    } catch (e: any) {
      alert(e?.message || "Failed to upload photos");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MobileAppShell bare className="md:hidden">
        <MobileHeader title="Photos" onBack={() => navigate(-1)} />
        <LoadingSpinner fullScreen message="Loading photos..." />
      </MobileAppShell>
    );
  }

  const approvedCount = serverPhotos.filter(
    (s) => s && s.status === "approved"
  ).length;
  const moreNeeded = Math.max(0, 3 - approvedCount);
  const hasLocal = localPicks.some((p) => p !== null);

  // Status badge color helpers
  const badgeStyles = (kind: "ready" | "pending" | "rejected") => {
    if (kind === "ready") {
      return {
        background: "var(--m-text-tertiary)",
        color: "#fff",
      } as const;
    }
    if (kind === "pending") {
      return {
        background: "var(--m-warning)",
        color: "#fff",
      } as const;
    }
    return {
      background: "var(--m-error)",
      color: "#fff",
    } as const;
  };

  const renderStatusBadge = (label: string, kind: "ready" | "pending" | "rejected") => (
    <div
      className="absolute m-caption2"
      style={{
        top: 8,
        left: 8,
        paddingLeft: 8,
        paddingRight: 8,
        paddingTop: 2,
        paddingBottom: 2,
        borderRadius: 6,
        fontWeight: 700,
        ...badgeStyles(kind),
      }}
    >
      {label}
    </div>
  );

  const renderDeleteButton = (onClick: () => void, label: string) => (
    <button
      type="button"
      onClick={onClick}
      className="absolute flex items-center justify-center"
      style={{
        top: 8,
        right: 8,
        width: 26,
        height: 26,
        borderRadius: 13,
        background: "var(--m-error)",
        border: "none",
        boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
      }}
      aria-label={label}
    >
      <X size={14} color="#fff" />
    </button>
  );

  return (
    <MobileAppShell bare className="md:hidden">
      <MobileHeader title="Photos" onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Header info */}
        <div className="mt-3 mb-4">
          <div
            className="m-title3"
            style={{
              color: "var(--m-text-primary)",
              marginBottom: 4,
              fontWeight: 700,
            }}
          >
            Add at least 3 photos
          </div>
          <div
            className="m-subhead"
            style={{ color: "var(--m-text-secondary)" }}
          >
            {approvedCount}/3 approved
            {approvedCount < 3 ? (
              <span style={{ color: "var(--m-warning)" }}>
                {" \u2014 "}
                {moreNeeded} more needed
              </span>
            ) : null}
          </div>
        </div>

        {/* Verification gate banner */}
        {!isVerified ? (
          <div
            className="rounded-[12px] mb-4"
            style={{
              background: "var(--m-fill, var(--m-surface-tertiary))",
              borderLeft: "4px solid var(--m-warning)",
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
          >
            <div className="flex items-center mb-1" style={{ gap: 6 }}>
              <Lock size={18} color="var(--m-warning)" />
              <div
                className="m-headline"
                style={{ color: "var(--m-text-primary)", fontWeight: 700 }}
              >
                Verification required
              </div>
            </div>
            <p
              className="m-subhead"
              style={{
                color: "var(--m-text-secondary)",
                lineHeight: "20px",
                marginBottom: 8,
              }}
            >
              {kycStatus === "pending"
                ? "Your verification is being reviewed. You will be able to upload gallery photos as soon as you are verified."
                : "You must complete identity verification before you can upload gallery photos."}
            </p>
            {kycStatus !== "pending" ? (
              <button
                type="button"
                onClick={() => navigate("/profile/verification")}
                className="flex items-center bg-transparent border-0"
                style={{
                  padding: 0,
                  paddingTop: 4,
                  paddingBottom: 4,
                }}
                aria-label="Go to verification"
              >
                <span
                  className="m-subhead"
                  style={{
                    color: "var(--m-primary)",
                    fontWeight: 600,
                    marginRight: 2,
                  }}
                >
                  Verify identity
                </span>
                <ChevronRight size={14} color="var(--m-primary)" />
              </button>
            ) : null}
          </div>
        ) : null}

        {/* Photo Grid */}
        <div className="grid grid-cols-2" style={{ gap: 16 }}>
          {[1, 2, 3].map((pos) => {
            const position = pos as 1 | 2 | 3;
            const local = localPicks[position - 1];
            const server = serverPhotos[position - 1];

            return (
              <div key={position} style={{ width: "100%" }}>
                <input
                  type="file"
                  accept="image/*"
                  ref={(el) => {
                    fileInputRefs.current[position - 1] = el;
                  }}
                  onChange={(e) => onFileChange(position, e)}
                  style={{ display: "none" }}
                />

                {local ? (
                  <div
                    className="relative overflow-hidden"
                    style={{
                      width: "100%",
                      aspectRatio: "3 / 4",
                      borderRadius: 12,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.10)",
                    }}
                  >
                    <img
                      src={local.url}
                      alt={`Photo ${position} ready to upload`}
                      className="h-full w-full object-cover"
                    />
                    {renderStatusBadge("Ready", "ready")}
                    {renderDeleteButton(
                      () => clearLocalPick(position),
                      `Remove local photo ${position}`
                    )}
                  </div>
                ) : server && server.url ? (
                  <>
                    <div
                      className="relative overflow-hidden"
                      style={{
                        width: "100%",
                        aspectRatio: "3 / 4",
                        borderRadius: 12,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.10)",
                        border:
                          server.status === "rejected"
                            ? "3px solid var(--m-error)"
                            : "none",
                      }}
                    >
                      <img
                        src={server.url}
                        alt={`Photo ${position}`}
                        className="h-full w-full object-cover"
                      />
                      {server.status === "pending"
                        ? renderStatusBadge("Pending", "pending")
                        : null}
                      {server.status === "rejected"
                        ? renderStatusBadge("Rejected", "rejected")
                        : null}
                      {renderDeleteButton(
                        () => deleteServerPhoto(position),
                        `Delete photo ${position}`
                      )}
                    </div>
                    {server.status === "rejected" && server.rejection_reason ? (
                      <div
                        className="m-caption1"
                        style={{
                          color: "var(--m-error)",
                          marginTop: 4,
                        }}
                      >
                        {server.rejection_reason}
                      </div>
                    ) : null}
                    {server.status === "rejected" && isVerified ? (
                      <button
                        type="button"
                        onClick={() => handlePick(position)}
                        className="flex items-center bg-transparent border-0"
                        style={{
                          padding: 0,
                          paddingTop: 4,
                          paddingBottom: 4,
                          marginTop: 4,
                        }}
                        aria-label={`Replace photo ${position}`}
                      >
                        <RefreshCw size={14} color="var(--m-primary)" />
                        <span
                          className="m-caption1"
                          style={{
                            color: "var(--m-primary)",
                            fontWeight: 600,
                            marginLeft: 4,
                          }}
                        >
                          Replace
                        </span>
                      </button>
                    ) : null}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handlePick(position)}
                    disabled={!isVerified}
                    className="flex w-full flex-col items-center justify-center bg-transparent"
                    style={{
                      aspectRatio: "3 / 4",
                      background:
                        "var(--m-fill, var(--m-surface-tertiary))",
                      borderRadius: 12,
                      border: "2px dashed var(--m-border-glass, var(--m-separator-light))",
                      opacity: isVerified ? 1 : 0.45,
                      cursor: isVerified ? "pointer" : "default",
                    }}
                    aria-label={
                      isVerified
                        ? "Add photo"
                        : "Verification required to add photo"
                    }
                  >
                    {isVerified ? (
                      <Plus size={32} color="var(--m-text-tertiary)" />
                    ) : (
                      <Lock size={24} color="var(--m-text-tertiary)" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Upload button */}
        {hasLocal ? (
          <div style={{ marginTop: 32 }}>
            <GradientButton
              title={saving ? "Uploading..." : "Upload for review"}
              onClick={handleUpload}
              loading={saving}
              disabled={saving}
            />
          </div>
        ) : null}

        {/* Info footer */}
        <div
          className="flex"
          style={{
            alignItems: "flex-start",
            marginTop: 32,
            paddingLeft: 4,
            paddingRight: 4,
          }}
        >
          <Info
            size={18}
            color="var(--m-text-tertiary)"
            style={{ marginRight: 8, marginTop: 1, flexShrink: 0 }}
          />
          <p
            className="m-footnote"
            style={{
              color: "var(--m-text-tertiary)",
              flex: 1,
              lineHeight: "18px",
              margin: 0,
            }}
          >
            Photos are reviewed by our team before they count toward matching.
            Rejected photos will show a reason so you can upload a new one.
          </p>
        </div>
      </div>
    </MobileAppShell>
  );
}
