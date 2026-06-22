"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getLatestSession } from "@/lib/training-progress";
import { resumeSession as fallbackSession, type ResumeSession } from "@/lib/attacks";

export default function ResumeBanner({ compact = false }: { compact?: boolean }) {
  const [session, setSession] = useState<ResumeSession | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSession(fallbackSession);
      return;
    }

    getLatestSession()
      .then((data) => {
        setSession(data ?? fallbackSession);
        setIsLoggedIn(data !== null);
      })
      .catch(() => setSession(fallbackSession));
  }, []);

  const active = session ?? fallbackSession;

  if (compact) {
    return (
      <div className="mb-8 glass-card rounded-2xl border-l-4 border-l-brand-500 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100">
              <Play className="h-5 w-5 text-brand-600" fill="currentColor" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                Resume training
              </p>
              <p className="font-semibold text-slate-900">
                {active.attackTitle} — {active.module}
              </p>
              <p className="text-sm text-slate-500">
                {active.progress}% complete · Last played {active.lastPlayed}
                {!isLoggedIn && " · Demo data"}
              </p>
            </div>
          </div>
          <Link
            href={`/training?resume=${active.attackId}`}
            className="btn-primary !px-5 !py-2.5 text-sm"
          >
            <Play className="h-4 w-4" fill="currentColor" />
            Resume Here
          </Link>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600"
            style={{ width: `${active.progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 glass-card rounded-2xl p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100">
          <Play className="h-5 w-5 text-brand-600" fill="currentColor" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Continue where you left off
          </p>
          <p className="truncate font-semibold text-slate-900">{active.attackTitle}</p>
          <p className="text-sm text-slate-500">
            {active.module} · {active.progress}% complete · {active.lastPlayed}
            {!isLoggedIn && " · Sign in to sync progress"}
          </p>
        </div>
        <Link
          href={`/training?resume=${active.attackId}`}
          className="btn-primary shrink-0 !px-4 !py-2.5 text-sm"
        >
          Resume
        </Link>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all"
          style={{ width: `${active.progress}%` }}
        />
      </div>
    </div>
  );
}
