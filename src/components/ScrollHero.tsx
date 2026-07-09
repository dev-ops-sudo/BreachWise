"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Shield,
  Activity,
  Cpu,
  Trophy,
  Zap,
  Server,
  AlertTriangle,
  Globe,
} from "lucide-react";

export default function ScrollHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalHeight = rect.height - window.innerHeight;
      if (totalHeight <= 0) return;
      const currentScroll = -rect.top;
      const pct = Math.max(0, Math.min(100, (currentScroll / totalHeight) * 100));
      setProgress(Math.round(pct));
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  // Background Image zoom and opacity
  const bgOpacity = Math.max(0.08, Math.min(0.45, 0.45 - (progress / 60) * 0.35));
  const bgScale = 1 + (progress / 100) * 0.15; // Increased scale range for clear zoom feel

  // Title Zoom-Through calculation: grows and fades out as scroll starts (0% to 32%)
  const titleScale = 1 + (progress / 32) * 1.8;
  const titleOpacity = Math.max(0, 1 - (progress / 24));
  const titleBlur = Math.min(8, (progress / 32) * 10);

  // Staging console wrapper reveal
  const workspaceOpacity = progress < 20 ? 0 : Math.min(1, (progress - 20) / 10);
  const workspaceTranslate = progress < 20 ? 40 : Math.max(0, 40 - (progress - 20) * 4);

  return (
    <div ref={containerRef} className="relative h-[300vh] bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Sticky Fullscreen Range Window */}
      <div className="sticky top-0 flex h-screen w-full flex-col justify-between overflow-hidden bg-slate-50 dark:bg-slate-950 px-6 py-6 text-slate-800 dark:text-white md:px-12 md:py-8 transition-colors duration-300">
        
        {/* Cinematic Background & Grid Overlays */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-100 ease-out"
            style={{
              backgroundImage: "url('/cybersecurity_hero_bg.png')",
              opacity: bgOpacity,
              transform: `scale(${bgScale})`,
            }}
          />
          {/* Theme Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-100/90 via-slate-50/95 to-slate-100 dark:from-slate-950/80 dark:via-slate-950/95 dark:to-slate-950 transition-colors duration-300" />
          {/* Tech Grid Patterns */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#dbeafe_1px,transparent_1px),linear-gradient(to_bottom,#dbeafe_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#0c1524_1px,transparent_1px),linear-gradient(to_bottom,#0c1524_1px,transparent_1px)] bg-[size:4rem_4rem] transition-colors duration-300" />
        </div>

        {/* HUD Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-brand-600 dark:text-brand-500 animate-pulse" />
            <span className="font-mono text-sm font-semibold tracking-wider text-slate-700 dark:text-slate-300">
              BREACHWISE // INCIDENT RANGE
            </span>
          </div>
          <div className="flex items-center gap-6 font-mono text-xs text-slate-500 dark:text-slate-400">
            <span className="hidden md:inline-flex items-center gap-1.5 font-bold">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-ping" />
              STATUS: STAGED_ONLINE
            </span>
            <div className="rounded border border-brand-650/20 dark:border-brand-500/30 bg-brand-600/10 dark:bg-brand-500/10 px-3 py-1 text-sm font-bold text-brand-700 dark:text-brand-400 shadow-[0_0_10px_rgba(59,130,246,0.05)] dark:shadow-[0_0_10px_rgba(59,130,246,0.15)]">
              RANGE LOAD [{progress.toString().padStart(3, "0")}%]
            </div>
          </div>
        </div>

        {/* Cinematic Title Zoom-Through (0% - 32% scroll) */}
        {progress < 32 && (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none select-none z-10 transition-all duration-100 ease-out"
            style={{
              opacity: titleOpacity,
              transform: `scale(${titleScale})`,
              filter: `blur(${titleBlur}px)`,
            }}
          >
            <h1 className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter text-slate-900 dark:text-white uppercase drop-shadow-[0_0_35px_rgba(59,130,246,0.15)] dark:drop-shadow-[0_0_35px_rgba(59,130,246,0.35)]">
              BreachWise
            </h1>
            <p className="mt-4 font-mono text-xs sm:text-sm md:text-base tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400 font-bold max-w-lg">
              AI-Powered Incident Response Sandbox
            </p>
            
            {/* Overlay indicators */}
            <div className="absolute bottom-20 flex gap-4 pointer-events-auto">
              <button 
                onClick={() => window.scrollTo({ top: window.innerHeight * 0.9, behavior: "smooth" })}
                className="rounded-full border border-slate-300 hover:border-slate-400 bg-slate-900/5 hover:bg-slate-900/10 text-slate-700 dark:border-slate-800 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 px-6 py-2.5 text-xs font-mono tracking-wider uppercase transition-all duration-300 animate-pulse-soft"
              >
                Deploy Sandbox
              </button>
              <button 
                onClick={() => window.scrollTo({ top: window.innerHeight * 2.8, behavior: "smooth" })}
                className="rounded-full border border-brand-600/30 bg-brand-600/10 hover:bg-brand-600/20 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:hover:bg-brand-500/20 dark:text-brand-400 px-6 py-2.5 text-xs font-mono tracking-wider uppercase transition-all duration-300"
              >
                Explore Platform
              </button>
            </div>
          </div>
        )}

        {/* Detailed Interactive Workspace Grid */}
        <div 
          className="relative z-10 grid flex-1 items-center gap-8 py-8 lg:grid-cols-2"
          style={{
            opacity: workspaceOpacity,
            transform: `translateY(${workspaceTranslate}px)`,
            pointerEvents: progress < 20 ? "none" : "auto",
          }}
        >
          
          {/* Left Panel: Content Progression */}
          <div className="flex flex-col justify-center h-full max-w-xl">
            
            {/* Stage 1: Deploying Vectors (progress 20% - 55%) */}
            {progress >= 20 && progress < 55 && (
              <div className="space-y-6 animate-fade-in-up duration-300">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-300 text-amber-800 dark:bg-amber-950/60 dark:border-amber-800/80 dark:text-amber-400 px-4 py-1.5 text-xs font-mono tracking-wider uppercase">
                  <Cpu className="h-3.5 w-3.5 animate-spin" />
                  RANGE DISCOVERY // INITIALIZING SCENARIOS
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white md:text-4xl">
                  Deploying Attack Vectors
                </h2>
                <p className="text-slate-650 dark:text-slate-400 leading-relaxed text-sm">
                  The range launches isolated threat modules simulating ransomware loop encryption, CFO harvest templates, zero-day gateway entry points, and domain lateral moves.
                </p>
                
                {/* Visual vectors status */}
                <div className="grid gap-3 sm:grid-cols-2 mt-4">
                  <div className={`rounded-xl border p-4 bg-white/70 dark:bg-slate-900/60 transition-all duration-300 ${progress >= 30 ? 'border-brand-500/60 text-brand-600 dark:text-brand-400 shadow-sm' : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-semibold text-xs text-slate-950 dark:text-white uppercase">Ransomware sandbox</h3>
                      <span className="font-mono text-[9px] font-bold">{progress >= 30 ? "ACTIVE" : "QUEUED"}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Container FS-PROD-01</p>
                  </div>
                  <div className={`rounded-xl border p-4 bg-white/70 dark:bg-slate-900/60 transition-all duration-300 ${progress >= 42 ? 'border-cyan-500/60 text-cyan-600 dark:text-cyan-400 shadow-sm' : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-semibold text-xs text-slate-950 dark:text-white uppercase">Phishing portal</h3>
                      <span className="font-mono text-[9px] font-bold">{progress >= 42 ? "ACTIVE" : "QUEUED"}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Subnet MX-SMTP-02</p>
                  </div>
                </div>
              </div>
            )}

            {/* Stage 2: AI Evaluator & NIST scoring (progress 55% - 82%) */}
            {progress >= 55 && progress < 82 && (
              <div className="space-y-6 animate-fade-in-up duration-300">
                <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 border border-cyan-300 text-cyan-850 dark:bg-cyan-950/60 dark:border-cyan-800/80 dark:text-cyan-400 px-4 py-1.5 text-xs font-mono tracking-wider uppercase">
                  <Activity className="h-3.5 w-3.5 animate-pulse" />
                  ASSESSMENT MATRIX ACTIVE
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white md:text-4xl">
                  NIST Assessment Dials
                </h2>
                <p className="text-slate-650 dark:text-slate-400 leading-relaxed text-sm">
                  We verify your containing calls in real-time, matching them across the standard incident response phases: Detect, Contain, Eradicate, and Recover.
                </p>

                {/* SVG Ring Dials */}
                <div className="flex gap-6 mt-4">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-14 h-14 transform -rotate-90">
                      <circle cx="28" cy="28" r="24" className="stroke-slate-200 dark:stroke-slate-850 fill-none" strokeWidth="4" />
                      <circle 
                        cx="28" 
                        cy="28" 
                        r="24" 
                        className="stroke-brand-600 dark:stroke-cyan-500 fill-none transition-all duration-300" 
                        strokeWidth="4" 
                        strokeDasharray={`${2 * Math.PI * 24}`}
                        strokeDashoffset={`${2 * Math.PI * 24 * (1 - Math.min(94, (progress - 55) * 4) / 100)}`}
                      />
                    </svg>
                    <span className="font-mono text-[10px] text-slate-500">CONTAIN</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-14 h-14 transform -rotate-90">
                      <circle cx="28" cy="28" r="24" className="stroke-slate-200 dark:stroke-slate-850 fill-none" strokeWidth="4" />
                      <circle 
                        cx="28" 
                        cy="28" 
                        r="24" 
                        className="stroke-brand-500 dark:stroke-brand-400 fill-none transition-all duration-300" 
                        strokeWidth="4" 
                        strokeDasharray={`${2 * Math.PI * 24}`}
                        strokeDashoffset={`${2 * Math.PI * 24 * (1 - Math.min(82, (progress - 55) * 3) / 100)}`}
                      />
                    </svg>
                    <span className="font-mono text-[10px] text-slate-500">ERADICATE</span>
                  </div>
                </div>
              </div>
            )}

            {/* Stage 3: Ready for Range Sandbox (progress 82% - 100%) */}
            {progress >= 82 && (
              <div className="space-y-6 animate-fade-in-up duration-300">
                <div className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-300 text-green-800 dark:bg-green-950/60 dark:border-green-800/80 dark:text-green-400 px-4 py-1.5 text-xs font-mono tracking-wider uppercase">
                  <Zap className="h-3.5 w-3.5 animate-pulse" />
                  RANGE DISCOVERY // TERMINAL SYNCED
                </div>
                <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  Enter the Cyber Range
                </h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                  Isolate compromised systems, manage stakeholders communications, test decision accuracy, and climb the public leaderboards.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <Link href="/attacks" className="btn-primary flex items-center gap-2 px-6 py-3 hover:-translate-y-0.5 text-sm font-bold shadow-lg shadow-brand-500/10 dark:shadow-brand-500/20 bg-brand-600 hover:bg-brand-500 border border-transparent text-white">
                    Browse Scenarios
                    <ArrowRight className="h-4.5 w-4.5" />
                  </Link>
                  <Link href="/auth?mode=signup" className="btn-secondary px-6 py-3 hover:-translate-y-0.5 text-sm font-bold border-slate-300 text-slate-700 hover:bg-slate-55 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900">
                    Create Account
                  </Link>
                </div>
              </div>
            )}

          </div>

          {/* Right Panel: Immersive Console Window */}
          <div className="flex items-center justify-center h-full">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/90 shadow-xl shadow-slate-200/40 dark:shadow-black/80 backdrop-blur-md transition-colors duration-300">
              
              {/* Window Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/60 px-4 py-3 transition-colors duration-300">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-500/85" />
                  <span className="h-3 w-3 rounded-full bg-amber-500/85" />
                  <span className="h-3 w-3 rounded-full bg-green-500/85" />
                </div>
                <span className="font-mono text-xs tracking-wider text-slate-400 dark:text-slate-500">
                  sandbox@breachwise-console
                </span>
                <span className="text-xs text-brand-600 dark:text-brand-500 font-mono animate-pulse">● RANGE_SYS</span>
              </div>

              {/* Console log outputs */}
              <div className="h-[250px] p-5 font-mono text-[11px] leading-relaxed text-slate-800 dark:text-slate-300 overflow-y-auto space-y-3 transition-colors duration-300">
                <p className="text-brand-600 dark:text-brand-500">
                  {">"} rangectl --deploy --sandbox-mode
                </p>
                <p className="text-slate-400 dark:text-slate-500">
                  [STATUS] Spawning secure target subnets...
                </p>

                {progress >= 30 && (
                  <p className="text-slate-500">
                    [GATEWAY] Tunnel established. Staging network assets...
                  </p>
                )}

                {progress >= 42 && (
                  <>
                    <p className="text-amber-600 dark:text-amber-500 font-bold">
                      [ALERT] Outbreak trigger: ransomware on FS-PROD-01 (10.0.1.15)
                    </p>
                    <p className="text-red-600 dark:text-red-500 font-bold animate-pulse">
                      [ALERT] Crypto loop started: sector logs locked.
                    </p>
                  </>
                )}

                {progress >= 60 && (
                  <>
                    <p className="text-brand-600 dark:text-cyan-400">
                      [INJECT] CEO alert: &quot;Please submit immediate impact report on compromise.&quot;
                    </p>
                    <p className="text-slate-500">
                      {">"} Range query: isolate domain or keep services online?
                    </p>
                  </>
                )}

                {progress >= 76 && (
                  <>
                    <p className="text-emerald-600 dark:text-green-500 font-bold">
                      [AI] containment accuracy evaluated: 89.2% (VALIDATOR OK)
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      [METRICS] Containment phase elapsed: 4m 12s
                    </p>
                  </>
                )}

                {progress >= 92 && (
                  <>
                    <p className="text-brand-600 dark:text-brand-400 font-bold">
                      [SYS] readiness index: ADVANCED (Level 3 / NIST)
                    </p>
                    <p className="text-slate-400 dark:text-slate-500 animate-pulse">
                      _ sync completed. sandbox gateway unlocked.
                    </p>
                  </>
                )}
              </div>

              {/* Console Footer */}
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 px-4 py-3 font-mono text-[10px] text-slate-400 dark:text-slate-500 transition-colors duration-300">
                <span>SECURE SHELL // SSHv2</span>
                <span>RANGE ID: BW-{(progress * 13).toString(16).toUpperCase()}</span>
              </div>
            </div>
          </div>

        </div>

        {/* HUD Footer */}
        <div className="relative z-10 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 font-mono text-[10px] text-slate-400 dark:text-slate-500 transition-colors duration-300">
          <span className="hidden sm:inline">NIST INJECT SCHEDULER SP-800-61</span>
          <span>© 2026 BREACHWISE PLATFORM</span>
          <div className="flex gap-4">
            <span>SEC_OP: ACTIVE</span>
            <span>MEM: 94%</span>
          </div>
        </div>

      </div>
    </div>
  );
}
