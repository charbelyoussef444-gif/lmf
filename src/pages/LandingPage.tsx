// LandingPage.tsx
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ChevronDown, Sparkles, Heart, Users, Zap } from "lucide-react";
import { api } from "../lib/api"; 

import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";

/** High-End Section Wrapper with refined scroll-snap */
function SectionShell({ id, children, className = "" }: { id: string; children: ReactNode; className?: string }) {
  return (
    <section
      id={id}
      className={`min-h-[calc(100vh-80px)] w-full py-20 flex items-center justify-center ${className}`}
      style={{ scrollSnapAlign: "start" }}
    >
      <div className="w-full">{children}</div>
    </section>
  );
}

/** Premium Glass Card with enhanced depth */
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
    <div className="group relative rounded-[2rem] border border-slate-200/60 bg-white/40 p-6 shadow-2xl shadow-slate-200/50 backdrop-blur-xl transition-all hover:translate-y-[-4px] dark:border-slate-700/50 dark:bg-slate-900/40 dark:shadow-black/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {title}
          </div>
          <div className="mt-1 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
            {subtitle}
          </div>
        </div>
        {badge && (
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">{children}</div>
      {footer && (
        <div className="mt-4 flex items-center gap-2 text-[11px] font-medium text-slate-400 dark:text-slate-500">
          <Zap className="h-3 w-3 text-amber-400" />
          {footer}
        </div>
      )}
    </div>
  );
}

/* --- Refined SVGs (Kept the logic, polished the aesthetics) --- */

function SignalFieldSVG() {
  return (
    <svg viewBox="0 0 520 260" className="w-full">
      <defs>
        <linearGradient id="sfG" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      <rect width="520" height="260" rx="18" fill="transparent" />
      <path
        d="M60,165 C120,70 170,210 220,115 C270,15 325,225 370,120 C420,45 470,190 496,105"
        fill="none"
        stroke="url(#sfG)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {[[105, 98], [175, 178], [240, 120], [310, 158], [385, 92]].map(([x, y], i) => (
        <motion.circle 
          key={i} cx={x} cy={y} r="4" fill="white" stroke="#6366f1" strokeWidth="2"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.2 }}
        />
      ))}
    </svg>
  );
}

function CalibrationSVG() {
  return (
    <svg viewBox="0 0 520 260" className="w-full">
      <path d="M50,210 L470,210 M50,210 L50,30" stroke="currentColor" strokeOpacity="0.1" />
      <path
        d="M50,200 C150,180 250,100 450,40"
        fill="none"
        stroke="url(#sfG)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <text x="200" y="240" fontSize="10" className="fill-slate-400 uppercase tracking-widest">Reliability Threshold</text>
    </svg>
  );
}

