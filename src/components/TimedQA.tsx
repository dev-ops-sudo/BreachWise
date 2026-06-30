import React, { useState, useEffect, useCallback } from "react";
import { AlertCircle, HelpCircle, PenLine, Send } from "lucide-react";

export const QUESTION_SECONDS = 60;

interface QuestionOption {
  id: string;
  text: string;
}

interface Question {
  id: string;
  question_text: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  options?: QuestionOption[];
}

export interface AnswerSubmission {
  questionId: string;
  answer: string;
  timeSpent: number;
  isCorrect: boolean;
  answerMode: "mcq" | "text";
  selectedOption?: string;
  feedback?: string;
}

interface TimedQAProps {
  questions: Question[];
  expectedCount?: number;
  onAnswer: (
    questionId: string,
    answer: string,
    timeSpent: number,
    meta: { mode: "mcq" | "text"; selectedOption?: string }
  ) => Promise<{ isCorrect: boolean; feedback: string }>;
  onComplete: (finalAnswer?: AnswerSubmission) => void;
  aiBoxOnClick?: (questionId: string) => void;
}

export default function TimedQA({
  questions,
  expectedCount,
  onAnswer,
  onComplete,
  aiBoxOnClick,
}: TimedQAProps) {
  const total = expectedCount ?? questions.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(QUESTION_SECONDS);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [writtenAnswer, setWrittenAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waitingForNext, setWaitingForNext] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / total) * 100;

  const submitAnswer = useCallback(async () => {
    if (!currentQuestion || isSubmitting) return;

    const selected = currentQuestion.options?.find((o) => o.id === selectedOption);
    const hasText = writtenAnswer.trim().length > 0;
    const hasMcq = Boolean(selected);

    if (!hasText && !hasMcq) return;

    const mode: "mcq" | "text" = hasText ? "text" : "mcq";
    const answer = hasText ? writtenAnswer.trim() : selected!.text;

    setIsSubmitting(true);
    try {
      const timeSpent = QUESTION_SECONDS - timeRemaining;
      const result = await onAnswer(currentQuestion.id, answer, timeSpent, {
        mode,
        selectedOption: selected?.id,
      });

      const submission: AnswerSubmission = {
        questionId: currentQuestion.id,
        answer,
        timeSpent,
        isCorrect: result.isCorrect,
        answerMode: mode,
        selectedOption: selected?.text,
        feedback: result.feedback,
      };

      if (currentIndex + 1 >= total) {
        onComplete(submission);
      } else if (currentIndex + 1 < questions.length) {
        setCurrentIndex((i) => i + 1);
        setTimeRemaining(QUESTION_SECONDS);
        setSelectedOption(null);
        setWrittenAnswer("");
      } else {
        setWaitingForNext(true);
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    currentQuestion,
    currentIndex,
    isSubmitting,
    onAnswer,
    onComplete,
    questions.length,
    selectedOption,
    timeRemaining,
    total,
    writtenAnswer,
  ]);

  useEffect(() => {
    if (waitingForNext && questions.length > currentIndex + 1) {
      setWaitingForNext(false);
      setCurrentIndex((i) => i + 1);
      setTimeRemaining(QUESTION_SECONDS);
      setSelectedOption(null);
      setWrittenAnswer("");
    }
  }, [waitingForNext, questions.length, currentIndex]);

  useEffect(() => {
    if (!currentQuestion || isSubmitting || waitingForNext) return;
    if (timeRemaining <= 0) {
      const fallback =
        writtenAnswer.trim() ||
        currentQuestion.options?.find((o) => o.id === selectedOption)?.text ||
        "No answer";
      void (async () => {
        setIsSubmitting(true);
        const timeSpent = QUESTION_SECONDS;
        const mode: "mcq" | "text" = writtenAnswer.trim() ? "text" : "mcq";
        const result = await onAnswer(currentQuestion.id, fallback, timeSpent, {
          mode,
          selectedOption: selectedOption ?? undefined,
        });
        const submission: AnswerSubmission = {
          questionId: currentQuestion.id,
          answer: fallback,
          timeSpent,
          isCorrect: result.isCorrect,
          answerMode: mode,
          feedback: result.feedback,
        };
        if (currentIndex + 1 >= total) onComplete(submission);
        else if (currentIndex + 1 < questions.length) {
          setCurrentIndex((i) => i + 1);
          setTimeRemaining(QUESTION_SECONDS);
          setSelectedOption(null);
          setWrittenAnswer("");
        } else setWaitingForNext(true);
        setIsSubmitting(false);
      })();
      return;
    }
    const timer = setTimeout(() => setTimeRemaining((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [
    timeRemaining,
    currentQuestion,
    isSubmitting,
    selectedOption,
    writtenAnswer,
    waitingForNext,
    currentIndex,
    onAnswer,
    onComplete,
    total,
  ]);

  useEffect(() => {
    setTimeRemaining(QUESTION_SECONDS);
    setSelectedOption(null);
    setWrittenAnswer("");
  }, [currentIndex]);

  if (waitingForNext) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        <p className="mt-4 text-slate-600">Loading question {currentIndex + 2}…</p>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="py-12 text-center text-slate-500">Loading next question…</div>;
  }

  const canSubmit =
    !isSubmitting && (Boolean(selectedOption) || writtenAnswer.trim().length > 0);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Question {currentIndex + 1} of {total}
          </span>
          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
            {currentQuestion.difficulty.toUpperCase()}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-brand-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mb-6 flex justify-center">
        <div
          className={`relative flex h-24 w-24 flex-col items-center justify-center rounded-full border-4 font-mono transition-all ${
            timeRemaining <= 10
              ? "animate-pulse border-red-400 bg-red-50 text-red-600 shadow-lg shadow-red-200"
              : timeRemaining <= 20
                ? "border-amber-300 bg-amber-50 text-amber-600"
                : "border-brand-200 bg-brand-50 text-brand-600"
          }`}
        >
          <span className="text-3xl font-bold">{String(timeRemaining).padStart(2, "0")}</span>
          <span className="text-[10px] uppercase tracking-wider opacity-70">sec</span>
        </div>
      </div>

      <div className="glass-card mb-6 rounded-2xl p-8">
        <h2 className="mb-6 text-xl font-semibold text-gray-900">
          {currentQuestion.question_text}
        </h2>

        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Select an option
        </p>
        <div className="mb-6 space-y-3">
          {(currentQuestion.options ?? []).map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={isSubmitting}
              onClick={() => setSelectedOption(opt.id)}
              className={`w-full rounded-xl border p-4 text-left text-sm transition-all ${
                selectedOption === opt.id
                  ? "border-brand-500 bg-brand-50 ring-2 ring-brand-200"
                  : "border-slate-200 hover:border-brand-300 hover:bg-slate-50"
              } disabled:opacity-50`}
            >
              <span className="mr-2 font-semibold">{opt.id.toUpperCase()}.</span>
              {opt.text}
            </button>
          ))}
        </div>

        <div className="mb-6 border-t border-slate-200 pt-6">
          <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <PenLine className="h-3.5 w-3.5" />
            Or write your own answer (AI graded)
          </label>
          <textarea
            value={writtenAnswer}
            onChange={(e) => setWrittenAnswer(e.target.value)}
            disabled={isSubmitting}
            placeholder="Describe what you would do in this incident..."
            rows={3}
            className="input-field resize-none"
          />
          <p className="mt-2 text-xs text-slate-500">
            Written answers are checked by AI against the correct response.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void submitAnswer()}
            disabled={!canSubmit}
            className="btn-primary disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Submit Answer
          </button>
          <button
            type="button"
            onClick={() => aiBoxOnClick?.(currentQuestion.id)}
            className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-brand-500/10 px-4 py-2.5 text-sm font-medium text-brand-700 transition hover:border-cyan-400/50"
            disabled={isSubmitting}
          >
            <HelpCircle className="h-4 w-4" />
            Ask AI Mentor
          </button>
        </div>
      </div>

      {timeRemaining <= 10 && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">Less than 10 seconds left!</span>
        </div>
      )}
    </div>
  );
}
