// src/pages/LandingPage.tsx
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  ChevronDown,
  Sparkles,
  HeartHandshake,
  Lock,
  SlidersHorizontal,
  BadgeCheck,
  Users,
} from "lucide-react";
import { api } from "../lib/api"; // ✅ keep your path

import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";

/** ---------------------------------------------
 * Layout shells
 * -------------------------------------------- */
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

function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_80px_-40px_rgba(0,0,0,0.85)]",
        "backdrop-blur-xl",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function Pill({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04]",
        "px-4 py-2 text-xs text-slate-200 shadow-sm",
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function PrimaryButton({
  to,
  children,
  className = "",
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={[
        "group relative inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 text-sm font-semibold text-white",
        "bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500",
        "shadow-[0_18px_50px_-20px_rgba(99,102,241,0.65)] hover:brightness-110",
        "focus:outline-none focus:ring-2 focus:ring-violet-400/70 focus:ring-offset-2 focus:ring-offset-slate-950",
        className,
      ].join(" ")}
    >
      {/* shine */}
      <span className="pointer-events-none absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
      </span>
      <span className="relative">{children}</span>
    </Link>
  );
}

function SubtleLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center text-slate-300/80 hover:text-white transition-colors"
    >
      {children}
    </a>
  );
}

/** ---------------------------------------------
 * Diagram cards (same diagrams, improved styling)
 * -------------------------------------------- */
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
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="mt-1 text-xs text-slate-300/80">{subtitle}</div>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold text-slate-200">
          {badge}
        </span>
      </div>
      <div className="mt-4">{children}</div>
      {footer ? (
        <div className="mt-3 text-[11px] text-slate-300/70">{footer}</div>
      ) : null}
    </GlassCard>
  );
}

/** ---------------------------------------------
 * Diagrams (unchanged logic, only visuals inside)
 * -------------------------------------------- */
function SignalFieldSVG() {
  return (
    <svg viewBox="0 0 520 260" className="w-full">
      <defs>
        <linearGradient id="sfG" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="rgba(99,102,241,0.95)" />
          <stop offset="0.5" stopColor="rgba(139,92,246,0.9)" />
          <stop offset="1" stopColor="rgba(244,114,182,0.9)" />
        </linearGradient>
        <radialGradient id="sfRG" cx="50%" cy="45%" r="72%">
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

      <g stroke="rgba(148,163,184,0.22)" strokeWidth="1">
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={i} x1={40 + i * 55} y1="30" x2={40 + i * 55} y2="235" />
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={i} x1="24" y1={40 + i * 28} x2="496" y2={40 + i * 28} />
        ))}
      </g>

      <g stroke="rgba(148,163,184,0.35)" strokeWidth="1.2">
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

      <g fill="rgba(226,232,240,0.72)" fontSize="11">
        <text x="26" y="20">latent signal field (normalized)</text>
        <text x="350" y="20">posterior trace</text>
        <text x="26" y="252">invariant features emphasized</text>
      </g>
    </svg>
  );
}

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
        fill="rgba(255,255,255,0.03)"
      />

      <g transform="translate(50,30)">
        <rect
          x="0"
          y="0"
          width="440"
          height="200"
          rx="14"
          fill="rgba(2,6,23,0.22)"
        />

        <g stroke="rgba(148,163,184,0.18)" strokeWidth="1">
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
          stroke="rgba(148,163,184,0.42)"
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

        <g fill="rgba(226,232,240,0.72)" fontSize="11">
          <text x="0" y="222">confidence →</text>
          <text x="-10" y="-10">↑ reliability</text>
        </g>
      </g>

      <g fill="rgba(226,232,240,0.72)" fontSize="11">
        <text x="26" y="20">calibration curve (reliability check)</text>
        <text x="335" y="20">stability validated</text>
        <text x="26" y="252">goal: reduce “random match” behavior</text>
      </g>
    </svg>
  );
}

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
        fill="rgba(255,255,255,0.03)"
      />

      <g stroke="rgba(148,163,184,0.28)" strokeWidth="1.2" strokeLinecap="round">
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
            <circle cx={n.x} cy={n.y} r="10" fill="rgba(99,102,241,0.20)" />
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

      <g fill="rgba(226,232,240,0.72)" fontSize="11">
        <text x="26" y="20">neighborhood matching (graph topology)</text>
        <text x="352" y="20">stable clusters</text>
        <text x="26" y="252">clusters ~~ scores</text>
      </g>
    </svg>
  );
}

