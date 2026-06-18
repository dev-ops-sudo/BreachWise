import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Play,
  RotateCcw,
  Shield,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  LockSticker,
  RankSticker,
  ShieldSticker,
  TerminalSticker,
} from "@/components/Stickers";
import { resumeSession } from "@/lib/attacks";

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
          <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-brand-200/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-brand-100/40 blur-3xl" />

          <div className="mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
                  <Zap className="h-4 w-4" />
                  AI-Powered Incident Response Training
                </div>
                <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                  Train for the breach{" "}
                  <span className="gradient-text">before it happens</span>
                </h1>
                <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600">
                  BreachWise puts you inside real cyber attack scenarios — ransomware,
                  phishing, zero-days, and more. Make the calls, get ranked, and build
                  muscle memory for when it counts.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link href="/attacks" className="btn-primary">
                    Browse Scenarios
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/auth?mode=signup" className="btn-secondary">
                    Create Free Account
                  </Link>
                </div>

                {/* Resume banner */}
                <div className="mt-10 glass-card rounded-2xl p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100">
                      <Play className="h-5 w-5 text-brand-600" fill="currentColor" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                        Continue where you left off
                      </p>
                      <p className="truncate font-semibold text-slate-900">
                        {resumeSession.attackTitle}
                      </p>
                      <p className="text-sm text-slate-500">
                        {resumeSession.module} · {resumeSession.progress}% complete ·{" "}
                        {resumeSession.lastPlayed}
                      </p>
                    </div>
                    <Link
                      href={`/training?resume=${resumeSession.attackId}`}
                      className="btn-primary shrink-0 !px-4 !py-2.5 text-sm"
                    >
                      Resume
                    </Link>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all"
                      style={{ width: `${resumeSession.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Hero stickers */}
              <div className="relative hidden h-[420px] lg:block">
                <ShieldSticker className="animate-float absolute left-8 top-4 h-28 w-28 drop-shadow-lg" />
                <TerminalSticker className="animate-float-delay absolute right-4 top-16 h-32 w-32 drop-shadow-lg" />
                <RankSticker className="animate-float absolute bottom-20 left-16 h-24 w-24 drop-shadow-lg" />
                <LockSticker className="animate-float-delay absolute bottom-8 right-12 h-20 w-20 drop-shadow-lg" />

                <div className="absolute left-1/2 top-1/2 w-72 -translate-x-1/2 -translate-y-1/2 glass-card rounded-3xl p-6 shadow-xl">
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
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
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

        {/* Stats strip */}
        <section className="border-y border-slate-200/60 bg-white/50">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4">
            {[
              { value: "8+", label: "Attack Scenarios" },
              { value: "NIST", label: "IR Framework Scoring" },
              { value: "Live", label: "Incident Injects" },
              { value: "AI", label: "Decision Evaluation" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-extrabold text-brand-600 md:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-20">
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
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="glass-card group rounded-2xl p-7 transition-all hover:shadow-lg hover:shadow-brand-600/10"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="border-t border-slate-200/60 bg-white/40 py-20"
        >
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
                How it works
              </h2>
              <p className="mt-4 text-slate-600">
                Three steps from signup to ranked incident responder.
              </p>
            </div>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {steps.map((step) => (
                <div key={step.num} className="relative text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-lg font-bold text-white shadow-lg shadow-brand-600/25">
                    {step.num}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link href="/attacks" className="btn-primary">
                <Shield className="h-4 w-4" />
                Start Training Now
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-14 text-center text-white shadow-2xl shadow-brand-600/30 md:px-16">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <Trophy className="mx-auto h-12 w-12 text-brand-200" />
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
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-700 shadow-lg transition-all hover:bg-brand-50 active:scale-[0.98]"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/attacks"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10"
              >
                View All Scenarios
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
