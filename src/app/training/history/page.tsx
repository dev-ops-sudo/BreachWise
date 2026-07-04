"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  History,
  XCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";

interface HistoryAnswer {
  id: string;
  user_answer: string;
  selected_option?: string | null;
  answer_mode?: string;
  is_correct: boolean;
  ai_feedback?: string;
  answer_time_seconds?: number;
}

interface HistoryQuestion {
  id: string;
  question_number: number;
  question_text: string;
  correct_answer: string;
  topic?: string;
}

interface HistoryAttempt {
  id: string;
  total_score: number;
  accuracy_percentage: number;
  overall_rank: string;
  created_at: string;
  attack_id: string;
  questions: HistoryQuestion[];
  answers: HistoryAnswer[];
  war_room_sessions?: {
    completed_at?: string;
    training_sessions?: { attack_id?: string; last_played_at?: string };
  };
}

interface TrainingSessionRow {
  attack_id: string;
  score: number | null;
  status: string;
  last_played_at: string;
}

export default function TrainingHistoryPage() {
  const [attempts, setAttempts] = useState<HistoryAttempt[]>([]);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/warroom/history")
      .then(async (res) => {
        if (res.status === 401) {
          setError("Please log in to view your training history.");
          return;
        }
        if (!res.ok) throw new Error("Failed to load history");
        const data = await res.json();
        setAttempts(data.attempts ?? []);
        setTrainingSessions(data.trainingSessions ?? []);
      })
      .catch(() => setError("Could not load history. Try again later."))
      .finally(() => setLoading(false));
  }, []);

  const duplicateAttacks = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of attempts) {
      const id = a.attack_id;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return [...counts.entries()].filter(([, n]) => n > 1).map(([id]) => id);
  }, [attempts]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link
          href="/training"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Training
        </Link>

        <div className="mb-8 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
            <History className="h-6 w-6 text-brand-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Training History</h1>
            <p className="mt-1 text-slate-600">
              Review past simulations, scores, and answers to track progress and avoid
              repeating the same test unknowingly.
            </p>
          </div>
        </div>

        {duplicateAttacks.length > 0 && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            You have completed the same scenario more than once:{" "}
            <strong>{duplicateAttacks.join(", ")}</strong>. Expand an attempt below to
            compare results.
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-800">{error}</p>
            <Link href="/auth" className="btn-primary mt-4 inline-flex">
              Log in
            </Link>
          </div>
        )}

        {!loading && !error && attempts.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-slate-600">No completed AI War Room sessions yet.</p>
            <Link href="/attacks" className="btn-primary mt-4 inline-flex">
              Start a Scenario
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {attempts.map((attempt) => {
            const isOpen = expandedId === attempt.id;
            const correctCount = attempt.answers.filter((a) => a.is_correct).length;
            const date = new Date(attempt.created_at).toLocaleString();

            return (
              <div
                key={attempt.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : attempt.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-4 p-5 text-left hover:bg-slate-50"
                >
                  <div>
                    <p className="font-semibold text-slate-900 capitalize">
                      {attempt.attack_id.replace(/-/g, " ")}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {date}
                      </span>
                      <span>
                        {correctCount}/{attempt.answers.length} correct
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="rounded-lg bg-brand-100 px-3 py-1 text-sm font-bold text-brand-800">
                      {attempt.total_score}/100
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-700">
                      {attempt.overall_rank}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-5">
                    <div className="space-y-4">
                      {attempt.questions.map((q, idx) => {
                        const ans = attempt.answers[idx];
                        if (!ans) return null;
                        return (
                          <div
                            key={q.id}
                            className="rounded-lg border border-slate-200 bg-white p-4"
                          >
                            <div className="mb-2 flex items-start justify-between gap-3">
                              <p className="text-sm font-medium text-slate-900">
                                Q{q.question_number}. {q.question_text}
                              </p>
                              {ans.is_correct ? (
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 shrink-0 text-red-600" />
                              )}
                            </div>
                            <p className="text-sm text-slate-600">
                              <span className="font-medium">Your answer:</span>{" "}
                              {ans.selected_option || ans.user_answer}
                              {ans.answer_mode === "text" && (
                                <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-800">
                                  written
                                </span>
                              )}
                            </p>
                            {!ans.is_correct && (
                              <p className="mt-1 text-sm text-slate-600">
                                <span className="font-medium">Correct:</span>{" "}
                                {q.correct_answer}
                              </p>
                            )}
                            {ans.ai_feedback && (
                              <p className="mt-2 rounded-lg bg-slate-100 p-3 text-sm text-slate-700">
                                {ans.ai_feedback}
                              </p>
                            )}
                            {ans.answer_time_seconds != null && (
                              <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
                                <Clock className="h-3 w-3" />
                                {ans.answer_time_seconds}s
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {trainingSessions.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Scenario Progress Summary
            </h2>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Scenario</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Best Score</th>
                    <th className="px-4 py-3 font-medium">Last Played</th>
                  </tr>
                </thead>
                <tbody>
                  {trainingSessions.map((row) => (
                    <tr key={row.attack_id} className="border-b border-slate-50">
                      <td className="px-4 py-3 capitalize">
                        {row.attack_id.replace(/-/g, " ")}
                      </td>
                      <td className="px-4 py-3 capitalize">{row.status}</td>
                      <td className="px-4 py-3">{row.score ?? "—"}</td>
                      <td className="px-4 py-3">
                        {new Date(row.last_played_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