function GraphSVG() {
  const nodes = [{ x: 100, y: 130 }, { x: 200, y: 80 }, { x: 200, y: 180 }, { x: 300, y: 130 }, { x: 400, y: 130 }];
  return (
    <svg viewBox="0 0 520 260" className="w-full">
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r="15" fill="#6366f1" fillOpacity="0.1" stroke="#6366f1" strokeWidth="1" />
      ))}
      <path d="M115,130 L185,85 M115,130 L185,175 M215,85 L285,125 M215,175 L285,125 M315,130 L385,130" stroke="#6366f1" strokeOpacity="0.3" strokeDasharray="4 2" />
    </svg>
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
    return () => { mounted = false; };
  }, []);

  const displayCount = waitlistCount ?? 0;
  const avatars = useMemo(() => ["lm1", "lm2", "lm3", "lm4", "lm5"].map(s => `https://api.dicebear.com/7.x/avataaars/svg?seed=${s}`), []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#fafafa] text-slate-900 selection:bg-indigo-100 dark:bg-slate-950 dark:text-slate-50">
      
      {/* Dynamic Background Orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -left-20 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px] dark:bg-indigo-500/10" 
        />
        <motion.div 
          animate={{ x: [0, -40, 0], y: [0, 60, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 -right-20 h-[400px] w-[400px] rounded-full bg-rose-500/5 blur-[100px] dark:bg-rose-500/10" 
        />
      </div>

      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="sticky top-0 z-50 -mx-6 px-6 backdrop-blur-xl border-b border-slate-200/50 bg-white/60 dark:bg-slate-950/60 dark:border-slate-800/50">
          <AppHeader />
        </div>

        <main style={{ scrollSnapType: "y proximity" }}>
          
          {/* HERO: The Emotional Hook */}
          <SectionShell id="waitlist">
            <div className="mx-auto max-w-4xl text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "circOut" }}
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-1.5 text-[12px] font-medium shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-slate-600 dark:text-slate-300">
                    Join {displayCount.toLocaleString()} others seeking depth
                  </span>
                </div>

                <h1 className="mt-8 text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl">
                  Finding your <br />
                  <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 bg-clip-text text-transparent">
                    human resonance.
                  </span>
                </h1>

                <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                  LikeMinded replaces the "swipe-game" with high-fidelity alignment. 
                  We use neighborhood matching to find the people who actually speak your language.
                </p>

                <div className="mt-10 flex flex-col items-center gap-6">
                  <Link
                    to="/chatbot"
                    className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-slate-900 px-10 py-4 text-sm font-bold text-white transition-all hover:bg-indigo-600 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    Begin your reflection
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  </Link>

                  <div className="flex items-center gap-6 opacity-60">
                    <div className="flex -space-x-3">
                      {avatars.map((src, i) => (
                        <img key={i} src={src} className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-900" alt="User" />
                      ))}
                    </div>
                    <p className="text-xs font-medium">Gated Access • Privacy First</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </SectionShell>

          {/* ENGINE: The Intellectual Credibility */}
          <SectionShell id="matching">
            <div className="w-full">
              <div className="mb-16 text-center lg:text-left">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built on Stability.</h2>
                <p className="mt-4 text-slate-500 dark:text-slate-400">Our engine measures the invariant traits that stay consistent across every mood.</p>
              </div>

              <div className="grid gap-8 lg:grid-cols-3">
                <DiagramCard 
                  title="Alignment Field" 
                  subtitle="How your intent maps to our social graph."
                  footer="Updated in real-time"
                >
                  <SignalFieldSVG />
                </DiagramCard>

                <DiagramCard 
                  title="Stability Check" 
                  subtitle="Filtering out the noise of 'vibes' for real values."
                  footer="98.2% Accuracy"
                >
                  <CalibrationSVG />
                </DiagramCard>

                <DiagramCard 
                  title="Neighborhood Logic" 
                  subtitle="You aren't a rank. You're part of a community."
                  footer="Clustered by depth"
                >
                  <GraphSVG />
                </DiagramCard>
              </div>

              {/* Technical Credibility Block */}
              <div className="mt-12 rounded-[2.5rem] bg-indigo-500/5 p-8 border border-indigo-500/10">
                <div className="flex flex-col lg:flex-row items-center gap-8">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">The Stability Formula</h3>
                    <p className="mt-2 text-sm text-slate-500">We quantify match reliability through latent consistency scores.</p>
                  </div>
                  <div className="text-2xl font-serif italic text-indigo-600/80 dark:text-indigo-400/80">
                    $$S = \frac{\sum_{i=1}^{n} \omega_i \cdot \cos(\theta_i)}{\sqrt{\text{Var}(\text{Signal})}}$$
                  </div>
                </div>
              </div>
            </div>
          </SectionShell>

          {/* CHAT: The Warm Interface */}
          <SectionShell id="chat">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              <div>
                <Heart className="h-10 w-10 text-rose-500 mb-6" />
                <h2 className="text-4xl font-bold leading-tight">A conversation that <br /><span className="text-indigo-500">actually hears you.</span></h2>
                <p className="mt-6 text-lg text-slate-600 dark:text-slate-400">
                  Forget the rigid profile forms. Our guide leads you through a calm, meaningful dialogue designed to surface your true self—effortlessly.
                </p>
                <ul className="mt-8 space-y-4">
                  {[
                    "No public transcripts. Ever.",
                    "AI-assisted nuance detection.",
                    "Focus on long-term compatibility."
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-semibold">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500">✓</div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 rounded-[3rem] bg-gradient-to-tr from-indigo-500/20 to-rose-500/20 blur-2xl" />
                <div className="relative rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900/90">
                  <div className="space-y-6">
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-600" />
                      <div className="rounded-2xl bg-slate-100 p-4 text-sm dark:bg-slate-800">
                        "Tell me about a time you felt completely understood. What was the setting?"
                      </div>
                    </div>
                    <div className="flex flex-row-reverse gap-3">
                      <div className="h-8 w-8 rounded-full bg-rose-500" />
                      <div className="rounded-2xl bg-indigo-600 p-4 text-sm text-white">
                        "It was at a small dinner. No music, just deep, unfiltered honesty. I didn't have to explain my jokes."
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Resonance Detected</div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <motion.div initial={{ width: 0 }} whileInView={{ width: "85%" }} className="h-full bg-indigo-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SectionShell>

          <AppFooter />
        </main>
      </div>
    </div>
  );
}
