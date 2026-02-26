// LandingPage.tsx
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, ChevronDown } from "lucide-react";
import { api } from "../lib/api"; // ✅ adjust if your api.ts path differs

import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";

function SectionShell({ id, children }: { id: string; children: ReactNode }) {
  return (
    <section
      id={id}
      className="min-h-[calc(100vh-64px)] w-full py-16 flex items-center"
      style={{ scrollSnapAlign: "start" }}
    >
      <div className="w-full">{children}</div>
    </section>
  );
}

function DiagramCard({
  title,
  subtitle,
  badge = "Preview",
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  children: ReactNode;
  footer?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-lg shadow-slate-200/60 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/75 dark:shadow-black/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            {title}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {subtitle}
          </div>
        </div>
        <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200">
          {badge}
        </span>
      </div>
      <div className="mt-4">{children}</div>
      {footer ? (
        <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

/** Diagram 1 */
function SignalFieldSVG() {
  return (
    <svg viewBox="0 0 520 260" className="w-full">
      <defs>
        <linearGradient id="sfG" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="rgba(99,102,241,0.95)" />
          <stop offset="0.5" stopColor="rgba(139,92,246,0.9)" />
          <stop offset="1" stopColor="rgba(244,114,182,0.9)" />
        </linearGradient>
        <radialGradient id="sfRG" cx="50%" cy="50%" r="68%">
          <stop offset="0" stopColor="rgba(99,102,241,0.18)" />
          <stop offset="1" stopColor="rgba(99,102,241,0)" />
        </radialGradient>
        <filter id="sfSoft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="0" y="0" width="520" height="260" rx="18" fill="url(#sfRG)" />

      <g stroke="rgba(148,163,184,0.33)" strokeWidth="1">
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={i} x1={40 + i * 55} y1="30" x2={40 + i * 55} y2="235" />
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={i} x1="24" y1={40 + i * 28} x2="496" y2={40 + i * 28} />
        ))}
      </g>

      <g stroke="rgba(148,163,184,0.52)" strokeWidth="1.2">
        <line x1="260" y1="30" x2="260" y2="235" />
        <line x1="24" y1="132" x2="496" y2="132" />
      </g>

      <path
        d="M60,165 C120,70 170,210 220,115 C270,15 325,225 370,120 C420,45 470,190 496,105"
        fill="none"
        stroke="url(#sfG)"
        strokeWidth="4"
        strokeLinecap="round"
        filter="url(#sfSoft)"
      />

      <g>
        {[
          [105, 98],
          [175, 178],
          [240, 120],
          [310, 158],
          [385, 92],
          [455, 140],
        ].map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="5"
            fill="rgba(255,255,255,0.9)"
            stroke="rgba(99,102,241,0.8)"
            strokeWidth="2"
          />
        ))}
      </g>

      <g fill="rgba(100,116,139,0.9)" fontSize="11">
        <text x="26" y="20">latent signal field (normalized)</text>
        <text x="350" y="20">posterior trace</text>
        <text x="26" y="252">invariant features emphasized</text>
      </g>
    </svg>
  );
}

/** Diagram 2 */
function CalibrationSVG() {
  return (
    <svg viewBox="0 0 520 260" className="w-full">
      <defs>
        <linearGradient id="calG" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="rgba(99,102,241,0.9)" />
          <stop offset="0.55" stopColor="rgba(139,92,246,0.9)" />
          <stop offset="1" stopColor="rgba(244,114,182,0.85)" />
        </linearGradient>
        <filter id="calSoft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect
        x="0"
        y="0"
        width="520"
        height="260"
        rx="18"
        fill="rgba(148,163,184,0.08)"
      />

      <g transform="translate(50,30)">
        <rect
          x="0"
          y="0"
          width="440"
          height="200"
          rx="14"
          fill="rgba(15,23,42,0.03)"
        />

        <g stroke="rgba(148,163,184,0.28)" strokeWidth="1">
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 40} x2="440" y2={i * 40} />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={i * 62.857}
              y1="0"
              x2={i * 62.857}
              y2="200"
            />
          ))}
        </g>

        <line
          x1="0"
          y1="200"
          x2="440"
          y2="0"
          stroke="rgba(148,163,184,0.7)"
          strokeWidth="2"
          strokeDasharray="6 6"
        />

        <path
          d="M0,192 C60,170 95,140 130,125 C175,105 220,95 275,70 C330,45 385,30 440,18"
          fill="none"
          stroke="url(#calG)"
          strokeWidth="4"
          strokeLinecap="round"
          filter="url(#calSoft)"
        />

        <g>
          {[
            [40, 178],
            [110, 138],
            [170, 112],
            [240, 92],
            [310, 60],
            [390, 32],
          ].map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="6"
              fill="rgba(255,255,255,0.9)"
              stroke="rgba(99,102,241,0.85)"
              strokeWidth="2"
            />
          ))}
        </g>

        <g fill="rgba(100,116,139,0.9)" fontSize="11">
          <text x="0" y="222">confidence →</text>
          <text x="-10" y="-10">↑ reliability</text>
        </g>
      </g>

      <g fill="rgba(100,116,139,0.9)" fontSize="11">
        <text x="26" y="20">calibration curve (reliability check)</text>
        <text x="335" y="20">stability validated</text>
        <text x="26" y="252">goal: reduce “random match” behavior</text>
      </g>
    </svg>
  );
}

