"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { jsPDF } from "jspdf";
import { createClient } from "@/lib/supabase/client";

interface ReportResponse {
  overall_score: number;
  readiness_level: string;
  strong_phases: string[];
  weak_phases: string[];
  summary: string;
  top_recommendation: string;
  suitable_for: string;
}

function getBadgeClasses(level: string) {
  switch (level) {
    case "Beginner":
      return "bg-red-500/15 text-red-300";
    case "Junior Analyst":
      return "bg-amber-500/15 text-amber-300";
    case "SOC Analyst":
      return "bg-cyan-500/15 text-cyan-300";
    case "Senior Analyst":
      return "bg-emerald-500/15 text-emerald-300";
    default:
      return "bg-slate-500/15 text-slate-300";
  }
}

export default function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const scores = useMemo(() => {
    const raw = searchParams.get("scores");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as number[];
    } catch {
      return null;
    }
  }, [searchParams]);

  const answers = useMemo(() => {
    const raw = searchParams.get("answers");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Array<{ isCorrect: boolean }>;
    } catch {
      return null;
    }
  }, [searchParams]);
  const scenarioId = searchParams.get("scenarioId") ?? "";
  const scenarioTitle = searchParams.get("scenarioTitle") ?? "";
  const sessionId =
    searchParams.get("sessionId") ??
    (typeof window !== "undefined" ? sessionStorage.getItem("war_room_session_id") : null) ??
    "";

  useEffect(() => {
    if (!scores || !scenarioTitle || !scenarioId) {
      setError("Missing report parameters.");
      setLoading(false);
      return;
    }

    const fetchReport = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scenarioTitle,
            scores,
            answers,
            nistPhases: JSON.parse(searchParams.get("nistPhases") ?? "[]"),
          }),
        });

        if (!response.ok) {
          throw new Error(`Report request failed: ${response.status}`);
        }

        const data = (await response.json()) as ReportResponse;
        setReport(data);
      } catch (err) {
        console.error(err);
        setError("Unable to generate the readiness report.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [scores, answers, scenarioTitle, scenarioId, searchParams]);

  useEffect(() => {
    if (!report || !scores || !scenarioId) return;

    const saveResult = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user?.id) {
          return;
        }

        const { error: insertError } = await supabase.from("scenario_results").insert([
          {
            user_id: user.id,
            scenario_id: scenarioId,
            scenario_title: scenarioTitle,
            scores,
            overall_score: report.overall_score,
            readiness_level: report.readiness_level,
            weak_phases: report.weak_phases,
            strong_phases: report.strong_phases,
            session_id: sessionId || null,
            completed_at: new Date().toISOString(),
          },
        ]);

        if (insertError) {
          console.error("Supabase save failed:", insertError);
          return;
        }

        setSaveSuccess(true);
        window.setTimeout(() => setSaveSuccess(false), 3000);
      } catch (saveError) {
        console.error("Supabase save error:", saveError);
      }
    };

    saveResult();
  }, [report, scores, answers, scenarioId, scenarioTitle, sessionId]);

  const downloadPDF = () => {
    if (!report) return;

    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const margin = 40;
    let y = 60;
    const lineHeight = 18;

    doc.setFontSize(22);
    doc.text("BreachWise Readiness Report", margin, y);

    doc.setFontSize(12);
    y += 30;
    doc.text(`Scenario: ${scenarioTitle}`, margin, y);
    y += 20;
    doc.text(`Overall Score: ${report.overall_score}/100`, margin, y);
    y += 25;
    doc.text(`Readiness Level: ${report.readiness_level}`, margin, y);

    y += 30;
    doc.setFontSize(14);
    doc.text("Summary", margin, y);
    doc.setFontSize(12);
    y += 20;
    doc.text(doc.splitTextToSize(report.summary, 520), margin, y);

    y += 60;
    doc.setFontSize(14);
    doc.text("Strong Phases", margin, y);
    y += 18;
    doc.setFontSize(12);
    doc.text(report.strong_phases.join(", "), margin, y);

    y += 30;
    doc.setFontSize(14);
    doc.text("Weak Phases", margin, y);
    y += 18;
    doc.setFontSize(12);
    doc.text(report.weak_phases.join(", "), margin, y);

    y += 30;
    doc.setFontSize(14);
    doc.text("Top Recommendation", margin, y);
    y += 20;
    doc.setFontSize(12);
    doc.text(doc.splitTextToSize(report.top_recommendation, 520), margin, y);

    y += 50;
    doc.setFontSize(14);
    doc.text("Suitable For", margin, y);
    y += 20;
    doc.setFontSize(12);
    doc.text(report.suitable_for, margin, y);

    doc.save(`${scenarioTitle.replace(/[^a-z0-9]/gi, "_")}_readiness_report.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-xl shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-400/70">Readiness Report</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">{scenarioTitle}</h1>
            </div>
            <button
              type="button"
              onClick={() => router.push("/attacks")}
              className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Play Again
            </button>
          </div>

          <p className="max-w-3xl text-sm leading-7 text-slate-400">
            The report analyzes your incident response readiness and provides a professional assessment based on the training scores.
          </p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-10 text-center text-slate-300">
            Generating your report...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-10 text-center text-red-200">
            {error}
          </div>
        ) : report ? (
          <div className="space-y-8">
            <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Overall Score</p>
                <p className="mt-6 text-7xl font-bold text-white">{report.overall_score}</p>
                <p className="mt-2 text-sm text-slate-400">out of 100</p>
                <span className={`mt-6 inline-flex rounded-full px-4 py-2 text-sm font-semibold ${getBadgeClasses(report.readiness_level)}`}>
                  {report.readiness_level}
                </span>
              </div>

              <div className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/80 p-8">
                <div>
                  <h2 className="text-lg font-semibold text-white">Professional Assessment</h2>
                  <p className="mt-4 text-slate-300 leading-7">{report.summary}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Top Recommendation</p>
                    <p className="mt-3 text-sm leading-7 text-slate-200">{report.top_recommendation}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Suitable For</p>
                    <p className="mt-3 text-xl font-semibold text-white">{report.suitable_for}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8">
                <h3 className="text-sm uppercase tracking-[0.2em] text-cyan-300">Strong Phases</h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  {report.strong_phases.map((phase) => (
                    <span key={phase} className="rounded-full bg-emerald-500/15 px-4 py-2 text-sm text-emerald-300">
                      {phase}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8">
                <h3 className="text-sm uppercase tracking-[0.2em] text-cyan-300">Weak Phases</h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  {report.weak_phases.map((phase) => (
                    <span key={phase} className="rounded-full bg-red-500/15 px-4 py-2 text-sm text-red-300">
                      {phase}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={downloadPDF}
                className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Download Report
              </button>
              <button
                type="button"
                onClick={() => router.push("/attacks")}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Play Again
              </button>
            </div>
          </div>
        ) : null}
        {saveSuccess && (
          <div className="fixed bottom-6 right-6 rounded-3xl border border-cyan-500/20 bg-cyan-500/10 px-5 py-3 text-sm text-cyan-100 shadow-xl shadow-cyan-500/10">
            Results saved
          </div>
        )}
      </div>
    </div>
  );
}
