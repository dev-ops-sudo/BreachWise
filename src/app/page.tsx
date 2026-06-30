import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  RotateCcw,
  Shield,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import FloatingCyberBot from "@/components/FloatingCyberBot";
import Footer from "@/components/Footer";
import ResumeBanner from "@/components/ResumeBanner";
import ScrollReveal from "@/components/ScrollReveal";
import {
  LockSticker,
  RankSticker,
  ShieldSticker,
  TerminalSticker,
} from "@/components/Stickers";

const features = [
  {
    icon: Target,
    title: "Realistic Scenarios",
    description:
      "Step into ransomware outbreaks, phishing campaigns, and APT incidents — each built from real-world playbooks.",
  },
  {
    icon: BarChart3,
    title: "Performance Ranking",
    description:
      "Every decision is scored. Climb the leaderboard and track your improvement across NIST incident response phases.",
  },
  {
    icon: RotateCcw,
    title: "Resume Anytime",
    description:
      "Life happens mid-incident. Pick up exactly where you stopped — same module, same progress, zero friction.",
  },
  {
    icon: Users,
    title: "Team Training",
    description:
      "Facilitators can run war-room sessions with live injects every 60–90 seconds for group readiness drills.",
  },
];

const steps = [
  { num: "01", title: "Choose Your Attack", desc: "Browse the scenario library and pick one or run the full curriculum." },
  { num: "02", title: "Enter the Simulation", desc: "Live injects hit your dashboard. Decide, contain, communicate — under pressure." },
  { num: "03", title: "Get Scored & Ranked", desc: "AI evaluates your calls against best practice. See where you excel and where to grow." },
];

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <div className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200/80 bg-white/60 px-4 py-1.5 text-sm font-medium text-brand-700 backdrop-blur-sm">
                  <Zap className="h-4 w-4" />
                  AI-Powered Incident Response Training
                </div>
                <h1 className="animate-fade-in-up stagger-1 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                  Train for the breach{" "}
                  <span className="shimmer-text">before it happens</span>
                </h1>
                <p className="animate-fade-in-up stagger-2 mt-6 max-w-lg text-lg leading-relaxed text-slate-600">
                  BreachWise puts you inside real cyber attack scenarios — ransomware,
                  phishing, zero-days, and more. Make the calls, get ranked, and build
                  muscle memory for when it counts.
                </p>
                <div className="animate-fade-in-up stagger-3 mt-8 flex flex-wrap items-center gap-4">
                  <Link href="/attacks" className="btn-primary hover:-translate-y-0.5">
                    Browse Scenarios
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/auth?mode=signup" className="btn-secondary hover:-translate-y-0.5">
                    Create Free Account
                  </Link>
                </div>

                <div className="animate-fade-in-up stagger-4">
                  <ResumeBanner />
                </div>
              </div>

              {/* Hero stickers */}
              <div className="relative hidden h-[420px] lg:block">
                <ShieldSticker className="animate-float absolute left-8 top-4 h-28 w-28 drop-shadow-lg" />
                <TerminalSticker className="animate-float-delay absolute right-4 top-16 h-32 w-32 drop-shadow-lg" />
                <RankSticker className="animate-float-slow absolute bottom-20 left-16 h-24 w-24 drop-shadow-lg" />
                <LockSticker className="animate-float absolute bottom-8 right-12 h-20 w-20 drop-shadow-lg" />

                <div className="animate-scale-in stagger-3 absolute left-1/2 top-1/2 w-72 -translate-x-1/2 -translate-y-1/2 glass-card animate-hero-glow rounded-3xl p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                    <span className="ml-2 text-xs font-mono text-slate-400">
                      breachwise — war room
                    </span>
                  </div>
                  <div className="space-y-2 font-mono text-xs">
                    <p className="text-red-500">
                      [ALERT] Ransomware detected on FS-PROD-01
                    </p>
                    <p className="text-amber-600">
                      [INJECT] CFO requesting status update...
                    </p>
                    <p className="text-brand-600">
                      {">"} Your move: isolate segment or maintain uptime?
                    </p>
                    <p className="text-slate-400 animate-pulse-soft">
                      _ awaiting decision...
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-brand-50/80 px-4 py-3 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-brand-600" />
                      <span className="text-sm font-semibold text-brand-700">
                        Rank #12
                      </span>
                    </div>
                    <span className="text-xs text-brand-600">Score: 847 pts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live ticker */}
        <section className="overflow-hidden border-b border-slate-200/40 bg-slate-950 py-3">
          <div className="ticker-track flex gap-12 whitespace-nowrap text-xs font-mono uppercase tracking-[0.2em] text-cyan-400/90">
            {[...Array(2)].map((_, i) => (
              <span key={i} className="flex shrink-0 gap-12">
                <span>◆ Ransomware drill live</span>
                <span>◆ AI mentor online</span>
                <span>◆ NIST scoring active</span>
                <span>◆ 847 analysts training</span>
                <span>◆ Zero-day scenario unlocked</span>
              </span>
            ))}
          </div>
        </section>

        {/* Stats strip */}
        <section className="border-y border-slate-200/40 bg-white/40 backdrop-blur-sm">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4">
            {[
              { value: "8+", label: "Attack Scenarios" },
              { value: "NIST", label: "IR Framework Scoring" },
              { value: "Live", label: "Incident Injects" },
              { value: "AI", label: "Decision Evaluation" },
            ].map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 80}>
                <div className="text-center transition-transform hover:scale-105">
                  <p className="text-2xl font-extrabold text-brand-600 md:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-20">
          <ScrollReveal>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
                Everything you need to{" "}
                <span className="gradient-text">level up</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-slate-600">
                From your first phishing drill to advanced APT hunts — BreachWise
                scales with your team&apos;s readiness goals.
              </p>
            </div>
          </ScrollReveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {features.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 100}>
                <div className="glass-card group h-full rounded-2xl p-7 hover:-translate-y-1">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-brand-600/30">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {f.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="border-t border-slate-200/40 bg-white/30 py-20 backdrop-blur-sm"
        >
          <div className="mx-auto max-w-6xl px-6">
            <ScrollReveal>
              <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
                  How it works
                </h2>
                <p className="mt-4 text-slate-600">
                  Three steps from signup to ranked incident responder.
                </p>
              </div>
            </ScrollReveal>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {steps.map((step, i) => (
                <ScrollReveal key={step.num} delay={i * 120} direction="up">
                  <div className="group relative text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-lg font-bold text-white shadow-lg shadow-brand-600/25 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                      {step.num}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {step.desc}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
            <ScrollReveal delay={400}>
              <div className="mt-12 text-center">
                <Link href="/attacks" className="btn-primary hover:-translate-y-0.5">
                  <Shield className="h-4 w-4" />
                  Start Training Now
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <ScrollReveal direction="fade">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-14 text-center text-white shadow-2xl shadow-brand-600/30 md:px-16">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl animate-float-slow" />
              <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl animate-float" />
              <Trophy className="mx-auto h-12 w-12 text-brand-200 animate-float-slow" />
              <h2 className="mt-4 text-3xl font-bold md:text-4xl">
                Ready to test your defenses?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-brand-100">
                Join BreachWise free. Pick your scenarios, run the simulation, and
                see where you rank against other responders.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/auth?mode=signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-700 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-brand-50 active:scale-[0.98]"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/attacks"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-white/10"
                >
                  View All Scenarios
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>
      <Footer />
      <FloatingCyberBot />
    </>
  );
}
