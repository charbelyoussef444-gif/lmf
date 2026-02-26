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
      "rgba(129,140,248,", // indigo
      "rgba(167,139,250,", // violet
      "rgba(244,114,182,", // rose
      "rgba(196,181,253,", // lavender
      "rgba(52,211,153,",  // emerald
    ];

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      color: string;
      alpha: number;
      pulse: number;
      pulseSpeed: number;
      kind: "dot" | "heart";
      rot: number;
      rotSpeed: number;
    };

    const particles: Particle[] = Array.from({ length: 92 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 2.2 + 0.7,
      color: palette[Math.floor(Math.random() * palette.length)],
      alpha: Math.random() * 0.55 + 0.18,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.018 + 0.006,
      kind: Math.random() < 0.14 ? "heart" : "dot",
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.01,
    }));

    const drawHeart = (x: number, y: number, s: number, a: number, rot: number, fill: string) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.beginPath();
      const scale = s * 0.9;
      // simple heart path (small + soft)
      ctx.moveTo(0, -0.35 * scale);
      ctx.bezierCurveTo(0.55 * scale, -0.95 * scale, 1.25 * scale, -0.05 * scale, 0, 0.9 * scale);
      ctx.bezierCurveTo(-1.25 * scale, -0.05 * scale, -0.55 * scale, -0.95 * scale, 0, -0.35 * scale);
      ctx.closePath();
      ctx.globalAlpha = a;
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // softer connection lines (only between "dot" particles)
      for (let i = 0; i < particles.length; i++) {
        if (particles[i].kind !== "dot") continue;
        for (let j = i + 1; j < particles.length; j++) {
          if (particles[j].kind !== "dot") continue;
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(148,163,184,${((1 - dist / 140) * 0.2).toFixed(2)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        p.pulse += p.pulseSpeed;
        p.rot += p.rotSpeed;

        const a = Math.max(0, Math.min(1, p.alpha + Math.sin(p.pulse) * 0.12));
        const wobble = Math.sin(p.pulse) * 0.4;

        if (p.kind === "dot") {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r + wobble, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${a.toFixed(2)})`;
          ctx.fill();
        } else {
          // hearts: slightly larger + blur-like softness via alpha
          const heartFill = `${p.color}${Math.max(0.06, a * 0.55).toFixed(2)})`;
          drawHeart(p.x, p.y, p.r * 2.6 + wobble, 1, p.rot, heartFill);
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -20) p.x = W + 20;
        if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20;
        if (p.y > H + 20) p.y = -20;
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
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50/35 to-rose-50/25 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />

      {/* Life layer */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ opacity: 1 }} />

      {/* Big soft orbs */}
      <motion.div
        className="absolute -top-52 -left-52 h-[760px] w-[760px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(129,140,248,0.38) 0%, transparent 66%)",
        }}
        animate={{ x: [0, 40, -20, 0], y: [0, 25, 55, 0], scale: [1, 1.12, 0.96, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -right-56 h-[680px] w-[680px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(244,114,182,0.34) 0%, transparent 66%)",
        }}
        animate={{ x: [0, -35, 12, 0], y: [0, 50, -24, 0], scale: [1, 0.92, 1.1, 1] }}
        transition={{ duration: 19, repeat: Infinity, ease: "easeInOut", delay: 2.2 }}
      />
      <motion.div
        className="absolute bottom-[-140px] left-1/4 h-[560px] w-[560px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(52,211,153,0.18) 0%, transparent 64%)",
        }}
        animate={{ x: [0, 32, -15, 0], y: [0, -26, 18, 0], scale: [1, 1.08, 0.98, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 4.5 }}
      />

      {/* soft bokeh dots */}
      <div className="absolute inset-0 opacity-[0.35] dark:opacity-[0.22]">
        <div className="absolute left-[12%] top-[18%] h-2 w-2 rounded-full bg-indigo-300/60 blur-[1px]" />
        <div className="absolute left-[22%] top-[72%] h-3 w-3 rounded-full bg-rose-300/60 blur-[1px]" />
        <div className="absolute left-[76%] top-[22%] h-2.5 w-2.5 rounded-full bg-violet-300/60 blur-[1px]" />
        <div className="absolute left-[88%] top-[58%] h-3 w-3 rounded-full bg-emerald-300/55 blur-[1px]" />
        <div className="absolute left-[46%] top-[40%] h-2 w-2 rounded-full bg-indigo-200/60 blur-[1px]" />
      </div>

      {/* Grain */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
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

// ─── Diagram 1: Your Pattern ──────────────────────────────────────────────────
function PatternSVG() {
  return (
    <svg viewBox="0 0 520 260" className="w-full">
      <defs>
        <linearGradient id="pG" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="rgba(99,102,241,0.95)" />
          <stop offset="0.5" stopColor="rgba(139,92,246,0.9)" />
          <stop offset="1" stopColor="rgba(244,114,182,0.9)" />
        </linearGradient>
        <radialGradient id="pRG" cx="50%" cy="50%" r="70%">
          <stop offset="0" stopColor="rgba(244,114,182,0.10)" />
          <stop offset="1" stopColor="rgba(99,102,241,0)" />
        </radialGradient>
        <filter id="pSoft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="0" y="0" width="520" height="260" rx="18" fill="url(#pRG)" />

      {/* soft wave ribbon */}
      <path
        d="M24,160 C85,120 120,220 180,150 C240,80 295,210 350,130 C410,65 455,170 496,112"
        fill="none"
        stroke="url(#pG)"
        strokeWidth="5"
        strokeLinecap="round"
        filter="url(#pSoft)"
        opacity="0.95"
      />

      {/* gentle “moments” bubbles */}
      {[
        [88, 132],
        [165, 176],
        [230, 138],
        [305, 170],
        [385, 110],
        [452, 148],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="12" fill="rgba(99,102,241,0.07)" />
          <circle cx={x} cy={y} r="6.5" fill="rgba(255,255,255,0.95)" stroke="rgba(99,102,241,0.8)" strokeWidth="2" />
        </g>
      ))}

      {/* small hearts */}
      <g opacity="0.55">
        <path
          d="M110 78
             C110 68, 122 64, 130 72
             C138 64, 150 68, 150 78
             C150 90, 130 104, 130 104
             C130 104, 110 90, 110 78 Z"
          fill="rgba(244,114,182,0.22)"
        />
        <path
          d="M370 66
             C370 58, 380 55, 387 61
             C394 55, 404 58, 404 66
             C404 76, 387 88, 387 88
             C387 88, 370 76, 370 66 Z"
          fill="rgba(129,140,248,0.18)"
        />
      </g>

      <g fill="rgba(100,116,139,0.75)" fontSize="11" fontFamily="inherit">
        <text x="26" y="22">your vibe pattern (from conversation)</text>
        <text x="330" y="22">steady signals highlighted</text>
        <text x="26" y="252">we keep what stays true</text>
      </g>
    </svg>
  );
}

// ─── Diagram 2: Consistency ───────────────────────────────────────────────────
function ConsistencySVG() {
  return (
    <svg viewBox="0 0 520 260" className="w-full">
      <defs>
        <linearGradient id="cG" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="rgba(99,102,241,0.9)" />
          <stop offset="0.55" stopColor="rgba(139,92,246,0.9)" />
          <stop offset="1" stopColor="rgba(52,211,153,0.78)" />
        </linearGradient>
        <filter id="cSoft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="0" y="0" width="520" height="260" rx="18" fill="rgba(148,163,184,0.06)" />

      <g transform="translate(50,32)">
        <rect x="0" y="0" width="440" height="196" rx="14" fill="rgba(15,23,42,0.02)" />

        {/* soft grid */}
        <g stroke="rgba(148,163,184,0.16)" strokeWidth="1">
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 39.2} x2="440" y2={i * 39.2} />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 62.857} y1="0" x2={i * 62.857} y2="196" />
          ))}
        </g>

        {/* “ideal” diagonal (dashed) */}
        <line
          x1="0"
          y1="196"
          x2="440"
          y2="0"
          stroke="rgba(148,163,184,0.45)"
          strokeWidth="2"
          strokeDasharray="6 6"
        />

        {/* smooth curve */}
        <path
          d="M0,182 C62,160 100,132 140,120 C190,104 238,98 290,70 C334,46 382,30 440,20"
          fill="none"
          stroke="url(#cG)"
          strokeWidth="4.2"
          strokeLinecap="round"
          filter="url(#cSoft)"
        />

        {/* points */}
        {[
          [48, 168],
          [118, 135],
          [182, 112],
          [252, 90],
          [320, 60],
          [394, 34],
        ].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="9" fill="rgba(99,102,241,0.08)" />
            <circle cx={x} cy={y} r="6" fill="rgba(255,255,255,0.95)" stroke="rgba(99,102,241,0.82)" strokeWidth="2" />
          </g>
        ))}

        <g fill="rgba(100,116,139,0.75)" fontSize="11">
          <text x="0" y="218">confidence →</text>
          <text x="-10" y="-10">↑ consistency</text>
        </g>
      </g>

      <g fill="rgba(100,116,139,0.75)" fontSize="11">
        <text x="26" y="22">consistency checks (no “random vibe shifts”)</text>
        <text x="338" y="22">keeps results sane</text>
        <text x="26" y="252">goal: fewer mismatches</text>
      </g>
    </svg>
  );
}

// ─── Diagram 3: Neighborhoods ─────────────────────────────────────────
function NeighborhoodSVG() {
  const nodes = [
    { x: 92, y: 88 },
    { x: 168, y: 128 },
    { x: 242, y: 86 },
    { x: 312, y: 145 },
    { x: 388, y: 96 },
    { x: 452, y: 146 },
    { x: 134, y: 178 },
    { x: 224, y: 170 },
    { x: 338, y: 188 },
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
        <linearGradient id="nG" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="rgba(99,102,241,0.9)" />
          <stop offset="0.5" stopColor="rgba(139,92,246,0.9)" />
          <stop offset="1" stopColor="rgba(244,114,182,0.88)" />
        </linearGradient>
        <filter id="nSoft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="0" y="0" width="520" height="260" rx="18" fill="rgba(148,163,184,0.06)" />

      {/* soft “neighborhood blobs” */}
      <g opacity="0.9" filter="url(#nSoft)">
        <circle cx="140" cy="150" r="64" fill="rgba(99,102,241,0.08)" />
        <circle cx="260" cy="120" r="78" fill="rgba(139,92,246,0.07)" />
        <circle cx="380" cy="150" r="66" fill="rgba(244,114,182,0.06)" />
      </g>

      <g stroke="rgba(148,163,184,0.33)" strokeWidth="1.2" strokeLinecap="round">
        {edges.map(([a, b], i) => (
          <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} />
        ))}
      </g>

      {/* highlighted “path” */}
      <path
        d="M92,88 C150,54 220,54 242,86 C276,132 330,46 388,96 C420,120 438,136 452,146"
        fill="none"
        stroke="url(#nG)"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.95"
      />

      <g>
        {nodes.map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r="12" fill="rgba(99,102,241,0.09)" />
            <circle cx={n.x} cy={n.y} r="6.5" fill="rgba(255,255,255,0.95)" stroke="rgba(99,102,241,0.86)" strokeWidth="2" />
          </g>
        ))}
      </g>

      <g fill="rgba(100,116,139,0.75)" fontSize="11">
        <text x="26" y="22">compatibility neighborhoods</text>
        <text x="350" y="22">small world, better fit</text>
        <text x="26" y="252">you’re placed with your people</text>
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
    text: "Finally, a dating app that doesn’t feel like I’m playing roulette.",
    name: "Yasmine, 31",
    tag: "Product designer",
  },
  {
    text: "It feels intentional. Like it’s trying to understand me, not hook me.",
    name: "Marcus, 34",
    tag: "Software engineer",
  },
  {
    text: "The questions felt human. Calm. Not cringe, not intense.",
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
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
                {/* Social proof pill */}
                {!countError && <SocialProofPill count={displayCount} avatars={avatars} />}
                {countError && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
                    <span className="font-semibold text-slate-900 dark:text-slate-50">{displayCount.toLocaleString()}</span>
                    people waiting
                    <span className="ml-2 text-[10px] text-rose-600 dark:text-rose-300">unavailable</span>
                  </div>
                )}
                {!countError && waitlistCount === null && (
                  <span className="block mt-1 text-[10px] text-slate-500 dark:text-slate-400">loading…</span>
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
                    Intentional matching
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

                {/* Sub-headline — warmer + less “engineer” */}
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="mt-5 text-base leading-relaxed text-slate-600 dark:text-slate-300"
                >
                  A short, calm conversation — then we match you with people who actually make sense.
                  <br className="hidden sm:block" />
                  <span className="mt-1 block text-slate-500 dark:text-slate-400 text-sm">
                    Less chaos. Less swiping. More “this feels right.”
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
                    <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
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
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.55 }}>
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
                    How it works
                  </span>
                </div>

                <h2 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl tracking-tight">
                  Built for real people:{" "}
                  <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 bg-clip-text text-transparent">
                    steady, respectful, hard to game.
                  </span>
                </h2>

                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  You’re not “ranked.” You’re placed into a compatibility neighborhood — a smaller world where your odds of clicking
                  are naturally higher.
                </p>
              </motion.div>

              <div className="mt-8 grid gap-5 lg:grid-cols-3">
                {[
                  {
                    title: "Your pattern",
                    subtitle: "We pull out the themes that keep showing up",
                    footer: "Goal: keep the real you — not one clever message.",
                    Diagram: PatternSVG,
                    delay: 0,
                  },
                  {
                    title: "Consistency",
                    subtitle: "We check if your answers stay true across prompts",
                    footer: "Goal: fewer mismatches from “random” vibes.",
                    Diagram: ConsistencySVG,
                    delay: 0.07,
                  },
                  {
                    title: "Neighborhoods",
                    subtitle: "We match you inside a cluster that fits your style",
                    footer: "Goal: better fit zones, not endless scrolling.",
                    Diagram: NeighborhoodSVG,
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
                    <DiagramCard title={title} subtitle={subtitle} footer={footer} badge="Simple view">
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
                      Gated access helps cut spam. We keep outputs compact, focus on stable signals,
                      and avoid “hooky” mechanics — so it feels calmer and more human.
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
                      The conversation
                    </span>
                  </div>

                  <h2 className="mt-3 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
                    A guided chat that feels{" "}
                    <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 bg-clip-text text-transparent">
                      calm
                    </span>
                    , not like an interview.
                  </h2>

                  <p className="mt-5 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                    It’s not therapy, and it’s not a test. It’s a thoughtful set of prompts that helps the system understand what you
                    actually want — without putting your whole life on display.
                  </p>

                  {/* Feature list — warmer */}
                  <div className="mt-8 space-y-3">
                    {[
                      {
                        icon: "🫶",
                        label: "Private by default",
                        desc: "We don’t publish your story. We keep what matters, safely.",
                      },
                      {
                        icon: "🧭",
                        label: "Steady signals",
                        desc: "We look for patterns that hold up — not one perfect answer.",
                      },
                      {
                        icon: "🌙",
                        label: "Less pressure",
                        desc: "The flow is designed to feel slow, clean, and human.",
                      },
                    ].map(({ icon, label, desc }) => (
                      <div
                        key={label}
                        className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white/70 px-4 py-3 dark:border-slate-800/60 dark:bg-slate-900/50"
                      >
                        <span className="text-lg leading-none mt-0.5">{icon}</span>
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{label}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{desc}</div>
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
                          Calm onboarding · active
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
                        When you feel misunderstood, what usually helps you most: explaining gently, taking space, or talking it out right away?
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: 8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                        className="ml-auto w-fit rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 px-4 py-3 text-white shadow-md shadow-violet-300/30 dark:shadow-violet-900/30 leading-relaxed"
                      >
                        I explain once. If it keeps happening, I take a breath and reset.
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.7 }}
                        className="rounded-2xl bg-slate-100/80 px-4 py-3 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 leading-relaxed"
                      >
                        Got it. That tells us you value calm repair — not constant intensity.
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
                            Output: a small “compatibility signature” (private)
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
