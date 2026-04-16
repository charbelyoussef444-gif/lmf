// Mobile replica of /likeminded/src/screens/matches/MatchPhotosScreen.tsx
// Shown after both users answered "yes" to the 24h feedback prompt.

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Images, Lock } from "lucide-react";
import MobileAppShell from "../../layouts/MobileAppShell";
import MobileHeader from "../../layouts/MobileHeader";
import { LoadingSpinner, EmptyState } from "../../components/Primitives";
import { api } from "../../../lib/api";

export default function MobileMatchPhotosScreen() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);
    api
      .conversationPhotos(conversationId)
      .then((p) => setPhotos(p || []))
      .catch((e: any) =>
        setError(e?.message || "Photos are not available yet")
      )
      .finally(() => setLoading(false));
  }, [conversationId]);

  return (
    <MobileAppShell bare className="md:hidden">
      <MobileHeader title="Match Photos" />

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {loading ? (
          <LoadingSpinner fullScreen />
        ) : error ? (
          <EmptyState
            icon={<Lock size={36} color="var(--m-warning)" />}
            title="Photos not available"
            description={error}
          />
        ) : photos.length === 0 ? (
          <EmptyState
            icon={<Images size={36} color="var(--m-text-tertiary)" />}
            title="No photos yet"
            description="Your match hasn't uploaded photos yet"
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 mt-3">
            {photos.map((src, i) => (
              <div
                key={i}
                className="rounded-[12px] overflow-hidden aspect-[3/4]"
                style={{ background: "var(--m-surface)" }}
              >
                <img
                  src={src}
                  alt={`Match photo ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileAppShell>
  );
}