/** Diagram 3 */
function GraphSVG() {
  const nodes = [
    { x: 90, y: 80 },
    { x: 165, y: 125 },
    { x: 240, y: 80 },
    { x: 310, y: 140 },
    { x: 385, y: 90 },
    { x: 450, y: 145 },
    { x: 130, y: 175 },
    { x: 220, y: 170 },
    { x: 335, y: 185 },
  ];

  const edges: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [1, 6],
    [6, 7],
    [7, 3],
    [3, 8],
    [8, 5],
    [2, 7],
    [4, 8],
  ];

  return (
    <svg viewBox="0 0 520 260" className="w-full">
      <defs>
        <linearGradient id="gg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="rgba(99,102,241,0.9)" />
          <stop offset="0.5" stopColor="rgba(139,92,246,0.9)" />
          <stop offset="1" stopColor="rgba(244,114,182,0.9)" />
        </linearGradient>
      </defs>

      <rect
        x="0"
        y="0"
        width="520"
        height="260"
        rx="18"
        fill="rgba(148,163,184,0.08)"
      />

      <g stroke="rgba(148,163,184,0.45)" strokeWidth="1.2" strokeLinecap="round">
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
          />
        ))}
      </g>

      <path
        d="M90,80 C150,42 220,45 240,80 C275,135 330,40 385,90 C420,120 436,135 450,145"
        fill="none"
        stroke="url(#gg)"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.95"
      />

      <g>
        {nodes.map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r="10" fill="rgba(99,102,241,0.22)" />
            <circle
              cx={n.x}
              cy={n.y}
              r="6.5"
              fill="rgba(255,255,255,0.92)"
              stroke="rgba(99,102,241,0.9)"
              strokeWidth="2"
            />
          </g>
        ))}
      </g>

      <g fill="rgba(100,116,139,0.9)" fontSize="11">
        <text x="26" y="20">neighborhood matching (graph topology)</text>
        <text x="352" y="20">stable clusters</text>
        <text x="26" y="252">clusters ~~ scores</text>
      </g>
    </svg>
  );
}

