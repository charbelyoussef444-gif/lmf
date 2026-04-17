// Mobile replica of /likeminded/src/screens/assessment/AssessmentHomeScreen.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Activity, BarChart3 } from "lucide-react";
import MobileAppShell from "../../layouts/MobileAppShell";
import {
  GradientButton,
  Badge,
  LoadingSpinner,
} from "../../components/Primitives";
import { api } from "../../../lib/api";

export default function MobileAssessmentHomeScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasHistory, setHasHistory] = useState(false);
  const [phase, setPhase] = useState<"self" | "pref" | "done" | undefined>();
  const [progressPercent, setProgressPercent] = useState(0);
  const [hasTraits, setHasTraits] = useState(false);

  const load = async () => {
    try {
      const [history, traits] = await Promise.all([
        api.chatbotHistory().catch(() => null),
        api.listPersonalityTraits().catch(() => []),
      ]);
      if (history) {
        setHasHistory((history.messages?.length ?? 0) > 0);
        setPhase(history.phase);
        const p = history.progress;
        const total = (p?.self_total ?? 0) + (p?.pref_total ?? 0);
        const filled = (p?.self_filled ?? 0) + (p?.pref_filled ?? 0);
        setProgressPercent(total > 0 ? Math.round((filled / total) * 100) : 0);
      }
      setHasTraits(
        Array.isArray(traits) &&
          traits.some((t) => t.score !== null && t.score !== undefined)
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const status: "completed" | "in_progress" | "not_started" =
    hasTraits || phase === "done"
      ? "completed"
      : hasHistory
      ? "in_progress"
      : "not_started";

  const statusLabel =
    status === "completed"
      ? "Completed"
      : status === "in_progress"
      ? "In Progress"
      : "Not Started";
  const statusVariant: "success" | "warning" | "default" =
    status === "completed"
      ? "success"
      : status === "in_progress"
      ? "warning"
      : "default";
  const ctaTitle =
    status === "completed"
      ? "View Results"
      : status === "in_progress"
      ? "Continue Assessment"
      : "Start Assessment";

  if (loading) {
    return (
      <MobileAppShell className="md:hidden">
        <LoadingSpinner fullScreen />
      </MobileAppShell>
    );
  }

  return (
    <MobileAppShell className="md:hidden">
      <div className="px-4 pt-3 pb-4">
        <h1
          className="m-large-title"
          style={{ color: "var(--m-text-primary)", marginBottom: 16 }}
        >
          Assessment
        </h1>

        <div
          className="relative rounded-[16px] p-6 mb-5"
          style={{
            background:
              "linear-gradient(135deg, var(--m-gradient-start), var(--m-gradient-end))",
          }}
        >
          <div className="absolute top-3 right-3">
            <Badge label={statusLabel} variant={statusVariant} />
          </div>
          <div
            className="flex items-center justify-center mx-auto rounded-full mb-3"
            style={{
              width: 64,
              height: 64,
              background: "rgba(255,255,255,0.2)",
            }}
          >
            <ClipboardList size={32} color="#fff" />
          </div>
          <h2
            className="m-title2 text-center"
            style={{ color: "#fff", marginBottom: 8 }}
          >
            Personality Assessment
          </h2>
          <p
            className="m-subhead text-center"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            Discover your personality traits through our AI-powered assessment
          </p>
        </div>

        <div className="m-list-group mb-5">
          <div className="m-list-row" style={{ cursor: "default" }}>
            <span
              className="m-icon-circle"
              style={{
                backgroundColor: "color-mix(in srgb, var(--m-info) 10%, transparent)",
                width: 32,
                height: 32,
                borderRadius: 8,
              }}
            >
              <Activity size={18} color="var(--m-info)" />
            </span>
            <span
              className="m-list-row-title"
              style={{ color: "var(--m-text-primary)" }}
            >
              Status
            </span>
            <Badge label={statusLabel} variant={statusVariant} />
          </div>
          {status === "in_progress" ? (
            <div className="m-list-row" style={{ cursor: "default" }}>
              <span
                className="m-icon-circle"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--m-warning) 10%, transparent)",
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                }}
              >
                <BarChart3 size={18} color="var(--m-warning)" />
              </span>
              <span
                className="m-list-row-title"
                style={{ color: "var(--m-text-primary)" }}
              >
                Progress
              </span>
              <span
                className="m-body"
                style={{ color: "var(--m-text-secondary)", fontWeight: 500 }}
              >
                {progressPercent}%
              </span>
            </div>
          ) : null}
        </div>

        <div
          className="m-section-title"
          style={{ marginLeft: 4, marginBottom: 8 }}
        >
          HOW IT WORKS
        </div>
        <div className="m-list-group mb-5">
          {[
            {
              n: "1",
              title: "Answer Questions",
              desc: "Share about your personality and preferences",
            },
            {
              n: "2",
              title: "AI Analysis",
              desc: "Our AI analyzes your responses for key traits",
            },
            {
              n: "3",
              title: "Get Matched",
              desc: "Find your most compatible matches",
            },
          ].map((s) => (
            <div key={s.n} className="m-list-row" style={{ cursor: "default" }}>
              <span
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 30,
                  height: 30,
                  background:
                    "linear-gradient(135deg, var(--m-gradient-start), var(--m-gradient-end))",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                {s.n}
              </span>
              <div className="flex-1">
                <div
                  className="m-body"
                  style={{ color: "var(--m-text-primary)", fontWeight: 600 }}
                >
                  {s.title}
                </div>
                <div
                  className="m-footnote"
                  style={{ color: "var(--m-text-secondary)", marginTop: 2 }}
                >
                  {s.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        <GradientButton title={ctaTitle} onClick={() => navigate("/chatbot/session")} />
      </div>
    </MobileAppShell>
  );
}
