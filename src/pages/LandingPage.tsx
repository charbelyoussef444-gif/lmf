// LandingPage.tsx
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  ChevronDown,
  Star,
  MessageSquareHeart,
  Sparkles,
  ArrowRight,
} from "lucide-react";
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
    <div className="rounded-3xl border border-slate-200 bg-white/75 p-5 shadow-lg shadow-slate-200/60 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/55 dark:shadow-black/40">
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
        <text x="26" y="20">what stays true about you</text>
        <text x="360" y="20">clearer direction</text>
        <text x="26" y="252">less guessing, more “this fits”</text>
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
          <text x="-10" y="-10">↑ trust</text>
        </g>
      </g>

      <g fill="rgba(100,116,139,0.9)" fontSize="11">
        <text x="26" y="20">sanity-checks before we match you</text>
        <text x="345" y="20">less randomness</text>
        <text x="26" y="252">so your time doesn’t get wasted</text>
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
        <text x="26" y="20">finding your “people”</text>
        <text x="360" y="20">natural groups</text>
        <text x="26" y="252">good fit beats endless options</text>
      </g>
    </svg>
  );
}

function StarsRow({ n = 5 }: { n?: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

function MiniRecoCard({
  name,
  meta,
  text,
  tag,
  align = "left",
}: {
  name: string;
  meta: string;
  text: string;
  tag: string;
  align?: "left" | "right";
}) {
  return (
    <div
      className={[
        "rounded-3xl border border-slate-200 bg-white/65 p-5 shadow-sm backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/45",
        align === "right" ? "lg:mt-16" : "lg:mt-6",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {name}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{meta}</div>
          </div>
          <div className="mt-1">
            <StarsRow />
          </div>
        </div>
        <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950/35 dark:text-slate-200">
          {tag}
        </span>
      </div>

      <div className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
        “{text}”
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1">
          <MessageSquareHeart className="h-4 w-4 text-rose-500/80" />
          early feedback
        </span>
        <span className="font-semibold bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 bg-clip-text text-transparent">
          feels human
        </span>
      </div>
    </div>
  );
}

export default function LandingPage() {
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

  const heroRecos = useMemo(
    () => [
      {
        name: "Maya",
        meta: "23 • Beirut",
        text: "It feels calm. The questions actually filter people who want the same pace.",
        tag: "Less noise",
      },
      {
        name: "Karim",
        meta: "27 • Tripoli",
        text: "The matches make sense. It’s not the usual ‘how did we even get paired?’",
        tag: "More signal",
      },
    ],
    []
  );

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <div className="mx-auto min-h-screen max-w-6xl px-6 sm:px-10 lg:px-20">
        {/* Sticky header stays glass */}
        <div className="sticky top-0 z-50 -mx-6 sm:-mx-10 lg:-mx-20 px-6 sm:px-10 lg:px-20 backdrop-blur-xl bg-white/65 dark:bg-slate-950/45 border-b border-slate-200/50 dark:border-slate-800/50">
          <AppHeader />
        </div>

        <main style={{ scrollSnapType: "y proximity" }}>
          {/* 1) HERO */}
          <SectionShell id="waitlist">
            <div className="mx-auto w-full max-w-6xl">
              <div className="grid items-center gap-8 lg:grid-cols-[1fr_2fr_1fr]">
                {/* Left reco (desktop only) */}
                <div className="hidden lg:block">
                  <MiniRecoCard {...heroRecos[0]} align="left" />
                </div>

                {/* Center hero */}
                <div className="text-center">
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                  >
                    {/* Guarantee pill */}
                    <div className="flex justify-center">
                      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/70 px-4 py-2 text-xs font-semibold text-emerald-800 shadow-sm backdrop-blur-xl dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-emerald-200">
                        <ShieldCheck className="h-4 w-4" />
                        we guarantee at least 1 match a day
                        {countError ? (
                          <span className="ml-2 text-[10px] text-rose-700/90 dark:text-rose-200">
                            (count unavailable)
                          </span>
                        ) : waitlistCount === null ? (
                          <span className="ml-2 text-[10px] text-emerald-700/70 dark:text-emerald-200/70">
                            (loading…)
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <h1 className="mt-6 text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
                      No swiping.
                      <br />
                      <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 bg-clip-text text-transparent">
                        Meet like-minded people
                      </span>{" "}
                      one at a time.
                    </h1>

                    <p className="mt-5 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                      Find someone who gets you, without the exhausting explaining.
                      A slower pace. A clearer connection.
                    </p>

                    <div className="mt-8 flex flex-col items-center gap-3">
                      <Link
                        to="/chatbot"
                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 px-8 py-3 text-sm font-semibold text-white shadow-md hover:brightness-110"
                      >
                        Start Now
                        <Sparkles className="h-4 w-4 opacity-90" />
                      </Link>

                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        Gated access • privacy-first • one match at a time
                      </div>
                    </div>

                    {/* Steps (square) + arrows */}
                    <div className="mt-10">
                      <div className="mx-auto grid max-w-4xl gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch">
                        {/* Step 1 */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: 0.05 }}
                          className="rounded-2xl border border-slate-200 bg-white/65 p-5 text-left shadow-sm backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/40"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-semibold text-slate-900 dark:text-slate-50">
                              Step 1
                            </div>
                            <span className="rounded-full border border-slate-200 bg-white/70 px-2 py-1 text-[10px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-200">
                              Quick start
                            </span>
                          </div>
                          <div className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-50">
                            Answer a few real questions
                          </div>
                          <div className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                            No swiping. No profile performance. Just you, clearly.
                          </div>
                        </motion.div>

                        {/* Arrow */}
                        <div className="hidden md:flex items-center justify-center">
                          <div className="rounded-xl border border-slate-200 bg-white/60 p-2 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/35">
                            <ArrowRight className="h-5 w-5 text-slate-500 dark:text-slate-300" />
                          </div>
                        </div>

                        {/* Step 2 */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: 0.1 }}
                          className="rounded-2xl border border-slate-200 bg-white/65 p-5 text-left shadow-sm backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/40"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-semibold text-slate-900 dark:text-slate-50">
                              Step 2
                            </div>
                            <span className="rounded-full border border-slate-200 bg-white/70 px-2 py-1 text-[10px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-200">
                              Your vibe
                            </span>
                          </div>
                          <div className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-50">
                            Set what matters to you
                          </div>
                          <div className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                            Pace, boundaries, intentions, deal-breakers. You’re not liking faces, you’re choosing a direction.
                          </div>
                        </motion.div>

                        {/* Arrow */}
                        <div className="hidden md:flex items-center justify-center">
                          <div className="rounded-xl border border-slate-200 bg-white/60 p-2 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/35">
                            <ArrowRight className="h-5 w-5 text-slate-500 dark:text-slate-300" />
                          </div>
                        </div>

                        {/* Step 3 */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: 0.15 }}
                          className="rounded-2xl border border-slate-200 bg-white/65 p-5 text-left shadow-sm backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/40"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-semibold text-slate-900 dark:text-slate-50">
                              Step 3
                            </div>
                            <span className="rounded-full border border-slate-200 bg-white/70 px-2 py-1 text-[10px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-200">
                              One match
                            </span>
                          </div>
                          <div className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-50">
                            Get one person worth your time
                          </div>
                          <div className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                            We give you someone to actually focus on, not a feed to doom-scroll.
                          </div>
                        </motion.div>
                      </div>

                      {/* Mobile arrows */}
                      <div className="mt-3 flex items-center justify-center gap-2 md:hidden">
                        <div className="h-px w-10 bg-slate-300/70 dark:bg-slate-700/70" />
                        <ArrowRight className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                        <div className="h-px w-10 bg-slate-300/70 dark:bg-slate-700/70" />
                      </div>
                    </div>

                    <div className="mt-12 flex justify-center">
                      <a
                        href="#matching"
                        aria-label="Scroll to next section"
                        className="inline-flex items-center justify-center"
                      >
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

                {/* Right reco (desktop only) */}
                <div className="hidden lg:block">
                  <MiniRecoCard {...heroRecos[1]} align="right" />
                </div>
              </div>
            </div>
          </SectionShell>

          {/* 2) MATCHING */}
          <SectionShell id="matching">
            <div className="mx-auto w-full max-w-6xl">
              <div className="max-w-3xl">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-500 dark:text-indigo-300">
                  The matching
                </div>
                <h2 className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">
                  Built to help you{" "}
                  <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 bg-clip-text text-transparent">
                    find the right person,
                  </span>{" "}
                  not burn out.
                </h2>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  Less “how did we match?” and more “okay… this makes sense.”
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
                    title="What matters"
                    subtitle="We look for the patterns that actually describe you"
                    footer="Less noise. More clarity."
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
                    title="Less randomness"
                    subtitle="We sanity-check before we match you"
                    footer="So your time goes to people who fit."
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
                    title="Your people"
                    subtitle="We connect you with the right circle, not the loudest option"
                    footer="Good fit beats endless options."
                  >
                    <GraphSVG />
                  </DiagramCard>
                </motion.div>
              </div>

              <div className="mt-8 rounded-3xl border border-slate-200 bg-white/65 p-6 text-sm text-slate-600 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/45 dark:text-slate-300">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-500 dark:text-emerald-300" />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-50">
                      Built for trust
                    </div>
                    <div className="mt-1">
                      Gated access keeps things cleaner. Privacy stays first. And the experience stays focused, so it’s harder to game and easier to feel safe.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SectionShell>

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
                    The conversation
                  </div>

                  <h2 className="mt-3 text-4xl font-semibold leading-[1.08] sm:text-5xl">
                    A calm chat that helps us{" "}
                    <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 bg-clip-text text-transparent">
                      understand you
                    </span>
                    .
                  </h2>

                  <p className="mt-6 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                    It’s not therapy. It’s not random icebreakers. It’s a short conversation designed to capture what matters to you, without forcing you to perform.
                  </p>

                  <div className="mt-8 rounded-3xl border border-slate-200 bg-white/65 p-6 text-base backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/45">
                    <div className="font-semibold text-slate-900 dark:text-slate-50">
                      What we care about
                    </div>
                    <ul className="mt-4 space-y-3 text-slate-600 dark:text-slate-300">
                      <li>• Keep it private, always</li>
                      <li>• Look for consistency, not perfection</li>
                      <li>• Match by fit, not by hype</li>
                    </ul>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {[
                        { icon: <ShieldCheck className="h-4 w-4 text-emerald-500" />, t: "Privacy-first" },
                        { icon: <Sparkles className="h-4 w-4 text-indigo-500" />, t: "Calm UX" },
                        { icon: <MessageSquareHeart className="h-4 w-4 text-rose-500" />, t: "Human pacing" },
                      ].map((x, i) => (
                        <div
                          key={i}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-200"
                        >
                          {x.icon}
                          {x.t}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45 }}
                  className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/55"
                >
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />
                    <div className="absolute -right-20 -bottom-24 h-60 w-60 rounded-full bg-rose-500/10 blur-3xl" />
                  </div>

                  <div className="relative">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4 text-sm dark:border-slate-700">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 via-violet-500 to-rose-500 text-white font-semibold">
                        LM
                      </div>
                      <div>
                        <div className="font-semibold">LikeMinded guide</div>
                        <div className="text-xs text-slate-500">Assessment chat</div>
                      </div>

                      <div className="ml-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-200">
                        <span className="inline-flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          live
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4 text-sm">
                      <div className="rounded-2xl bg-slate-100/80 px-4 py-3 dark:bg-slate-800/70">
                        When you feel misunderstood, what do you usually do first: explain calmly, go quiet, or push harder?
                      </div>

                      <div className="ml-auto w-fit rounded-2xl bg-indigo-500 px-4 py-3 text-white">
                        I explain once. If it keeps happening, I go quiet and reset.
                      </div>

                      <div className="rounded-2xl bg-slate-100/80 px-4 py-3 dark:bg-slate-800/70">
                        That’s a real pattern. It helps us avoid matching you with people who demand constant intensity.
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-300">
                        Private summary saved, not the full conversation.
                      </div>

                      <div className="pt-2">
                        <Link
                          to="/chatbot"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-md hover:brightness-110"
                        >
                          Start the chat
                          <Sparkles className="h-4 w-4" />
                        </Link>
                        <div className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                          You can stop anytime. Built to feel calm, not intense.
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </SectionShell>

          <AppFooter />
        </main>
      </div>
    </div>
  );
}