/** ---------------------------------------------
 * Page
 * -------------------------------------------- */
export default function LandingPage() {
  // ✅ logic unchanged
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

  // ✅ logic unchanged
  const displayCount = waitlistCount ?? 0;

  // ✅ logic unchanged (same idea), just more "alive" faces
  const avatars = useMemo(
    () => [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=lm1",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=lm2",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=lm3",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=lm4",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=lm5",
    ],
    []
  );

  return (
    <div className="min-h-screen text-white bg-slate-950">
      {/* Background: aurora + glow + subtle noise */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        {/* base gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(99,102,241,0.18),transparent_55%),radial-gradient(circle_at_80%_20%,rgba(244,114,182,0.14),transparent_60%),radial-gradient(circle_at_60%_90%,rgba(139,92,246,0.12),transparent_55%)]" />

        {/* soft vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.2)_35%,rgba(2,6,23,0.75)_75%,rgba(2,6,23,0.95)_100%)]" />

        {/* animated aurora bands */}
        <motion.div
          initial={{ opacity: 0.55, y: 0 }}
          animate={{ opacity: [0.35, 0.6, 0.35], y: [0, 18, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-48 left-1/2 h-[520px] w-[760px] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              "conic-gradient(from 180deg at 50% 50%, rgba(99,102,241,0.18), rgba(139,92,246,0.16), rgba(244,114,182,0.14), rgba(99,102,241,0.18))",
          }}
        />

        {/* grain */}
        <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay [background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22120%22 height=%22120%22 filter=%22url(%23n)%22 opacity=%220.45%22/%3E%3C/svg%3E')]" />
      </div>

      <div className="mx-auto min-h-screen max-w-6xl px-6 sm:px-10 lg:px-20">
        {/* Header wrapper */}
        <div className="sticky top-0 z-50 -mx-6 sm:-mx-10 lg:-mx-20 px-6 sm:px-10 lg:px-20 backdrop-blur-xl bg-slate-950/55 border-b border-white/10">
          <AppHeader />
        </div>

        <main style={{ scrollSnapType: "y proximity" }}>
          {/* 1) HERO / WAITLIST */}
          <SectionShell id="waitlist">
            <div className="mx-auto max-w-3xl text-center">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
              >
                <div className="flex flex-wrap justify-center gap-2">
                  <Pill>
                    <Users className="h-4 w-4 text-slate-200/80" />
                    <span className="font-semibold text-white">
                      {displayCount.toLocaleString()}
                    </span>
                    <span className="text-slate-200/80">potential matches</span>

                    {countError ? (
                      <span className="ml-2 text-[10px] text-rose-300">
                        unavailable
                      </span>
                    ) : waitlistCount === null ? (
                      <span className="ml-2 text-[10px] text-slate-300/70">
                        loading…
                      </span>
                    ) : null}
                  </Pill>

                  <Pill>
                    <BadgeCheck className="h-4 w-4 text-emerald-300" />
                    <span className="text-slate-200/90">verified community</span>
                  </Pill>

                  <Pill>
                    <Lock className="h-4 w-4 text-slate-200/80" />
                    <span className="text-slate-200/90">privacy-first</span>
                  </Pill>
                </div>

                {/* “life”: living faces + micro motion */}
                <div className="mt-5 flex justify-center">
                  <div className="relative inline-flex items-center">
                    <div className="flex -space-x-3">
                      {avatars.map((src, i) => (
                        <motion.img
                          key={i}
                          src={src}
                          alt=""
                          initial={{ y: 6, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.45, delay: 0.05 * i }}
                          className="h-10 w-10 rounded-full border border-white/10 bg-white/5 shadow-[0_12px_30px_-18px_rgba(0,0,0,0.9)]"
                        />
                      ))}
                    </div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.45, delay: 0.35 }}
                      className="ml-4 hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-200/80"
                    >
                      <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.12)]" />
                      real people, gated access
                    </motion.div>
                  </div>
                </div>

                <h1 className="mt-7 text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
                  Matching that behaves like a{" "}
                  <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-rose-400 bg-clip-text text-transparent">
                    system
                  </span>
                  , not a game.
                </h1>

                {/* stronger emotional benefit without losing “system” vibe */}
                <p className="mt-5 text-base leading-relaxed text-slate-200/80">
                  Built for people who want clarity before connection — fewer random matches, more honest alignment.
                </p>

                {/* 3 benefit bullets (warmth + trust) */}
                <div className="mt-7 grid gap-3 sm:grid-cols-3 text-left">
                  <GlassCard className="p-4">
                    <div className="flex items-start gap-3">
                      <HeartHandshake className="h-5 w-5 text-rose-300" />
                      <div>
                        <div className="text-sm font-semibold text-white">
                          Real intent
                        </div>
                        <div className="mt-1 text-xs text-slate-200/70">
                          Less performance, more compatibility.
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                  <GlassCard className="p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-emerald-300" />
                      <div>
                        <div className="text-sm font-semibold text-white">
                          Trust-first
                        </div>
                        <div className="mt-1 text-xs text-slate-200/70">
                          Gated access + stability checks reduce spam.
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                  <GlassCard className="p-4">
                    <div className="flex items-start gap-3">
                      <SlidersHorizontal className="h-5 w-5 text-indigo-300" />
                      <div>
                        <div className="text-sm font-semibold text-white">
                          Less randomness
                        </div>
                        <div className="mt-1 text-xs text-slate-200/70">
                          Neighborhood matching, not endless swiping.
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </div>

                <div className="mt-8 flex flex-col items-center gap-3">
                  <PrimaryButton to="/chatbot">
                    Start Now <Sparkles className="h-4 w-4 opacity-90" />
                  </PrimaryButton>

                  <div className="flex items-center gap-2 text-xs text-slate-200/75">
                    <ShieldCheck className="h-4 w-4 text-emerald-300" />
                    Gated access • privacy-first • stability-checked
                  </div>
                </div>

                {/* Scroll cue */}
                <div className="mt-14 flex justify-center">
                  <SubtleLink href="#matching">
                    <motion.div
                      initial={{ y: 0, opacity: 0.9 }}
                      animate={{ y: [0, 10, 0], opacity: [0.55, 1, 0.55] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <ChevronDown className="h-8 w-8" />
                    </motion.div>
                  </SubtleLink>
                </div>
              </motion.div>
            </div>
          </SectionShell>

          {/* 2) MATCHING ENGINE */}
          <SectionShell id="matching">
            <div className="mx-auto w-full max-w-6xl">
              <div className="max-w-3xl">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-300/90">
                  Matching engine
                </div>

                <h2 className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">
                  Built like a real system:{" "}
                  <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-rose-400 bg-clip-text text-transparent">
                    evaluated, calibrated, stable.
                  </span>
                </h2>

                <p className="mt-3 text-sm text-slate-200/75">
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

              {/* Trust posture, but warmer and more human */}
              <div className="mt-8">
                <GlassCard className="p-6">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-300" />
                    <div>
                      <div className="font-semibold text-white">
                        Trust posture
                      </div>
                      <div className="mt-1 text-sm text-slate-200/75">
                        Gated access reduces spam. We prefer compact outputs, stability checks,
                        and neighborhood logic so the system stays hard to game — and easier to trust.
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Pill className="px-3 py-1.5">
                          <Lock className="h-4 w-4 text-slate-200/80" />
                          no public transcript
                        </Pill>
                        <Pill className="px-3 py-1.5">
                          <BadgeCheck className="h-4 w-4 text-emerald-300" />
                          verified community
                        </Pill>
                        <Pill className="px-3 py-1.5">
                          <Sparkles className="h-4 w-4 text-rose-300" />
                          quality over volume
                        </Pill>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          </SectionShell>

          {/* Scroll cue: matching → chat */}
          <div className="mt-[-50px] flex justify-center">
            <SubtleLink href="#chat">
              <motion.div
                initial={{ y: 0, opacity: 0.9 }}
                animate={{ y: [0, 10, 0], opacity: [0.55, 1, 0.55] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <ChevronDown className="h-8 w-8" />
              </motion.div>
            </SubtleLink>
          </div>

          {/* 3) ASSESSMENT (keep logic; make it feel less “testy”) */}
          <SectionShell id="chat">
            <div className="mx-auto max-w-6xl">
              <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
                <div className="max-w-2xl">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-300/90">
                    The assessment layer
                  </div>

                  <h2 className="mt-3 text-4xl font-semibold leading-[1.08] sm:text-5xl">
                    A calm conversation designed for{" "}
                    <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-rose-400 bg-clip-text text-transparent">
                      signal extraction.
                    </span>
                  </h2>

                  <p className="mt-6 text-base leading-relaxed text-slate-200/80">
                    This is not therapy and not vibes. It’s a guided conversation that tests the same idea multiple ways
                    to find what stays stable — so your matches feel less random and more true.
                  </p>

                  <GlassCard className="mt-8 p-6">
                    <div className="font-semibold text-white">
                      Output philosophy
                    </div>
                    <ul className="mt-4 space-y-3 text-slate-200/75 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-indigo-300" />
                        Compact representation — not a public transcript
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-violet-300" />
                        Consistency scoring across prompts
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-rose-300" />
                        Neighborhood-based matching, not ranking
                      </li>
                    </ul>

                    <div className="mt-5 text-xs text-slate-200/65">
                      Translation: you’re not being “graded.” You’re being understood in a way that stays consistent.
                    </div>
                  </GlassCard>
                </div>

                {/* chat preview: more premium, more life */}
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45 }}
                >
                  <GlassCard className="p-6">
                    <div className="flex items-center gap-3 border-b border-white/10 pb-4 text-sm">
                      <div className="relative">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 via-violet-500 to-rose-500 text-white font-semibold shadow-[0_18px_40px_-24px_rgba(244,114,182,0.6)]">
                          LM
                        </div>
                        <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.12)]" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">
                          LikeMinded guide
                        </div>
                        <div className="text-xs text-slate-200/60">
                          Guided conversation
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4 text-sm">
                      <div className="max-w-[90%] rounded-2xl bg-white/[0.06] border border-white/10 px-4 py-3 text-slate-200/90">
                        If you feel misunderstood, what do you do first: clarify calmly, shut down, or push harder?
                      </div>

                      <div className="ml-auto w-fit max-w-[90%] rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 px-4 py-3 text-white shadow-[0_18px_50px_-30px_rgba(99,102,241,0.7)]">
                        I clarify once. If it keeps happening, I go quiet and reset.
                      </div>

                      <div className="max-w-[90%] rounded-2xl bg-white/[0.06] border border-white/10 px-4 py-3 text-slate-200/90">
                        That response stays consistent across prompts. We treat it as stable signal and reduce matches that demand constant intensity.
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-slate-200/70">
                        Output: compact representation + stability score (preview)
                      </div>

                      <div className="pt-2">
                        <PrimaryButton to="/chatbot" className="w-full">
                          Start your conversation
                        </PrimaryButton>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              </div>
            </div>
          </SectionShell>

          {/* Footer */}
          <AppFooter />
        </main>
      </div>
    </div>
  );
}