export default function LandingPage() {
  // ✅ real count
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);
  const [countError, setCountError] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { count } = await api.waitlistCount();
        if (mounted) setWaitlistCount(count);
      } catch {
        if (mounted) setCountError(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const displayCount = waitlistCount ?? 0;

  const avatars = useMemo(
    () => [
      "https://api.dicebear.com/7.x/thumbs/svg?seed=lm1",
      "https://api.dicebear.com/7.x/thumbs/svg?seed=lm2",
      "https://api.dicebear.com/7.x/thumbs/svg?seed=lm3",
      "https://api.dicebear.com/7.x/thumbs/svg?seed=lm4",
      "https://api.dicebear.com/7.x/thumbs/svg?seed=lm5",
    ],
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-50 transition-colors duration-300">
      {/* glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 left-0 right-0 mx-auto h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,_rgba(129,140,248,0.25),_transparent_60%)] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(244,114,182,0.18),_transparent_60%)] blur-3xl" />
      </div>

      <div className="mx-auto min-h-screen max-w-6xl px-6 sm:px-10 lg:px-20">
        {/* ✅ STICKY APP HEADER (replaces hardcoded header) */}
        <div className="sticky top-0 z-50 -mx-6 sm:-mx-10 lg:-mx-20 px-6 sm:px-10 lg:px-20 backdrop-blur-md bg-white/70 dark:bg-slate-950/60 border-b border-slate-200/60 dark:border-slate-800/60">
          <AppHeader />
        </div>

        <main style={{ scrollSnapType: "y proximity" }}>
          {/* 1) WAITLIST */}
          <SectionShell id="waitlist">
            <div className="mx-auto max-w-3xl text-center">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
                  <span className="font-semibold text-slate-900 dark:text-slate-50">
                    {displayCount.toLocaleString()}
                  </span>
                  potential matches 

                  {countError ? (
                    <span className="ml-2 text-[10px] text-rose-600 dark:text-rose-300">
                      unavailable
                    </span>
                  ) : waitlistCount === null ? (
                    <span className="ml-2 text-[10px] text-slate-500 dark:text-slate-400">
                      loading…
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 flex justify-center -space-x-2">
                  {avatars.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="h-9 w-9 rounded-full border border-white bg-white shadow-sm dark:border-slate-950"
                    />
                  ))}
                </div>

                <h1 className="mt-6 text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
                  Matching that behaves like a{" "}
                  <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 bg-clip-text text-transparent">
                    system
                  </span>
                  , not a game.
                </h1>

                <p className="mt-5 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                  Short assessment → stable representation → neighborhood-based matches. Less randomness. More signal.
                </p>

                <div className="mt-8 flex flex-col items-center gap-3">
                  <Link
                    to="/chatbot"
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 px-8 py-3 text-sm font-semibold text-white shadow-md hover:brightness-110"
                  >
                    Start Now
                  </Link>

                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    Gated access • privacy-first • stability-checked
                  </div>
                </div>

                {/* ✅ Scroll cue: arrow only (no border) */}
                <div className="mt-14 flex justify-center">
                  <a href="#matching" aria-label="Scroll to next section" className="inline-flex items-center justify-center">
                    <motion.div
                      initial={{ y: 0, opacity: 0.9 }}
                      animate={{ y: [0, 10, 0], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                      className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
                    >
                      <ChevronDown className="h-8 w-8" />
                    </motion.div>
                  </a>
                </div>
              </motion.div>
            </div>
          </SectionShell>

          {/* 2) MATCHING */}
          <SectionShell id="matching">
            <div className="mx-auto w-full max-w-6xl">
              <div className="max-w-3xl">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-500 dark:text-indigo-300">
                  Matching engine
                </div>
                <h2 className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">
                  Built like a real system:{" "}
                  <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 bg-clip-text text-transparent">
                    evaluated, calibrated, stable.
                  </span>
                </h2>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  You don’t get “a score.” You get placed into a neighborhood where alignment is high and volatility is low.
                </p>
              </div>

              <div className="mt-7 grid gap-5 lg:grid-cols-3">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.45 }}
                >
                  <DiagramCard
                    title="Signal field"
                    subtitle="Latent representation derived from structured prompts"
                    footer="Goal: isolate invariant behavior under different wording."
                  >
                    <SignalFieldSVG />
                  </DiagramCard>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.45, delay: 0.05 }}
                >
                  <DiagramCard
                    title="Calibration"
                    subtitle="Reliability check: confidence vs observed stability"
                    footer="Goal: reduce noisy outputs and random matches."
                  >
                    <CalibrationSVG />
                  </DiagramCard>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.45, delay: 0.1 }}
                >
                  <DiagramCard
                    title="Neighborhood matching"
                    subtitle="Graph topology: clusters represent human-fit zones"
                    footer="Goal: clusters over ranks; stability over hype."
                  >
                    <GraphSVG />
                  </DiagramCard>
                </motion.div>
              </div>

              <div className="mt-8 rounded-3xl border border-slate-200 bg-white/70 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/55 dark:text-slate-300">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-500 dark:text-emerald-300" />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-50">
                      Trust posture
                    </div>
                    <div className="mt-1">
                      Gated access reduces spam. We prefer compact outputs, stability checks,
                      and neighborhood logic so the system stays hard to game.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SectionShell>

          {/* Scroll cue: matching → chat */}
          <div className="mt-[-50px] flex justify-center">
            <a href="#chat" aria-label="Scroll to next section">
              <motion.div
                initial={{ y: 0, opacity: 0.9 }}
                animate={{ y: [0, 10, 0], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
              >
                <ChevronDown className="h-8 w-8" />
              </motion.div>
            </a>
          </div>

          {/* 3) CHATBOT */}
          <SectionShell id="chat">
            <div className="mx-auto max-w-6xl">
              <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
                <div className="max-w-2xl">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-500">
                    The assessment layer
                  </div>

                  <h2 className="mt-3 text-4xl font-semibold leading-[1.08] sm:text-5xl">
                    A calm conversation designed for{" "}
                    <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 bg-clip-text text-transparent">
                      signal extraction.
                    </span>
                  </h2>

                  <p className="mt-6 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                    This is not therapy and not vibes. It’s structured prompting: the same idea is tested multiple ways to find what stays stable
                    under different wording.
                  </p>

                  <div className="mt-8 rounded-3xl border border-slate-200 bg-white/70 p-6 text-base dark:border-slate-700 dark:bg-slate-900/60">
                    <div className="font-semibold text-slate-900 dark:text-slate-50">
                      Output philosophy
                    </div>
                    <ul className="mt-4 space-y-3 text-slate-600 dark:text-slate-300">
                      <li>• Compact representation — not a public transcript</li>
                      <li>• Consistency scoring across prompts</li>
                      <li>• Neighborhood-based matching, not ranking</li>
                    </ul>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45 }}
                  className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900/80"
                >
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4 text-sm dark:border-slate-700">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 via-violet-500 to-rose-500 text-white font-semibold">
                      LM
                    </div>
                    <div>
                      <div className="font-semibold">LikeMinded guide</div>
                      <div className="text-xs text-slate-500">Assessment chat</div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4 text-sm">
                    <div className="rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
                      If you feel misunderstood, what do you do first: clarify calmly, shut down, or push harder?
                    </div>

                    <div className="ml-auto w-fit rounded-2xl bg-indigo-500 px-4 py-3 text-white">
                      I clarify once. If it keeps happening, I go quiet and reset.
                    </div>

                    <div className="rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
                      That response stays consistent across prompts. We treat it as a stable signal and reduce matches that demand constant intensity.
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-300">
                      Output: compact representation + stability score (preview)
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </SectionShell>

          {/* ✅ APP FOOTER (replaces hardcoded footer) */}
          <AppFooter />
        </main>
      </div>
    </div>
  );
}
