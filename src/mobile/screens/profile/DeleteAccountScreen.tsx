// Mobile replica of /likeminded/src/screens/profile/DeleteAccountScreen.tsx
// Soft-delete with 7-day recovery window. If the profile is already marked
// as deleted, render a recovery UI instead of the delete confirmation.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, XCircle, Clock } from "lucide-react";
import MobileAppShell from "../../layouts/MobileAppShell";
import MobileHeader from "../../layouts/MobileHeader";
import { GradientButton, Input, LoadingSpinner } from "../../components/Primitives";
import { api, type ProfileResponse } from "../../../lib/api";

export default function MobileDeleteAccountScreen() {
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Fetch profile on mount so we know whether it's already soft-deleted.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await api.me();
        if (!cancelled) setProfile(me);
      } catch {
        /* ignore — assume not deleted */
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isDeleted = !!profile?.deleted_at;
  const purgeDate = profile?.scheduled_purge_at
    ? new Date(profile.scheduled_purge_at).toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const isConfirmed = confirmText === "DELETE";

  const handleDelete = async () => {
    if (!isConfirmed) return;
    const ok = window.confirm(
      "Your account will be scheduled for deletion. You have 7 days to recover it before it's permanently removed. Continue?"
    );
    if (!ok) return;

    setLoading(true);
    try {
      const res = await api.deleteMe();
      // Update local profile with soft-delete timestamps so this screen
      // switches to the recovery UI. Stay signed-in so the user can recover.
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              deleted_at: res.deleted_at,
              scheduled_purge_at: res.scheduled_purge_at,
            }
          : prev
      );
      setConfirmText("");
    } catch (e: any) {
      alert(e?.message || "Failed to schedule account deletion.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async () => {
    setRecovering(true);
    try {
      await api.recoverMe();
      // Refetch profile so deleted_at is cleared.
      const fresh = await api.me();
      setProfile(fresh);
    } catch (e: any) {
      alert(e?.message || "Failed to recover account.");
    } finally {
      setRecovering(false);
    }
  };

  if (loadingProfile) {
    return (
      <MobileAppShell bare className="md:hidden">
        <MobileHeader title="Delete Account" onBack={() => navigate(-1)} />
        <LoadingSpinner fullScreen />
      </MobileAppShell>
    );
  }

  return (
    <MobileAppShell bare className="md:hidden">
      <MobileHeader
        title={isDeleted ? "Recover Account" : "Delete Account"}
        onBack={() => navigate(-1)}
      />

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {isDeleted ? (
          <>
            {/* Recovery state */}
            <div className="flex justify-center mt-8 mb-4">
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 88,
                  height: 88,
                  background: "var(--m-warning-light, rgba(255,159,10,0.12))",
                }}
              >
                <Clock size={48} color="var(--m-warning, #FF9F0A)" />
              </div>
            </div>

            <h1
              className="m-title2 text-center mb-5"
              style={{ color: "var(--m-text-primary)", fontWeight: 700 }}
            >
              Account Scheduled for Deletion
            </h1>

            <div
              className="rounded-[12px] p-4 mb-6"
              style={{
                background: "var(--m-surface)",
                border: "1px solid var(--m-warning, #FF9F0A)",
              }}
            >
              <p
                className="m-subhead"
                style={{ color: "var(--m-text-secondary)", lineHeight: 1.5 }}
              >
                Your account will be permanently deleted on{" "}
                <span
                  style={{ color: "var(--m-text-primary)", fontWeight: 700 }}
                >
                  {purgeDate || "the scheduled date"}
                </span>
                .
              </p>
              <p
                className="m-subhead"
                style={{
                  color: "var(--m-text-secondary)",
                  marginTop: 8,
                  lineHeight: 1.5,
                }}
              >
                You can recover it before then and keep all your data — your
                profile, conversations, interests, and photos.
              </p>
            </div>

            <GradientButton
              title={recovering ? "Recovering..." : "Recover My Account"}
              onClick={handleRecover}
              loading={recovering}
              disabled={recovering}
            />
          </>
        ) : (
          <>
            {/* Delete state */}
            <div className="flex justify-center mt-8 mb-4">
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 88,
                  height: 88,
                  background: "var(--m-error-light)",
                }}
              >
                <AlertTriangle size={48} color="var(--m-error)" />
              </div>
            </div>

            <h1
              className="m-title2 text-center mb-6"
              style={{ color: "var(--m-text-primary)", fontWeight: 700 }}
            >
              Delete Your Account
            </h1>

            {/* Warning bullets */}
            <div
              className="rounded-[12px] p-4 mb-5"
              style={{ background: "var(--m-error-light)" }}
            >
              <div className="flex items-center gap-3 py-2">
                <Clock
                  size={18}
                  color="var(--m-warning, #FF9F0A)"
                  className="flex-shrink-0"
                />
                <span
                  className="m-subhead"
                  style={{ color: "var(--m-error)", flex: 1 }}
                >
                  You'll have 7 days to recover your account
                </span>
              </div>
              {[
                "After 7 days, your profile will be permanently deleted",
                "All your conversations will be removed",
              ].map((t) => (
                <div key={t} className="flex items-center gap-3 py-2">
                  <XCircle
                    size={18}
                    color="var(--m-error)"
                    className="flex-shrink-0"
                  />
                  <span
                    className="m-subhead"
                    style={{ color: "var(--m-error)", flex: 1 }}
                  >
                    {t}
                  </span>
                </div>
              ))}
            </div>

            {/* Confirm input */}
            <div
              className="rounded-[12px] p-4"
              style={{
                background: "var(--m-surface)",
                border: "1px solid var(--m-border-glass)",
              }}
            >
              <div
                className="m-subhead mb-3"
                style={{ color: "var(--m-text-secondary)" }}
              >
                Type{" "}
                <span style={{ color: "var(--m-error)", fontWeight: 700 }}>
                  DELETE
                </span>{" "}
                to confirm
              </div>
              <Input
                value={confirmText}
                onChange={(e) =>
                  setConfirmText(e.target.value.toUpperCase())
                }
                placeholder="Type DELETE to confirm"
                autoCapitalize="characters"
              />
            </div>

            <div className="mt-6">
              <GradientButton
                title="Delete My Account"
                onClick={handleDelete}
                loading={loading}
                disabled={!isConfirmed}
              />
            </div>
          </>
        )}
      </div>
    </MobileAppShell>
  );
}
