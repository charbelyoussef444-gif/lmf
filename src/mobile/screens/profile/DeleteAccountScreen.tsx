// Mobile replica of /likeminded/src/screens/profile/DeleteAccountScreen.tsx
// Calls api.deleteMe() (soft-delete with 7-day recovery window).

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, XCircle } from "lucide-react";
import MobileAppShell from "../../layouts/MobileAppShell";
import MobileHeader from "../../layouts/MobileHeader";
import { GradientButton, Input } from "../../components/Primitives";
import { api } from "../../../lib/api";
import { supabase } from "../../../lib/supabaseClient";

export default function MobileDeleteAccountScreen() {
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const isConfirmed = confirmText === "DELETE";

  const handleDelete = async () => {
    if (!isConfirmed) return;
    const ok = window.confirm(
      "This action is permanent and cannot be undone. Are you absolutely sure?"
    );
    if (!ok) return;

    setLoading(true);
    try {
      await api.deleteMe();
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
    } catch (e: any) {
      alert(e?.message || "Failed to delete account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileAppShell bare className="md:hidden">
      <MobileHeader title="Delete Account" onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Warning icon */}
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
          {[
            "Your profile will be permanently deleted",
            "All your conversations will be removed",
            "This action cannot be undone",
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
      </div>
    </MobileAppShell>
  );
}
