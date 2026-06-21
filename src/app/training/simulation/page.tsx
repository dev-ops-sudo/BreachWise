"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield, CheckCircle2, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { attacks } from "@/lib/attacks";

interface Question {
  id: number;
  question: string;
  category: "Technical" | "Decision" | "Communication";
}

function WarRoomContent() {
  const searchParams = useSearchParams();
  const attackId = searchParams.get("attack");
  const attack = attacks.find((a) => a.id === attackId);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [userAnswers, setUserAnswers] = useState<Array<{ question: string; answer: string }>>([]);

  // ========================================
  // 📝 ADD YOUR SAMPLE QUESTIONS HERE
  // ========================================
  const sampleQuestions: Question[] = [
    {
      id: 1,
      question: "What is your first action as Incident Response Lead?",
      category: "Decision",
    },
    {
      id: 2,
      question: "How would you assess the scope of the incident?",
      category: "Technical",
    },
    {
      id: 3,
      question: "Who should be notified immediately?",
      category: "Communication",
    },
    // 👆 PASTE YOUR QUESTIONS ABOVE IN THIS FORMAT 👆
    // Example format:
    // {
    //   id: 4,
    //   question: "Your question here",
    //   category: "Technical" | "Decision" | "Communication",
    // },
  ];

  // Timer countdown
  useEffect(() => {
    if (!answered && sampleQuestions.length > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setAnswered(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [answered, sampleQuestions.length]);

  if (!attack) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <Navbar variant="auth" />
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-6 py-24 text-center">
          <Shield className="h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Scenario Not Found
          </h1>
          <Link href="/attacks" className="btn-primary mt-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Scenarios
          </Link>
        </div>
      </div>
    );
  }

  if (sampleQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <Navbar variant="auth" />
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-6 py-24 text-center">
          <Shield className="h-12 w-12 text-amber-500" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            No Questions Available
          </h1>
          <p className="mt-2 text-slate-600">
            Please add sample questions to the sampleQuestions array in the simulation page.
          </p>
          <Link href="/attacks" className="btn-primary mt-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Scenarios
          </Link>
        </div>
      </div>
    );
  }

  const question = sampleQuestions[currentQuestion];
  const isLastQuestion = currentQuestion === sampleQuestions.length - 1;

  const handleSubmitAnswer = () => {
    setAnswered(true);
  };

  const handleNextQuestion = () => {
    // Save current answer
    const newAnswers = [
      ...userAnswers,
      {
        question: sampleQuestions[currentQuestion]?.question || "",
        answer: selectedAnswer,
      },
    ];
    setUserAnswers(newAnswers);

    if (currentQuestion < sampleQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setTimeLeft(15);
      setAnswered(false);
      setSelectedAnswer("");
    }
  };

  const handleFinish = () => {
    // Store all answers including the last one
    const allAnswers = [
      ...userAnswers,
      {
        question: sampleQuestions[currentQuestion]?.question || "",
        answer: selectedAnswer,
      },
    ];

    // Redirect to results page with data
    const answersJson = encodeURIComponent(JSON.stringify(allAnswers));
    window.location.href = `/training/results?attack=${attackId}&answers=${answersJson}&difficulty=${attack?.difficulty}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Navbar variant="auth" />

      <div className="mx-auto max-w-3xl px-6 py-8">
        <Link
          href="/attacks"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to scenarios
        </Link>

        {/* War Room Header */}
        <div className="mb-8 rounded-2xl border border-red-900 bg-gradient-to-r from-red-950 to-slate-900 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="relative inline-flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <h1 className="text-2xl font-bold text-red-400">⚠ INCIDENT ACTIVE</h1>
          </div>
          <h2 className="text-3xl font-bold text-slate-100">{attack.title}</h2>
          <p className="mt-2 text-slate-300">
            Role: <span className="font-semibold">Incident Response Lead</span>
          </p>
        </div>

        {/* Mission Briefing */}
        <div className="mb-8 rounded-2xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Mission Briefing
          </h3>
          <p className="text-slate-200 leading-relaxed">{attack.description}</p>
        </div>

        {/* Question Card */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-8 backdrop-blur">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Question {currentQuestion + 1} of {sampleQuestions.length}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Category: {question.category}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all"
                style={{
                  width: `${((currentQuestion + 1) / sampleQuestions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-slate-100">{question.question}</h3>
          </div>

          {/* Answer Input */}
          <div className="mb-6">
            <textarea
              value={selectedAnswer}
              onChange={(e) => setSelectedAnswer(e.target.value)}
              placeholder="Type your answer here..."
              disabled={answered}
              className="w-full min-h-24 resize-none rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 disabled:opacity-50"
            />
          </div>

          {/* Timer & Actions */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className={`text-2xl font-bold ${
                  timeLeft > 5
                    ? "text-slate-300"
                    : timeLeft > 0
                      ? "text-amber-400"
                      : "text-red-400"
                }`}
              >
                {timeLeft}s
              </span>
              <span className="text-sm text-slate-400">remaining</span>
            </div>

            <div className="flex gap-3">
              {!answered ? (
                <button
                  onClick={handleSubmitAnswer}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Submit Answer
                </button>
              ) : isLastQuestion ? (
                <button onClick={handleFinish} className="btn-primary inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Finish Training
                </button>
              ) : (
                <button onClick={handleNextQuestion} className="btn-primary inline-flex items-center gap-2">
                  Next Question →
                </button>
              )}
            </div>
          </div>

          {answered && (
            <div className="mt-6 rounded-lg border border-green-900/50 bg-green-900/20 p-4">
              <p className="text-sm font-semibold text-green-400">
                ✓ Answer recorded. Continue to next question.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WarRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-900">
          <Loader2 className="h-12 w-12 animate-spin text-brand-600" />
        </div>
      }
    >
      <WarRoomContent />
    </Suspense>
  );
}
