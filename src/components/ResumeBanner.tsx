"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getLatestSession } from "@/lib/training-progress";
import { resumeSession as fallbackSession, type ResumeSession } from "@/lib/attacks";

export default function ResumeBanner({ compact = false }: { compact?: boolean }) {
  const [session, setSession] = useState<ResumeSession | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const fetchSession = async (userExists: boolean) => {
      if (!userExists) {
        setIsLoggedIn(false);
        setSession(null);
        setLoading(false);
        return;
      }
      setIsLoggedIn(true);
      try {
        const data = await getLatestSession();
        if (data) {
          setSession(data);
        } else {
          // New user (logged in, but no previous session) -> start with 0
          setSession({
            attackId: "phishing",
            attackTitle: "Spear Phishing Campaign",
            progress: 0,
            lastPlayed: "Not started yet",
            module: "Module 1 — Briefing",
          });
        }
      } catch (err) {
        console.error("Error loading session in ResumeBanner:", err);
      } finally {
        setLoading(false);
      }
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      fetchSession(!!user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      fetchSession(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading || !isLoggedIn || !session) {
    return null;
  }

  const active = session;

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
