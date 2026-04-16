// Mobile replica of /likeminded/src/screens/profile/VerificationScreen.tsx
// Web uses <input type="file" capture="environment|user"> to open the device camera on mobile.

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, CheckCircle2, RotateCcw } from "lucide-react";
import MobileAppShell from "../../layouts/MobileAppShell";
import MobileHeader from "../../layouts/MobileHeader";
import {
  Badge,
  GradientButton,
  LoadingSpinner,
} from "../../components/Primitives";
import { api } from "../../../lib/api";

type KycStatus = "unverified" | "pending" | "verified";

type LocalPhoto = { file: File; url: string };

export default function MobileVerificationScreen() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<KycStatus>("unverified");
  const [reasons, setReasons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [idPhoto, setIdPhoto] = useState<LocalPhoto | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<LocalPhoto | null>(null);

  const idInputRef = useRef<HTMLInputElement | null>(null);
  const selfieInputRef = useRef<HTMLInputElement | null>(null);

  const refresh = async () => {
    try {
      const s = await api.meKycStatus();
      setStatus((s?.status as KycStatus) ?? "unverified");
      const raw = s?.reasons ?? [];
      const parsed = raw.map((r: any) =>
        typeof r === "string" ? r : r?.reason ?? String(r)
      );
      setReasons(parsed);
    } catch {
      setStatus("unverified");
      setReasons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handlePick = (setter: (p: LocalPhoto | null) => void) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setter({ file: f, url });
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!idPhoto || !selfiePhoto) {
      alert("Please capture both required photos.");
      return;
    }
    setSubmitting(true);
    try {
      await api.meKycUpload([idPhoto.file, selfiePhoto.file]);
      if (idPhoto) URL.revokeObjectURL(idPhoto.url);
      if (selfiePhoto) URL.revokeObjectURL(selfiePhoto.url);
      setIdPhoto(null);
      setSelfiePhoto(null);
      alert("Your verification documents have been submitted for review.");
      await refresh();
    } catch (e: any) {
      alert(e?.message || "Failed to submit verification documents.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    const ok = window.confirm("Cancel pending verification and start over?");
    if (!ok) return;
    setCancelling(true);
    try {
      await api.meKycCancel();
      await refresh();
    } catch (e: any) {
      alert(e?.message || "Failed to cancel verification.");
    } finally {
      setCancelling(false);
    }
  };

  const retake = (which: "id" | "selfie") => {
    if (which === "id" && idPhoto) {
      URL.revokeObjectURL(idPhoto.url);
      setIdPhoto(null);
    }
    if (which === "selfie" && selfiePhoto) {
      URL.revokeObjectURL(selfiePhoto.url);
      setSelfiePhoto(null);
    }
  };

  if (loading) {
    return (
      <MobileAppShell bare className="md:hidden">
        <MobileHeader title="Verification" onBack={() => navigate(-1)} />
        <LoadingSpinner fullScreen />
      </MobileAppShell>
    );
  }

  const statusLabel =
    status === "verified"
      ? "Verified"
      : status === "pending"
      ? "Pending Review"
      : "Not Verified";
  const statusVariant: "success" | "warning" | "error" =
    status === "verified"
      ? "success"
      : status === "pending"
      ? "warning"
      : "error";

  return (
    <MobileAppShell bare className="md:hidden">
      <MobileHeader title="Verification" onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Status Card */}
        <div
          className="rounded-[12px] p-4 mt-4"
          style={{
            background: "var(--m-surface)",
            border: "1px solid var(--m-border-glass)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className="m-headline"
              style={{ color: "var(--m-text-primary)" }}
            >
              Verification Status
            </span>
            <Badge label={statusLabel} variant={statusVariant} />
          </div>
          {status === "verified" ? (
            <p
              className="m-subhead"
              style={{ color: "var(--m-text-secondary)" }}
            >
              Your identity has been verified. You're all set!
            </p>
          ) : null}
          {status === "pending" ? (
            <>
              <p
                className="m-subhead mb-3"
                style={{ color: "var(--m-text-secondary)" }}
              >
                Your documents are being reviewed. This usually takes 24-48
                hours.
              </p>
              <GradientButton
                title="Cancel Verification"
                variant="outline"
                size="sm"
                onClick={handleCancel}
                loading={cancelling}
              />
            </>
          ) : null}
        </div>

        {/* Rejection Reasons */}
        {reasons.length > 0 ? (
          <div
            className="rounded-[12px] p-4 mt-3"
            style={{ background: "var(--m-error-light)" }}
          >
            <div
              className="m-subhead mb-1"
              style={{ color: "var(--m-error)", fontWeight: 600 }}
            >
              Rejection reasons:
            </div>
            {reasons.map((r, i) => (
              <div
                key={i}
                className="m-footnote"
                style={{ color: "var(--m-error)", marginBottom: 2 }}
              >
                • {r}
              </div>
            ))}
          </div>
        ) : null}

        {/* Steps — only when unverified */}
        {status === "unverified" ? (
          <>
            <div
              className="m-section-title"
              style={{ marginTop: 20, marginBottom: 8, paddingLeft: 4 }}
            >
              VERIFICATION STEPS
            </div>
            <div
              className="rounded-[12px] overflow-hidden"
              style={{
                background: "var(--m-surface)",
                border: "1px solid var(--m-border-glass)",
              }}
            >
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={idInputRef}
                onChange={handlePick(setIdPhoto)}
                style={{ display: "none" }}
              />
              <input
                type="file"
                accept="image/*"
                capture="user"
                ref={selfieInputRef}
                onChange={handlePick(setSelfiePhoto)}
                style={{ display: "none" }}
              />

              <button
                type="button"
                onClick={() => idInputRef.current?.click()}
                className="flex w-full items-center gap-3 px-4 py-3 bg-transparent border-0 text-left"
                style={{ minHeight: 64 }}
                aria-label={
                  idPhoto
                    ? "ID photo captured. Tap to retake"
                    : "Capture ID card or passport photo"
                }
              >
                <span
                  className="flex-shrink-0 flex items-center justify-center rounded-full"
                  style={{
                    width: 30,
                    height: 30,
                    background:
                      "linear-gradient(135deg, var(--m-gradient-start), var(--m-gradient-end))",
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  1
                </span>
                <div className="flex-1">
                  <div
                    className="m-body"
                    style={{
                      color: "var(--m-text-primary)",
                      fontWeight: 600,
                    }}
                  >
                    ID Card / Passport
                  </div>
                  <div
                    className="m-footnote"
                    style={{ color: "var(--m-text-secondary)" }}
                  >
                    Take a photo of the front of your ID
                  </div>
                </div>
                {idPhoto ? (
                  <CheckCircle2 size={24} color="var(--m-success)" />
                ) : (
                  <Camera size={24} color="var(--m-text-tertiary)" />
                )}
              </button>

              <div
                style={{
                  height: 1,
                  background: "var(--m-separator-light)",
                  marginLeft: 62,
                }}
              />

              <button
                type="button"
                onClick={() => selfieInputRef.current?.click()}
                className="flex w-full items-center gap-3 px-4 py-3 bg-transparent border-0 text-left"
                style={{ minHeight: 64 }}
                aria-label={
                  selfiePhoto
                    ? "Selfie captured. Tap to retake"
                    : "Take a face selfie"
                }
              >
                <span
                  className="flex-shrink-0 flex items-center justify-center rounded-full"
                  style={{
                    width: 30,
                    height: 30,
                    background:
                      "linear-gradient(135deg, var(--m-gradient-start), var(--m-gradient-end))",
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  2
                </span>
                <div className="flex-1">
                  <div
                    className="m-body"
                    style={{
                      color: "var(--m-text-primary)",
                      fontWeight: 600,
                    }}
                  >
                    Face Selfie
                  </div>
                  <div
                    className="m-footnote"
                    style={{ color: "var(--m-text-secondary)" }}
                  >
                    Take a clear selfie of your face
                  </div>
                </div>
                {selfiePhoto ? (
                  <CheckCircle2 size={24} color="var(--m-success)" />
                ) : (
                  <Camera size={24} color="var(--m-text-tertiary)" />
                )}
              </button>
            </div>

            {/* Photo Previews */}
            {idPhoto || selfiePhoto ? (
              <div className="mt-4 flex gap-3">
                {idPhoto ? (
                  <div className="flex-1 flex flex-col items-center">
                    <img
                      src={idPhoto.url}
                      alt="ID preview"
                      className="w-full rounded-[12px]"
                      style={{
                        height: 140,
                        objectFit: "cover",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => retake("id")}
                      className="mt-2 flex items-center gap-1 bg-transparent border-0"
                      aria-label="Retake ID photo"
                    >
                      <RotateCcw size={16} color="var(--m-secondary)" />
                      <span
                        className="m-subhead"
                        style={{
                          color: "var(--m-secondary)",
                          fontWeight: 600,
                        }}
                      >
                        Retake
                      </span>
                    </button>
                  </div>
                ) : null}
                {selfiePhoto ? (
                  <div className="flex-1 flex flex-col items-center">
                    <img
                      src={selfiePhoto.url}
                      alt="Selfie preview"
                      className="w-full rounded-[12px]"
                      style={{
                        height: 140,
                        objectFit: "cover",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => retake("selfie")}
                      className="mt-2 flex items-center gap-1 bg-transparent border-0"
                      aria-label="Retake selfie"
                    >
                      <RotateCcw size={16} color="var(--m-secondary)" />
                      <span
                        className="m-subhead"
                        style={{
                          color: "var(--m-secondary)",
                          fontWeight: 600,
                        }}
                      >
                        Retake
                      </span>
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Submit */}
            <div className="mt-6">
              <GradientButton
                title="Submit for Review"
                onClick={handleSubmit}
                loading={submitting}
                disabled={!idPhoto || !selfiePhoto}
              />
            </div>
          </>
        ) : null}
      </div>
    </MobileAppShell>
  );
}
