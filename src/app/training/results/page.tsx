"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  TrendingUp,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";

interface FeedbackData {
  score: number;
  rank: "Novice" | "Intermediate" | "Advanced" | "Expert";
  strengths: string[];
  improvements: string[];
  feedback: string;
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const attackTitle = searchParams.get("attack");
  const answersJson = searchParams.get("answers");
  const difficulty = searchParams.get("difficulty");

  useEffect(() => {
    const generateFeedback = async () => {
      try {
        if (!attackTitle || !answersJson) {
          throw new Error("Missing required data");
        }

        const answers = JSON.parse(decodeURIComponent(answersJson));

        const res = await fetch("/api/generate-feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attackTitle,
            userAnswers: answers,
            difficulty: difficulty || "Intermediate",
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to generate feedback");
        }

        const data = await res.json();
        setFeedbackData(data);

        // Save result to database
        await fetch("/api/save-result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attackId: attackTitle,
            attackTitle,
            ...data,
            answersCount: answers.length,
            completedAt: new Date().toISOString(),
          }),
        });
      } catch (err) {
        console.error("Error:", err);
        setError(err instanceof Error ? err.message : "Failed to process results");
      } finally {
        setLoading(false);
      }
    };

    generateFeedback();
  }, [attackTitle, answersJson, difficulty]);

  const getRankColor = (rank: string) => {
    switch (rank) {
      case "Expert":
        return "from-purple-600 to-pink-600";
      case "Advanced":
        return "from-blue-600 to-cyan-600";
      case "Intermediate":
        return "from-amber-600 to-orange-600";
      default:
        return "from-gray-600 to-slate-600";
    }
  };

  const getRankBadgeColor = (rank: string) => {
    switch (rank) {
      case "Expert":
        return "bg-purple-100 text-purple-700";
      case "Advanced":
        return "bg-blue-100 text-blue-700";
      case "Intermediate":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          <p className="mt-4 text-lg font-semibold text-slate-700">
            Analyzing your performance...
          </p>
          <p className="mt-1 text-sm text-slate-500">
            AI is generating personalized feedback
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <Navbar variant="auth" />
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-6 py-24 text-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Error</h1>
          <p className="mt-2 text-slate-600">{error}</p>
          <Link href="/attacks" className="btn-primary mt-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Scenarios
          </Link>
        </div>
      </div>
    );
  }

  if (!feedbackData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <Navbar variant="auth" />
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-6 py-24 text-center">
          <AlertCircle className="h-12 w-12 text-amber-500" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">No Results</h1>
          <Link href="/attacks" className="btn-primary mt-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Scenarios
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar variant="auth" />

      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link
          href="/attacks"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to scenarios
        </Link>

        {/* Score & Rank Card */}
        <div
          className={`mb-8 rounded-3xl bg-gradient-to-br ${getRankColor(
            feedbackData.rank
          )} p-8 text-white shadow-2xl`}
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold">Training Complete! 🎉</h1>
            <Award className="h-12 w-12 opacity-80" />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider opacity-90">
                Your Score
              </p>
              <p className="mt-2 text-5xl font-bold">{feedbackData.score}</p>
              <p className="mt-1 text-sm opacity-90">out of 100</p>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-wider opacity-90">
                Your Rank
              </p>
              <div className="mt-2 inline-flex items-center gap-3">
                <span className="text-4xl font-bold">{feedbackData.rank}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Message */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-lg text-slate-700 leading-relaxed">
            {feedbackData.feedback}
          </p>
        </div>

        {/* Strengths */}
        <div className="mb-8 rounded-2xl border border-green-200 bg-green-50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-bold text-green-900">Your Strengths</h2>
          </div>
          <ul className="space-y-3">
            {feedbackData.strengths.map((strength, i) => (
              <li key={i} className="flex items-start gap-3 text-green-800">
                <span className="mt-1.5 inline-block h-2 w-2 rounded-full bg-green-600 flex-shrink-0"></span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-blue-900">
              Areas for Improvement
            </h2>
          </div>
          <ul className="space-y-3">
            {feedbackData.improvements.map((improvement, i) => (
              <li key={i} className="flex items-start gap-3 text-blue-800">
                <span className="mt-1.5 inline-block h-2 w-2 rounded-full bg-blue-600 flex-shrink-0"></span>
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Next Steps */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Next Steps</h3>
          <ul className="space-y-2 text-slate-700">
            <li className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-brand-600" />
              Review the improvement areas
            </li>
            <li className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-brand-600" />
              Retake this scenario to practice
            </li>
            <li className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-brand-600" />
              Try harder difficulty levels
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <Link href="/attacks" className="btn-primary inline-flex items-center gap-2">
            Try Another Scenario
          </Link>
          <button
            onClick={() => window.location.href = `/training?scenarios=${attackTitle}`}
            className="btn-secondary inline-flex items-center gap-2"
          >
            Retry This Scenario
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
