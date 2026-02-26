// LandingPage.tsx
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ShieldCheck, Moon, Sun, ChevronDown, Heart, Zap, Fingerprint } from "lucide-react";
import { useTheme } from "../theme/ThemeProvider";
import { api } from "../lib/api"; 

import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";

/** Structural Shell - Optimized for smooth scroll-snapping and rhythm */
function SectionShell({ id, children, className = "" }: { id: string; children: ReactNode; className?: string }) {
  return (
    <section
      id={id}
      className={`min-h-[calc(100vh-64px)] w-full py-20 flex items-center justify-center ${className}`}
      style={{ scrollSnapAlign: "start" }}
    >
      <div className="w-full">{children}</div>
    </section>
  );
}

/** Premium Glass Card - The '10/10' UI upgrade */
function DiagramCard({
  title,
  subtitle,
  badge,
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
    <div className="group relative rounded-[2.5rem] border border-slate-200/60 bg-white/40 p-6 shadow-2xl shadow-slate-200/30 backdrop-blur-xl transition-all hover:translate-y-[-4px] dark:border-slate-700/50 dark:bg-slate-900/40 dark:shadow-black/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {title}
          </div>
          <div className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            {subtitle}
          </div>
        </div>
        {badge && (
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">
        {children}
      </div>
      {footer && (
        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          <Zap className="h-3 w-3 text-amber-400" />
          {footer}
        </div>
      )}
    </div>
  );
}

/* --- FULL SVG RESTORATION (Original Logic + Premium Styling) --- */

function SignalFieldSVG() {
  return (
    <svg viewBox="0 0 520 260" className="w-full">
      <defs>
        <linearGradient id="sfG" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="0.5" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#f472b6" />
        </linearGradient>
        <radialGradient id="sfRG" cx="50%" cy="50%" r="68%">
          <stop offset="0" stopColor="rgba(99,102,241,0.15)" />
          <stop offset="1" stopColor="rgba(99,102,241,0)" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="520" height="260" rx="18" fill="url(#sfRG)" />
      <g stroke="rgba(148,163,184,0.2)" strokeWidth="1">
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={i} x1={40 + i * 55} y1="30" x2={40 + i * 55} y2="235" />
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={i} x1="24" y1={40 + i * 28} x2="496" y2={40 + i * 28} />
        ))}
      </g>
      <path
        d="M60,165 C120,70 170,210 220,115 C270,15 325,225 370,120 C420,45 470,190 496,105"
        fill="none"
        stroke="url(#sfG)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <g>
        {[[105, 98], [175, 178], [240, 120], [310, 158], [385, 92], [455, 140]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="5" fill="white" stroke="#6366f1" strokeWidth="2" />
        ))}
      </g>
      <g fill="rgba(100,116,139,0.7)" fontSize="10" fontWeight="600" className="uppercase tracking-widest">
        <text x="26" y="20">Alignment Field</text>
        <text x="380" y="20">Stability Trace</text>
      </g>
    </svg>
  );
}

function CalibrationSVG() {
  return (
    <svg viewBox="0 0 520 260" className="w-full">
      <defs>
        <linearGradient id="calG" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="520" height="260" rx="18" fill="rgba(148,163,184,0.08)" />
      <g transform="translate(50,30)">
        <g stroke="rgba(148,163,184,0.2)" strokeWidth="1">
          {Array.from({ length: 6 }).map((_, i) => <line key={`h${i}`} x1="0" y1={i * 40} x2="440" y2={i * 40} />)}
          {Array.from({ length: 8 }).map((_, i) => <line key={`v${i}`} x1={i * 62.8} y1="0" x2={i * 62.8} y2="200" />)}
        </g>
        <line x1="0" y1="200" x2="440" y2="0" stroke="rgba(148,163,184,0.4)" strokeWidth="2" strokeDasharray="6 6" />
        <path
          d="M0,192 C60,170 95,140 130,125 C175,105 220,95 275,70 C330,45 385,30 440,18"
          fill="none"
          stroke="url(#calG)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <g>
          {[[40, 178], [110, 138], [170, 112], [240, 92], [310, 60], [390, 32]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="6" fill="white" stroke="#6366f1" strokeWidth="2" />
          ))}
        </g>
      </g>
      <g fill="rgba(100,116,139,0.7)" fontSize="10" fontWeight="600" className="uppercase tracking-widest">
        <text x="26" y="20">Reliability Index</text>
        <text x="350" y="250">Stability Validated</text>
      </g>
    </svg>
  );
}

