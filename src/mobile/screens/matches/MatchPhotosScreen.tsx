// Mobile replica of /likeminded/src/screens/matches/MatchPhotosScreen.tsx
// Shown after both users answered "yes" to the 24h feedback prompt.

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Lock } from "lucide-react";
import MobileAppShell from "../../layouts/MobileAppShell";
import MobileHeader from "../../layouts/MobileHeader";
import { LoadingSpinner } from "../../components/Primitives";
import { api } from "../../../lib/api";

export default function MobileMatchPhotosScreen() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);
    setError("");
    api
      .conversationPhotos(conversationId)
      .then((p) => setPhotos(p || []))
      .catch((e: any) => {
        // Treat 403/404/locked errors as "locked" empty state
        const msg = String(e?.message || "");
        if (
          msg.toLowerCase().includes("not unlocked") ||
          msg.toLowerCase().includes("403") ||
          msg.toLowerCase().includes("forbidden")
        ) {
          setPhotos([]);
        } else {
          setError(msg || "Photos are not available yet");
        }
      })
      .finally(() => setLoading(false));
  }, [conversationId]);

  // Locked / empty state — matches native "Photos Locked" screen
  const renderLocked = () => (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div
        className="flex items-center justify-center"
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          background:
            "linear-gradient(135deg, var(--m-gradient-start), var(--m-gradient-end))",
          marginBottom: 16,
        }}
      >
        <Lock size={36} color="#fff" />
      </div>
      <div
        className="m-title2 mb-2"
        style={{ color: "var(--m-text-primary)" }}
      >
        Photos Locked
      </div>
      <p
        className="m-body"
        style={{
          color: "var(--m-text-secondary)",
          maxWidth: 320,
          lineHeight: 1.4,
        }}
      >
        Photos will be unlocked after you both provide positive feedback about
        this match.
      </p>
    </div>
  );

  return (
    <MobileAppShell bare className="md:hidden">
      <MobileHeader title="Match Photos" />

      <div className="flex flex-1 flex-col overflow-y-auto">
        {loading ? (
          <LoadingSpinner fullScreen message="Loading photos..." />
        ) : error ? (
          renderLocked()
        ) : photos.length === 0 ? (
          renderLocked()
        ) : (
          <div className="px-4 pb-6 pt-3">
            <div
              className="m-footnote mb-3 px-1"
              style={{
                color: "var(--m-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Unlocked after mutual positive feedback
            </div>
            <div className="grid grid-cols-2 gap-3">
              {photos.map((src, i) => (
                <div
                  key={i}
                  className="rounded-[12px] overflow-hidden"
                  style={{
                    background: "var(--m-surface-tertiary)",
                    aspectRatio: "1 / 1.25",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                  }}
                >
                  <img
                    src={src}
                    alt={`Match photo ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MobileAppShell>
  );
}
