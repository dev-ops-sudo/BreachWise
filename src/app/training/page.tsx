"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Play,
  Shield,
  Trophy,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { attacks, resumeSession } from "@/lib/attacks";
import { getLatestSession, upsertSession } from "@/lib/training-progress";
import { TerminalSticker } from "@/components/Stickers";
import type { ResumeSession } from "@/lib/attacks";

function TrainingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeId = searchParams.get("resume");
  const mode = searchParams.get("mode");
  const scenariosParam = searchParams.get("scenarios");

  const [sessionData, setSessionData] = useState<ResumeSession | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const isResume = Boolean(resumeId);
  const isFullCurriculum = mode === "all";
  const activeSession = sessionData ?? resumeSession;

  const selectedAttacks = useMemo(() => {
    if (isResume && resumeId) {
      return attacks.filter((a) => a.id === resumeId);
    }
    if (isFullCurriculum) return attacks;
    if (scenariosParam) {
      const ids = scenariosParam.split(",");
      return attacks.filter((a) => ids.includes(a.id));
    }
    return [];
  }, [isResume, resumeId, isFullCurriculum, scenariosParam]);

  useEffect(() => {
    if (isResume && resumeId) {
      getLatestSession().then(setSessionData).catch(() => setSessionData(null));
    }
  }, [isResume, resumeId]);

  const handleStartTraining = async () => {
    const attackId = selectedAttacks[0]?.id;
    if (!attackId) return;

    setStarting(true);
    setStartError(null);

    try {
      await upsertSession(attackId, {
        progress: isResume ? activeSession.progress : 5,
        current_module: isResume
          ? activeSession.module
          : "Module 1 — Briefing",
        status: "in_progress",
      });
    } catch (err) {
      console.warn("Could not sync session to Supabase:", err);
    }

    router.push(`/training/simulation?attack=${attackId}`);
    setStarting(false);
  };

  const totalDuration = selectedAttacks.reduce((sum, a) => {
    const mins = parseInt(a.duration, 10);
    return sum + (isNaN(mins) ? 0 : mins);
  }, 0);

  if (selectedAttacks.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <Shield className="mx-auto h-12 w-12 text-brand-400" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          No scenarios selected
        </h1>
        <p className="mt-2 text-slate-600">
          Head back to the library and pick at least one attack to begin training.
        </p>
        <Link href="/attacks" className="btn-primary mt-6 inline-flex">
          <ArrowLeft className="h-4 w-4" />
          Back to Scenarios
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/attacks"
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to library
      </Link>

      <div className="relative">
        <TerminalSticker className="absolute -right-4 -top-8 hidden h-20 w-20 opacity-60 sm:block" />

        <div className="glass-card rounded-3xl p-8 md:p-10">
          {isResume ? (
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700">
              <Play className="h-3.5 w-3.5" fill="currentColor" />
              Resuming Session
            </div>
          ) : (
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-1.5 text-sm font-semibold text-green-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Ready to Launch
            </div>
          )}

          <h1 className="text-3xl font-bold text-slate-900">
            {isResume
              ? `Continue: ${selectedAttacks[0]?.title}`
              : isFullCurriculum
                ? "Full Curriculum"
                : `${selectedAttacks.length} Scenario${selectedAttacks.length > 1 ? "s" : ""} Selected`}
          </h1>

          <p className="mt-3 text-slate-600">
            {isResume
              ? `Pick up at ${activeSession.module}. Your previous decisions and score are saved.`
              : "Review your lineup below, then enter the war room. Live incident injects will begin once you start."}
          </p>

          {isResume && (
            <div className="mt-6 rounded-2xl bg-brand-50 p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-brand-700">Progress</span>
                <span className="font-bold text-brand-800">
                  {activeSession.progress}%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-100">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all"
                  style={{ width: `${activeSession.progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-brand-600">
                Last played {activeSession.lastPlayed}
              </p>
            </div>
          )}

          <div className="mt-8 space-y-3">
            {selectedAttacks.map((attack, i) => (
              <div
                key={attack.id}
                className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-sm font-bold text-brand-700">
                  {isResume ? "↻" : i + 1}
                </span>
                <span className="text-2xl">{attack.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{attack.title}</p>
                  <p className="text-xs text-slate-500">
                    {attack.category} · {attack.difficulty} · {attack.duration}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              ~{totalDuration} min total
            </span>
            <span className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4" />
              Ranked scoring enabled
            </span>
          </div>

          {startError && (
            <p className="mt-4 text-sm text-red-600">{startError}</p>
          )}

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              type="button"
              className="btn-primary flex-1 sm:flex-none disabled:opacity-60"
              disabled={starting}
              onClick={handleStartTraining}
            >
              <Play className="h-4 w-4" fill="currentColor" />
              {starting
                ? "Saving..."
                : isResume
                  ? "Resume Training"
                  : "Start Training"}
            </button>
            {!isResume && (
              <Link href="/attacks" className="btn-secondary">
                Change Selection
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Preview war room UI teaser */}
      <div className="mt-10 glass-card overflow-hidden rounded-2xl">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            War Room Preview
          </p>
        </div>
        <div className="space-y-3 p-5 font-mono text-xs">
          <p className="text-slate-400">
            [SYSTEM] BreachWise war room initializing...
          </p>
          <p className="text-brand-600">
            [SCENARIO] {selectedAttacks[0]?.title} loaded
          </p>
          <p className="text-amber-600">
            [INJECT] First incident alert incoming in 5s...
          </p>
          <p className="text-slate-400 animate-pulse-soft">
            _ standing by for your command...
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TrainingPage() {
  return (
    <>
      <Navbar variant="auth" />
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          </div>
        }
      >
        <TrainingContent />
      </Suspense>
    </>
  );
}
