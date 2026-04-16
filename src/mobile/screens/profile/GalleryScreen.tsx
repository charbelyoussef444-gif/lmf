// Mobile replica of /likeminded/src/screens/profile/GalleryScreen.tsx

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, X, AlertCircle } from "lucide-react";
import MobileAppShell from "../../layouts/MobileAppShell";
import MobileHeader from "../../layouts/MobileHeader";
import {
  Badge,
  GradientButton,
  LoadingSpinner,
} from "../../components/Primitives";
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
    const ok = window.confirm("Remove this photo?");
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
        <LoadingSpinner fullScreen />
      </MobileAppShell>
    );
  }

  const hasLocal = localPicks.some((p) => p !== null);

  return (
    <MobileAppShell bare className="md:hidden">
      <MobileHeader title="Photos" onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <p
          className="m-body mt-2 mb-4"
          style={{ color: "var(--m-text-secondary)" }}
        >
          Upload 3 photos to start matching. Photos go through review.
        </p>

        {!isVerified ? (
          <div
            className="flex items-start gap-2 rounded-[12px] p-3 mb-4"
            style={{
              backgroundColor: "var(--m-warning-light)",
              border: "1px solid var(--m-warning-light)",
            }}
          >
            <AlertCircle
              size={18}
              color="var(--m-warning)"
              className="flex-shrink-0 mt-0.5"
            />
            <div>
              <div
                className="m-subhead"
                style={{ color: "var(--m-warning)", fontWeight: 600 }}
              >
                Verification required
              </div>
              <p
                className="m-footnote mt-1"
                style={{ color: "var(--m-text-secondary)" }}
              >
                Complete identity verification before uploading photos.
              </p>
              <button
                type="button"
                onClick={() => navigate("/profile/verification")}
                className="m-footnote mt-2"
                style={{
                  color: "var(--m-primary)",
                  fontWeight: 600,
                  background: "transparent",
                  border: "none",
                  padding: 0,
                }}
              >
                Verify now →
              </button>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3].map((pos) => {
            const position = pos as 1 | 2 | 3;
            const local = localPicks[position - 1];
            const server = serverPhotos[position - 1];
            const previewUrl = local?.url || server?.url || null;
            return (
              <div
                key={position}
                className="relative rounded-[12px] overflow-hidden"
                style={{
                  background: "var(--m-surface)",
                  border: "1px solid var(--m-border-glass)",
                  aspectRatio: "3 / 4",
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  ref={(el) => {
                    fileInputRefs.current[position - 1] = el;
                  }}
                  onChange={(e) => onFileChange(position, e)}
                  style={{ display: "none" }}
                />
                {previewUrl ? (
                  <>
                    <img
                      src={previewUrl}
                      alt={`Photo ${position}`}
                      className="h-full w-full object-cover"
                    />
                    {server?.status === "pending" ? (
                      <div className="absolute top-2 left-2">
                        <Badge label="Pending" variant="warning" />
                      </div>
                    ) : server?.status === "rejected" ? (
                      <div className="absolute top-2 left-2">
                        <Badge label="Rejected" variant="error" />
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() =>
                        local
                          ? clearLocalPick(position)
                          : deleteServerPhoto(position)
                      }
                      className="absolute top-2 right-2 flex items-center justify-center rounded-full"
                      style={{
                        width: 28,
                        height: 28,
                        background: "rgba(0,0,0,0.6)",
                        border: "none",
                      }}
                      aria-label="Remove photo"
                    >
                      <X size={16} color="#fff" />
                    </button>
                    {server?.rejection_reason ? (
                      <div
                        className="absolute bottom-0 left-0 right-0 px-2 py-1 m-caption2"
                        style={{
                          background: "rgba(0,0,0,0.7)",
                          color: "#fff",
                        }}
                      >
                        {server.rejection_reason}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handlePick(position)}
                    className="flex h-full w-full flex-col items-center justify-center bg-transparent border-0"
                    style={{ color: "var(--m-text-secondary)" }}
                  >
                    <Camera size={32} color="var(--m-primary)" />
                    <span
                      className="m-footnote mt-2"
                      style={{ color: "var(--m-text-secondary)" }}
                    >
                      Add photo {position}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {hasLocal ? (
        <div
          className="px-4 py-3"
          style={{
            borderTop: "1px solid var(--m-separator-light)",
            paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0))",
          }}
        >
          <GradientButton
            title="Submit for Review"
            onClick={handleUpload}
            loading={saving}
          />
        </div>
      ) : null}
    </MobileAppShell>
  );
}
