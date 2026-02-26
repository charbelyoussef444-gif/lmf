// LandingPage.tsx
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, ChevronDown, Sparkles, Heart } from "lucide-react";
import { api } from "../lib/api"; // ✅ adjust if your api.ts path differs

import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";

// ─── Animated background ─────────────────────────────────────────────────────
function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    window.addEventListener("resize", resize);

    const palette = [
      "rgba(129,140,248,",
      "rgba(167,139,250,",
      "rgba(244,114,182,",
      "rgba(196,181,253,",
    ];

    type Particle = {
      x: number; y: number;
      vx: number; vy: number;
      r: number; color: string;
      alpha: number; pulse: number; pulseSpeed: number;
    };

    const particles: Particle[] = Array.from({ length: 80 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 2.2 + 0.6,
      color: palette[Math.floor(Math.random() * palette.length)],
      alpha: Math.random() * 0.6 + 0.2,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.018 + 0.006,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(148,163,184,${((1 - dist / 130) * 0.25).toFixed(2)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        p.pulse += p.pulseSpeed;
        const a = Math.max(0, Math.min(1, p.alpha + Math.sin(p.pulse) * 0.12));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + Math.sin(p.pulse) * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${a.toFixed(2)})`;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Base color layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-rose-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ opacity: 1 }} />
      <motion.div
        className="absolute -top-48 -left-48 h-[700px] w-[700px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(129,140,248,0.35) 0%, transparent 65%)" }}
        animate={{ x: [0, 40, -20, 0], y: [0, 25, 50, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -right-48 h-[600px] w-[600px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(244,114,182,0.3) 0%, transparent 65%)" }}
        animate={{ x: [0, -35, 10, 0], y: [0, 45, -20, 0], scale: [1, 0.93, 1.08, 1] }}
        transition={{ duration: 19, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
      />
      <motion.div
        className="absolute bottom-0 left-1/4 h-[500px] w-[500px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.28) 0%, transparent 65%)" }}
        animate={{ x: [0, 30, -15, 0], y: [0, -30, 20, 0], scale: [1, 1.07, 0.97, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 5 }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(196,181,253,0.22) 0%, transparent 65%)" }}
        animate={{ scale: [1, 1.15, 0.9, 1], opacity: [0.6, 1, 0.7, 0.6] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <svg className="absolute inset-0 h-full w-full opacity-[0.022]" xmlns="http://www.w3.org/2000/svg">
        <filter id="bg-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#bg-noise)" />
      </svg>
    </div>
  );
}

// ─── Section shell ───────────────────────────────────────────────────────────
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

// ─── Diagram card ─────────────────────────────────────────────────────────────
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
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.25 }}
      className="group rounded-3xl border border-slate-200/80 bg-white/75 p-5 shadow-lg shadow-slate-200/60 backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/70 dark:shadow-black/30 hover:shadow-xl hover:shadow-indigo-200/30 dark:hover:shadow-indigo-900/30 transition-shadow duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-50 font-display">
            {title}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {subtitle}
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-indigo-100 bg-indigo-50/80 px-3 py-1 text-[11px] font-semibold text-indigo-600 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300">
          {badge}
        </span>
      </div>
      <div className="mt-4">{children}</div>
      {footer ? (
        <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          {footer}
        </div>
      ) : null}
    </motion.div>
  );
}

// ─── Diagram 1: Signal Field ──────────────────────────────────────────────────
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
          <stop offset="0" stopColor="rgba(99,102,241,0.12)" />
          <stop offset="1" stopColor="rgba(99,102,241,0)" />
        </radialGradient>
        <filter id="sfSoft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="sfGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
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
      <g stroke="rgba(148,163,184,0.4)" strokeWidth="1.2">
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
          <g key={i} filter="url(#sfGlow)">
            <circle cx={x} cy={y} r="8" fill="rgba(99,102,241,0.1)" />
            <circle
              cx={x}
              cy={y}
              r="5"
              fill="rgba(255,255,255,0.95)"
              stroke="rgba(99,102,241,0.85)"
              strokeWidth="2"
            />
          </g>
        ))}
      </g>
      <g fill="rgba(100,116,139,0.75)" fontSize="11" fontFamily="inherit">
        <text x="26" y="20">latent signal field (normalized)</text>
        <text x="350" y="20">posterior trace</text>
        <text x="26" y="252">invariant features emphasized</text>
      </g>
    </svg>
  );
}

// ─── Diagram 2: Calibration ───────────────────────────────────────────────────
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
      <rect x="0" y="0" width="520" height="260" rx="18" fill="rgba(148,163,184,0.06)" />
      <g transform="translate(50,30)">
        <rect x="0" y="0" width="440" height="200" rx="14" fill="rgba(15,23,42,0.02)" />
        <g stroke="rgba(148,163,184,0.2)" strokeWidth="1">
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 40} x2="440" y2={i * 40} />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 62.857} y1="0" x2={i * 62.857} y2="200" />
          ))}
        </g>
        <line
          x1="0" y1="200" x2="440" y2="0"
          stroke="rgba(148,163,184,0.55)"
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
            <g key={i}>
              <circle cx={x} cy={y} r="9" fill="rgba(99,102,241,0.1)" />
              <circle
                cx={x} cy={y} r="6"
                fill="rgba(255,255,255,0.95)"
                stroke="rgba(99,102,241,0.85)"
                strokeWidth="2"
              />
            </g>
          ))}
        </g>
        <g fill="rgba(100,116,139,0.75)" fontSize="11">
          <text x="0" y="222">confidence →</text>
          <text x="-10" y="-10">↑ reliability</text>
        </g>
      </g>
      <g fill="rgba(100,116,139,0.75)" fontSize="11">
        <text x="26" y="20">calibration curve (reliability check)</text>
        <text x="335" y="20">stability validated</text>
        <text x="26" y="252">goal: reduce "random match" behavior</text>
      </g>
    </svg>
  );
}

// ─── Diagram 3: Graph ─────────────────────────────────────────────────────────
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
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
    [1, 6], [6, 7], [7, 3], [3, 8], [8, 5],
    [2, 7], [4, 8],
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
      <rect x="0" y="0" width="520" height="260" rx="18" fill="rgba(148,163,184,0.06)" />
      <g stroke="rgba(148,163,184,0.35)" strokeWidth="1.2" strokeLinecap="round">
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x} y1={nodes[a].y}
            x2={nodes[b].x} y2={nodes[b].y}
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
            <circle cx={n.x} cy={n.y} r="12" fill="rgba(99,102,241,0.1)" />
            <circle
              cx={n.x} cy={n.y} r="6.5"
              fill="rgba(255,255,255,0.95)"
              stroke="rgba(99,102,241,0.9)"
              strokeWidth="2"
            />
          </g>
        ))}
      </g>
      <g fill="rgba(100,116,139,0.75)" fontSize="11">
        <text x="26" y="20">neighborhood matching (graph topology)</text>
        <text x="352" y="20">stable clusters</text>
        <text x="26" y="252">clusters ~~ scores</text>
      </g>
    </svg>
  );
}

// ─── Social proof pill ────────────────────────────────────────────────────────
function SocialProofPill({ count, avatars }: { count: number; avatars: string[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="inline-flex items-center gap-3 rounded-full border border-slate-200/80 bg-white/80 px-5 py-2.5 shadow-sm shadow-slate-100 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/60 dark:shadow-black/20"
    >
      <div className="flex -space-x-2">
        {avatars.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className="h-7 w-7 rounded-full border-2 border-white bg-white shadow-sm dark:border-slate-900"
          />
        ))}
      </div>
      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-bold text-slate-900 dark:text-slate-50 tabular-nums">
          {count.toLocaleString()}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">people waiting</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Live</span>
      </div>
    </motion.div>
  );
}

// ─── Testimonial cards ────────────────────────────────────────────────────────
const testimonials = [
  {
    text: "Finally, a dating app that doesn't make me feel like I'm gambling.",
    name: "Yasmine, 31",
    tag: "Product designer",
  },
  {
    text: "I've been on every app. This is the first one that felt like it actually listened.",
    name: "Marcus, 34",
    tag: "Software engineer",
  },
  {
    text: "The assessment felt like a real conversation, not an interrogation.",
    name: "Léa, 28",
    tag: "Researcher",
  },
];

function TestimonialStrip() {
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-3">
      {testimonials.map((t, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.45, delay: i * 0.08 }}
          className="rounded-2xl border border-slate-100 bg-white/70 p-4 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/50"
        >
          <div className="flex items-start gap-2">
            <Heart className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" fill="currentColor" />
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 italic">
              "{t.text}"
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-400 via-violet-400 to-rose-400 flex items-center justify-center text-[10px] font-bold text-white">
              {t.name[0]}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">{t.name}</div>
              <div className="text-[10px] text-slate-400">{t.tag}</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Scroll cue ───────────────────────────────────────────────────────────────
function ScrollCue({ href }: { href: string }) {
  return (
    <div className="flex justify-center">
      <a href={href} aria-label="Scroll to next section" className="inline-flex items-center justify-center">
        <motion.div
          animate={{ y: [0, 10, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 transition-colors"
        >
          <ChevronDown className="h-8 w-8" />
        </motion.div>
      </a>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
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
    return () => { mounted = false; };
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
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <AnimatedBackground />

      <div className="mx-auto min-h-screen max-w-6xl px-6 sm:px-10 lg:px-20">
        {/* ✅ STICKY APP HEADER */}
        <div className="sticky top-0 z-50 -mx-6 sm:-mx-10 lg:-mx-20 px-6 sm:px-10 lg:px-20 backdrop-blur-md bg-white/70 dark:bg-slate-950/60 border-b border-slate-200/60 dark:border-slate-800/60">
          <AppHeader />
        </div>

        <main style={{ scrollSnapType: "y proximity" }}>
          {/* ─── 1) WAITLIST ─────────────────────────────────────────────── */}
          <SectionShell id="waitlist">
            <div className="mx-auto max-w-3xl text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
              >
                {/* Social proof pill */}
                {!countError && (
                  <SocialProofPill count={displayCount} avatars={avatars} />
                )}
                {countError && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
                    <span className="font-semibold text-slate-900 dark:text-slate-50">{displayCount.toLocaleString()}</span>
                    potential matches
                    <span className="ml-2 text-[10px] text-rose-600 dark:text-rose-300">unavailable</span>
                  </div>
                )}
                {!countError && waitlistCount === null && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">loading…</span>
                )}

                {/* Kicker line */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.15 }}
                  className="mt-6 flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500 dark:text-indigo-300">
                    Intelligent matching
                  </span>
                  <Sparkles className="h-3.5 w-3.5 text-rose-400" />
                </motion.div>

                {/* Headline */}
                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.2 }}
                  className="mt-4 text-4xl font-semibold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl"
                >
                  Matching that behaves like a{" "}
                  <span className="relative">
                    <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 bg-clip-text text-transparent">
                      system
                    </span>
                    {/* Underline accent */}
                    <motion.span
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
                      className="absolute -bottom-1 left-0 right-0 block h-0.5 rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-rose-400 origin-left"
                    />
                  </span>
                  , not a game.
                </motion.h1>

                {/* Sub-headline — with human warmth */}
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="mt-5 text-base leading-relaxed text-slate-600 dark:text-slate-300"
                >
                  Short conversation → stable representation → neighborhood-based matches.
                  <br className="hidden sm:block" />
                  <span className="mt-1 block text-slate-500 dark:text-slate-400 text-sm">
                    Less randomness. More signal. Someone who actually fits.
                  </span>
                </motion.p>

                {/* CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="mt-8 flex flex-col items-center gap-3"
                >
                  <Link
                    to="/chatbot"
                    className="group relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-300/40 dark:shadow-violet-900/40 hover:brightness-110 active:scale-95 transition-all duration-200"
                  >
                    <span>Start your conversation</span>
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      →
                    </motion.span>
                    {/* Glow on hover */}
                    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-rose-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300" />
                  </Link>

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    Gated access · privacy-first · stability-checked
                  </div>
                </motion.div>

                {/* Testimonials */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.55 }}
                >
                  <TestimonialStrip />
                </motion.div>

                {/* Scroll cue */}
                <div className="mt-10">
                  <ScrollCue href="#matching" />
                </div>
              </motion.div>
            </div>
          </SectionShell>

          {/* ─── 2) MATCHING ─────────────────────────────────────────────── */}
          <SectionShell id="matching">
            <div className="mx-auto w-full max-w-6xl">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5 }}
                className="max-w-3xl"
              >
                <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-500 dark:text-indigo-300">
                    Matching engine
                  </span>
                </div>
                <h2 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl tracking-tight">
                  Built like a real system:{" "}
                  <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 bg-clip-text text-transparent">
                    evaluated, calibrated, stable.
                  </span>
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  You don't get "a score." You get placed into a neighborhood where alignment is high
                  and volatility is low — so the people you meet are actually compatible with who you are.
                </p>
              </motion.div>

              <div className="mt-8 grid gap-5 lg:grid-cols-3">
                {[
                  {
                    title: "Signal field",
                    subtitle: "Latent representation derived from structured prompts",
                    footer: "Goal: isolate invariant behavior under different wording.",
                    Diagram: SignalFieldSVG,
                    delay: 0,
                  },
                  {
                    title: "Calibration",
                    subtitle: "Reliability check: confidence vs observed stability",
                    footer: "Goal: reduce noisy outputs and random matches.",
                    Diagram: CalibrationSVG,
                    delay: 0.07,
                  },
                  {
                    title: "Neighborhood matching",
                    subtitle: "Graph topology: clusters represent human-fit zones",
                    footer: "Goal: clusters over ranks; stability over hype.",
                    Diagram: GraphSVG,
                    delay: 0.14,
                  },
                ].map(({ title, subtitle, footer, Diagram, delay }) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.45, delay }}
                  >
                    <DiagramCard title={title} subtitle={subtitle} footer={footer}>
                      <Diagram />
                    </DiagramCard>
                  </motion.div>
                ))}
              </div>

              {/* Trust bar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.2 }}
                className="mt-8 rounded-3xl border border-slate-200/80 bg-white/70 p-6 text-sm text-slate-600 dark:border-slate-700/60 dark:bg-slate-900/50 dark:text-slate-300"
              >
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-50">Trust posture</div>
                    <div className="mt-1 leading-relaxed">
                      Gated access reduces spam. We prefer compact outputs, stability checks,
                      and neighborhood logic so the system stays hard to game — and your matches stay real.
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </SectionShell>

          {/* Scroll cue: matching → chat */}
          <div className="mt-[-50px] mb-4">
            <ScrollCue href="#chat" />
          </div>

          {/* ─── 3) CHATBOT ──────────────────────────────────────────────── */}
          <SectionShell id="chat">
            <div className="mx-auto max-w-6xl">
              <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
                <motion.div
                  initial={{ opacity: 0, x: -14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5 }}
                  className="max-w-2xl"
                >
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 dark:bg-violet-950/40 px-3 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-500 dark:text-violet-300">
                      The assessment layer
                    </span>
                  </div>

                  <h2 className="mt-3 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
                    A calm conversation designed for{" "}
                    <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 bg-clip-text text-transparent">
                      real connection.
                    </span>
                  </h2>

                  <p className="mt-5 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                    Not therapy. Not vibes. Structured prompting that tests the same idea multiple ways —
                    so only what's genuinely stable about you gets passed forward.
                  </p>

                  {/* Feature list — redesigned as callouts */}
                  <div className="mt-8 space-y-3">
                    {[
                      {
                        icon: "🔒",
                        label: "Compact representation",
                        desc: "Not a public transcript — your words stay private.",
                      },
                      {
                        icon: "🎯",
                        label: "Consistency scoring",
                        desc: "We check the same trait across different prompts.",
                      },
                      {
                        icon: "🌐",
                        label: "Neighborhood matching",
                        desc: "You're placed, not ranked.",
                      },
                    ].map(({ icon, label, desc }) => (
                      <div
                        key={label}
                        className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white/70 px-4 py-3 dark:border-slate-800/60 dark:bg-slate-900/50"
                      >
                        <span className="text-lg leading-none mt-0.5">{icon}</span>
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                            {label}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                            {desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Chat preview */}
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="relative"
                >
                  {/* Glow behind card */}
                  <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-indigo-400/20 via-violet-400/10 to-rose-400/15 blur-2xl" />

                  <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-2xl shadow-slate-200/50 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/80 dark:shadow-black/40">
                    {/* Chat header */}
                    <div className="flex items-center gap-3 border-b border-slate-100/80 pb-4 dark:border-slate-700/60">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 via-violet-500 to-rose-500 text-white font-bold text-sm shadow-md shadow-violet-300/40 dark:shadow-violet-900/40">
                        LM
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">LikeMinded guide</div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          </span>
                          Assessment chat · active
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="mt-5 space-y-4 text-sm">
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="rounded-2xl bg-slate-100/80 px-4 py-3 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 leading-relaxed"
                      >
                        If you feel misunderstood, what do you do first: clarify calmly, shut down, or push harder?
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: 8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                        className="ml-auto w-fit rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 px-4 py-3 text-white shadow-md shadow-violet-300/30 dark:shadow-violet-900/30 leading-relaxed"
                      >
                        I clarify once. If it keeps happening, I go quiet and reset.
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.7 }}
                        className="rounded-2xl bg-slate-100/80 px-4 py-3 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 leading-relaxed"
                      >
                        That response stays consistent across prompts. We treat it as a stable signal
                        and reduce matches that demand constant intensity.
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.9 }}
                        className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/30"
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                            Output: compact representation + stability score
                          </span>
                        </div>
                      </motion.div>
                    </div>

                    {/* Input hint */}
                    <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-2.5 dark:border-slate-800/60 dark:bg-slate-900/40">
                      <span className="flex-1 text-xs text-slate-400 dark:text-slate-500">Your response…</span>
                      <Link
                        to="/chatbot"
                        className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-1.5 text-xs font-semibold text-white hover:brightness-110 transition-all"
                      >
                        Begin
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </SectionShell>

          {/* ✅ APP FOOTER */}
          <AppFooter />
        </main>
      </div>
    </div>
  );
}
