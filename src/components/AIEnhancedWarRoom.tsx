"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Radio,
  Server,
  Shield,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import {
  getScenarioForAttack,
  injectSeverityStyles,
  nodeStatusStyles,
  type Scenario,
} from "@/lib/scenarios";
import { upsertSession } from "@/lib/training-progress";
import TimedQA from "./TimedQA";
import AIGuidanceBox from "./AIGuidanceBox";
import RankingDisplay from "./RankingDisplay";
import SolutionBox from "./SolutionBox";

type Phase = "briefing" | "ai-qa" | "complete" | "classic";
const TARGET_QUESTION_COUNT = 4;

interface WarRoomProps {
  attackId: string;
  enableAI?: boolean;
}

interface Question {
  id: string;
  question_number?: number;
  question_text: string;
  correct_answer: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  options?: Array<{ id: string; text: string }>;
}

interface UserAnswer {
  questionId: string;
  answer: string;
  timeSpent: number;
  isCorrect: boolean;
}

function formatSimTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function AIEnhancedWarRoom({
  attackId,
  enableAI = true,
}: WarRoomProps) {
  const scenario = getScenarioForAttack(attackId);

  // AI War Room State
  const [phase, setPhase] = useState<Phase>("briefing");
  const [userId, setUserId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [preloadError, setPreloadError] = useState<string | null>(null);
  const [aiGuidanceOpen, setAiGuidanceOpen] = useState(false);
  const [showSolution, setShowSolution] = useState<{
    question: string;
    userAnswer: string;
    correctAnswer: string;
  } | null>(null);
  const [ranking, setRanking] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Get user ID on mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return;
        }

        setUserId(user.id);
      } catch (error) {
        console.error("Error initializing war room session:", error);
      } finally {
        setLoadingSession(false);
      }
    };

    initializeSession();
  }, [attackId]);

  const questionCacheRef = useRef(new Map<number, Question>());
  const pendingQuestionsRef = useRef(new Map<number, Promise<Question | null>>());

  const prefetchQuestion = useCallback((num: number): Promise<Question | null> => {
    const cached = questionCacheRef.current.get(num);
    if (cached) return Promise.resolve(cached);

    const pending = pendingQuestionsRef.current.get(num);
    if (pending) return pending;

    const request = fetch("/api/warroom/scenario-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attackId, questionNumber: num }),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        const question = data.question as Question | null;
        if (question) questionCacheRef.current.set(num, question);
        return question;
      })
      .finally(() => pendingQuestionsRef.current.delete(num));

    pendingQuestionsRef.current.set(num, request);
    return request;
  }, [attackId]);

  const loadQuestion = useCallback(async (num: number) => {
    const cached = questionCacheRef.current.get(num);
    if (cached) return cached;

    const res = await fetch(`/api/warroom/scenario-questions?attackId=${attackId}&n=${num}`);
    if (!res.ok) return null;
    const data = await res.json();
    const question = data.question as Question | null;
    if (question) questionCacheRef.current.set(num, question);
    return question;
  }, [attackId]);

  const startWarRoom = useCallback(async () => {
    if (!userId) {
      alert("Please log in to enter the AI War Room.");
      return;
    }

    try {
      setIsGeneratingQuestions(true);
      setPreloadError(null);

      const q1 = await loadQuestion(1);
      if (!q1) throw new Error("No question available");

      setQuestions([q1]);
      setPhase("ai-qa");
      void upsertSession(attackId, {
        progress: 0,
        current_module: "AI War Room",
        status: "in_progress",
        score: 0,
      }).catch(() => {});

      // Keep only one question ahead to avoid request bursts.
      prefetchQuestion(2).then((q) => {
        if (q) {
          setQuestions((prev) =>
            prev.some((x) => x.id === q.id) ? prev : [...prev, q]
          );
        }
      });
    } catch (error) {
      console.error("Error starting war room:", error);
      setPreloadError("Could not load questions. Try again.");
    } finally {
      setIsGeneratingQuestions(false);
    }
  }, [userId, loadQuestion, prefetchQuestion, attackId]);

  const handleAnswer = useCallback(
    async (questionId: string, answer: string, timeSpent: number) => {
      const question = questions.find((q) => q.id === questionId);
      if (!question) return false;

      const isCorrect =
        answer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();

      setUserAnswers((prev) => [
        ...prev,
        { questionId, answer, timeSpent, isCorrect },
      ]);

      const nextNum = userAnswers.length + 2;
      if (nextNum <= TARGET_QUESTION_COUNT && !questions.find((q) => q.question_number === nextNum)) {
        prefetchQuestion(nextNum).then((q) => {
          if (q) setQuestions((prev) => (prev.some((x) => x.id === q.id) ? prev : [...prev, q]));
        });
      }

      return isCorrect;
    },
    [questions, userAnswers.length, prefetchQuestion]
  );

  /**
   * Handle quiz completion and ranking
   */
  const handleQuizComplete = useCallback(async (finalAnswer?: UserAnswer) => {
    if (!userId) return;

    try {
      const completedAnswers =
        finalAnswer && !userAnswers.some((answer) => answer.questionId === finalAnswer.questionId)
          ? [...userAnswers, finalAnswer]
          : userAnswers;

      const questionsForEval = questions.map((q) => ({
        question_text: q.question_text,
        correct_answer: q.correct_answer,
        topic: q.topic,
      }));

      const answersForEval = completedAnswers.map((a) => {
        const q = questions.find((x) => x.id === a.questionId);
        return {
          question_text: q?.question_text ?? "",
          user_answer: a.answer,
          time_seconds: a.timeSpent,
        };
      });

      const response = await fetch("/api/warroom/evaluate-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: questionsForEval, userAnswers: answersForEval }),
      });

      const evaluation = response.ok
        ? await response.json()
        : {
            score: Math.round(
              (completedAnswers.filter((a) => a.isCorrect).length / Math.max(completedAnswers.length, 1)) * 100
            ),
            accuracy_percentage: Math.round(
              (completedAnswers.filter((a) => a.isCorrect).length / Math.max(completedAnswers.length, 1)) * 100
            ),
            overall_rank: "Intermediate",
            strengths: [],
            weaknesses: [],
            recommendations: "Review missed questions and retry.",
          };

      void upsertSession(attackId, {
        progress: 100,
        current_module: "AI War Room complete",
        status: "completed",
        score: evaluation.score || evaluation.accuracy_percentage || 0,
      }).catch(() => {});

      setRanking(evaluation);
      setPhase("complete");
    } catch (error) {
      console.error("Error completing quiz:", error);
      setPhase("complete");
      setRanking({
        score: 50,
        accuracy_percentage: 50,
        overall_rank: "Intermediate",
        strengths: [],
        weaknesses: [],
        recommendations: "Session complete.",
      } as any);
    }
  }, [userId, questions, userAnswers, attackId]);

  /**
   * AI guidance request handler
   */
  const handleAIGuidanceRequest = useCallback((questionId: string) => {
    setAiGuidanceOpen(true);
  }, []);

  /**
   * Show solution for wrong answer
   */
  const handleShowSolution = useCallback((question: Question, userAnswer: string) => {
    setShowSolution({
      question: question.question_text,
      userAnswer,
      correctAnswer: question.correct_answer,
    });
  }, []);

  if (loadingSession) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <Shield className="mx-auto h-12 w-12 text-brand-400" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          Simulation not available
        </h1>
        <p className="mt-2 text-slate-600">
          This scenario does not have a simulation yet.
        </p>
        <Link href="/attacks" className="btn-primary mt-6 inline-flex">
          Back to Scenarios
        </Link>
      </div>
    );
  }

  // Briefing Phase
  if (phase === "briefing") {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-700">
            {scenario.severity}
          </span>
          <span className="text-sm text-slate-500">{scenario.reference}</span>
          {enableAI && (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700">
              <Zap className="inline h-3 w-3 mr-1" />
              AI Enhanced
            </span>
          )}
        </div>

        <h1 className="text-3xl font-bold text-slate-900">{scenario.title}</h1>
        <p className="mt-2 text-brand-600 font-medium">Role: {scenario.role}</p>

        <div className="mt-8 glass-card rounded-2xl p-6 md:p-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Mission Briefing
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-700">
            {scenario.briefing}
          </p>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">How This Works:</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>✓ 4 questions · 30 seconds each</li>
            <li>✓ Q1 preloaded on login — no wait</li>
            <li>✓ AI will evaluate your answers and provide feedback</li>
            <li>✓ Get guidance or ask for solutions anytime</li>
            <li>✓ Receive comprehensive ranking and recommendations once logged in</li>
          </ul>
        </div>

        {!userId && (
          <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-200 p-5 text-sm text-amber-900">
            Log in to enable AI question generation, session persistence, and score tracking.
          </div>
        )}

        {preloadError && (
          <p className="mt-4 text-sm text-red-600">{preloadError}</p>
        )}

        <div className="mt-8 flex flex-wrap gap-4">
          <button
            onClick={startWarRoom}
            disabled={isGeneratingQuestions || !userId}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {isGeneratingQuestions ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Generating Questions...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Enter War Room (AI Mode)
              </>
            )}
          </button>
          <Link href="/training" className="btn-secondary">
            Back
          </Link>
        </div>
      </div>
    );
  }

  // AI Q&A Phase
  if (phase === "ai-qa" && questions.length > 0) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            AI War Room Active
          </p>
          <h1 className="text-xl font-bold text-slate-900">{scenario.title}</h1>
          <p className="mt-1 text-sm text-slate-600">
            AI-Generated Interactive Training
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Q&A Section */}
          <div className="lg:col-span-3">
            <TimedQA
              questions={questions}
              expectedCount={TARGET_QUESTION_COUNT}
              onAnswer={handleAnswer}
              onComplete={handleQuizComplete}
              aiBoxOnClick={handleAIGuidanceRequest}
            />
          </div>

          {/* AI Guidance Sidebar */}
          <div className="lg:col-span-1">
            <AIGuidanceBox
              currentQuestion={
                questions[userAnswers.length]?.question_text
              }
            />
          </div>
        </div>

        {/* Solution Modal */}
        {showSolution && (
          <SolutionBox
            question={showSolution.question}
            userAnswer={showSolution.userAnswer}
            correctAnswer={showSolution.correctAnswer}
            onClose={() => setShowSolution(null)}
          />
        )}
      </div>
    );
  }

  // Complete Phase with Ranking
  if (phase === "complete" && ranking) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <Trophy className="h-12 w-12 text-brand-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-center text-slate-900">
            War Room Debrief
          </h1>
          <p className="mt-2 text-center text-slate-600">{scenario.title}</p>
        </div>

        <RankingDisplay
          ranking={ranking}
          totalQuestions={questions.length}
          onRetry={() => window.location.reload()}
          onHome={() => {
            setPhase("briefing");
            setQuestions([]);
            setUserAnswers([]);
            setRanking(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <Shield className="h-12 w-12 text-brand-400 mx-auto" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Loading...</h1>
      </div>
    </div>
  );
}