function GraphSVG() {
  const nodes = [{x:90,y:80},{x:165,y:125},{x:240,y:80},{x:310,y:140},{x:385,y:90},{x:450,y:145},{x:130,y:175},{x:220,y:170},{x:335,y:185}];
  const edges = [[0,1],[1,2],[2,3],[3,4],[4,5],[1,6],[6,7],[7,3],[3,8],[8,5],[2,7],[4,8]];
  return (
    <svg viewBox="0 0 520 260" className="w-full">
      <rect x="0" y="0" width="520" height="260" rx="18" fill="rgba(148,163,184,0.08)" />
      <g stroke="rgba(148,163,184,0.3)" strokeWidth="1.2">
        {edges.map(([a, b], i) => <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} />)}
      </g>
      <g>
        {nodes.map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r="10" fill="rgba(99,102,241,0.15)" />
            <circle cx={n.x} cy={n.y} r="6" fill="white" stroke="#6366f1" strokeWidth="2" />
          </g>
        ))}
      </g>
      <g fill="rgba(100,116,139,0.7)" fontSize="10" fontWeight="600" className="uppercase tracking-widest">
        <text x="26" y="20">Neighborhood Mapping</text>
      </g>
    </svg>
  );
}

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
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
  const avatars = useMemo(() => ["lm1", "lm2", "lm3", "lm4", "lm5"].map(s => `https://api.dicebear.com/7.x/avataaars/svg?seed=${s}`), []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#fafafa] text-slate-900 selection:bg-indigo-100 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-500">
      
      {/* Dynamic Background Orbs - The 'Premium' layer */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <motion.div 
          animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-24 -left-24 h-[600px] w-[600px] rounded-full bg-indigo-500/5 blur-[120px] dark:bg-indigo-500/10" 
        />
        <motion.div 
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 -right-32 h-[500px] w-[500px] rounded-full bg-rose-500/5 blur-[100px] dark:bg-rose-500/10" 
        />
      </div>

      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        
        {/* NAV - Balanced & Clean */}
        <header className="h-20 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-rose-500 shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight">LikeMinded</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Gated Access</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="h-10 w-10 flex items-center justify-center rounded-full border border-slate-200 bg-white/50 dark:border-slate-800 dark:bg-slate-900/50"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/login" className="px-5 py-2 text-xs font-bold rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900">
              Sign In
            </Link>
          </div>
        </header>

        <main style={{ scrollSnapType: "y proximity" }}>
          
          {/* HERO: Human Resonance */}
          <SectionShell id="waitlist">
            <div className="mx-auto max-w-4xl text-center">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-1.5 text-[12px] font-semibold shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-slate-600 dark:text-slate-300">
                    Join {displayCount.toLocaleString()} seeking depth
                  </span>
                </div>

                <h1 className="mt-10 text-6xl font-extrabold tracking-tighter sm:text-7xl lg:text-8xl leading-[0.9]">
                  Finding your <br />
                  <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 bg-clip-text text-transparent">
                    human resonance.
                  </span>
                </h1>

                <p className="mx-auto mt-8 max-w-2xl text-lg font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                  LikeMinded replaces the "swipe-game" with high-fidelity alignment. 
                  We use neighborhood matching to find the people who actually speak your language.
                </p>

                <div className="mt-12 flex flex-col items-center gap-6">
                  <Link
                    to="/chatbot"
                    className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-slate-950 px-12 py-5 text-sm font-bold text-white transition-all hover:bg-indigo-600 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    Begin your reflection
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  </Link>

                  <div className="flex items-center gap-6 opacity-60">
                    <div className="flex -space-x-3">
                      {avatars.map((src, i) => (
                        <img key={i} src={src} className="h-9 w-9 rounded-full border-2 border-white dark:border-slate-900 bg-white" alt="User" />
                      ))}
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-widest">Privacy First • Stability Checked</p>
                  </div>
                </div>

                <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="mt-16 text-slate-300">
                  <ChevronDown className="mx-auto h-8 w-8" />
                </motion.div>
              </motion.div>
            </div>
          </SectionShell>

          {/* ENGINE: Mathematical Credibility */}
          <SectionShell id="matching">
            <div className="w-full">
              <div className="mb-16 text-center lg:text-left flex flex-col lg:flex-row justify-between items-end gap-6">
                <div className="max-w-xl">
                  <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-500 mb-2">Engine Architecture</div>
                  <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Built on Stability.</h2>
                  <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium italic">"You are not a rank. You are a stable coordinate in a human neighborhood."</p>
                </div>
                <div className="hidden lg:block pb-2">
                  <ShieldCheck className="h-12 w-12 text-indigo-500 opacity-20" />
                </div>
              </div>

              <div className="grid gap-8 lg:grid-cols-3">
                <DiagramCard 
                  title="Alignment Field" 
                  subtitle="How your intent maps to our latent social graph."
                  footer="Updated in real-time"
                  badge="Core"
                >
                  <SignalFieldSVG />
                </DiagramCard>

                <DiagramCard 
                  title="Reliability Index" 
                  subtitle="Filtering out the noise of 'vibes' for real values."
                  footer="98.2% Accuracy"
                  badge="Validation"
                >
                  <CalibrationSVG />
                </DiagramCard>

                <DiagramCard 
                  title="Neighborhood Logic" 
                  subtitle="Clusters represent high-compatibility zones."
                  footer="Topology matching"
                  badge="Graph"
                >
                  <GraphSVG />
                </DiagramCard>
              </div>

              {/* Technical Credibility Block with LaTeX */}
              <div className="mt-12 rounded-[3rem] bg-indigo-500/5 p-10 border border-indigo-500/10 backdrop-blur-sm">
                <div className="flex flex-col lg:flex-row items-center gap-10">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-[10px] font-bold text-indigo-600 mb-4">
                      <Fingerprint className="h-3 w-3" />
                      UNSURPASSABLE PRIVACY
                    </div>
                    <h3 className="text-2xl font-bold">The Stability Formula</h3>
                    <p className="mt-3 text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      We quantify match reliability through latent consistency scores. This ensures that the person you meet today is the person you can build a life with tomorrow.
                    </p>
                  </div>
                  <div className="text-3xl font-serif italic text-indigo-600/80 dark:text-indigo-400/80 p-8 rounded-3xl bg-white/50 dark:bg-slate-900/50 shadow-inner">
                    $$S = \frac{\sum_{i=1}^{n} \omega_i \cdot \cos(\theta_i)}{\sqrt{\text{Var}(\text{Signal})}}$$
                  </div>
                </div>
              </div>
            </div>
          </SectionShell>

          {/* CHAT: The Warm Interface */}
          <SectionShell id="chat">
            <div className="grid gap-20 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="h-14 w-14 rounded-3xl bg-rose-500/10 flex items-center justify-center mb-8">
                  <Heart className="h-7 w-7 text-rose-500" />
                </div>
                <h2 className="text-5xl font-extrabold leading-[0.95] tracking-tighter">
                  A conversation that <br />
                  <span className="bg-gradient-to-r from-indigo-500 to-rose-500 bg-clip-text text-transparent">actually hears you.</span>
                </h2>
                <p className="mt-8 text-xl text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Forget the rigid profile forms. Our guide leads you through a calm, meaningful dialogue designed to surface your true self—effortlessly.
                </p>
                <div className="mt-10 space-y-5">
                  {[
                    "No public transcripts. Privacy is absolute.",
                    "Structured prompts find what stays stable.",
                    "Designed for clarity, honesty, and real connection."
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 text-sm font-bold">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-6 rounded-[4rem] bg-gradient-to-tr from-indigo-500/20 to-rose-500/20 blur-3xl opacity-50" />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  className="relative rounded-[3rem] border border-slate-200 bg-white/90 p-10 shadow-2xl dark:border-slate-800 dark:bg-slate-900/90"
                >
                  <div className="space-y-8">
                    <div className="flex gap-4">
                      <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div className="rounded-3xl rounded-tl-none bg-slate-100 p-5 text-sm font-medium dark:bg-slate-800 leading-relaxed">
                        "Tell me about a time you felt completely understood. What was the setting?"
                      </div>
                    </div>
                    <div className="flex flex-row-reverse gap-4">
                      <div className="h-10 w-10 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg font-bold">
                        U
                      </div>
                      <div className="rounded-3xl rounded-tr-none bg-indigo-600 p-5 text-sm font-medium text-white shadow-lg leading-relaxed">
                        "It was at a small dinner. No music, just deep, unfiltered honesty. I didn't have to explain my jokes."
                      </div>
                    </div>
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Resonance Detected</div>
                        <div className="text-[10px] font-bold text-slate-400">85% Match Consistency</div>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <motion.div 
                          initial={{ width: 0 }} 
                          whileInView={{ width: "85%" }} 
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-rose-500" 
                        />
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
