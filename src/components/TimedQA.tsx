import React, { useState, useEffect, useCallback } from "react";
import { AlertCircle, HelpCircle } from "lucide-react";

const QUESTION_SECONDS = 30;

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

interface TimedQAProps {
  questions: Question[];
  expectedCount?: number;
  onAnswer: (questionId: string, answer: string, timeSpent: number) => Promise<boolean>;
  onComplete: (finalAnswer?: {
    questionId: string;
    answer: string;
    timeSpent: number;
    isCorrect: boolean;
  }) => void;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waitingForNext, setWaitingForNext] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / total) * 100;

  const submitAnswer = useCallback(
    async (answer: string) => {
      if (!currentQuestion || isSubmitting) return;
      setIsSubmitting(true);
      try {
        const timeSpent = QUESTION_SECONDS - timeRemaining;
        const isCorrect = await onAnswer(currentQuestion.id, answer, timeSpent);
        if (currentIndex + 1 >= total) {
          onComplete({
            questionId: currentQuestion.id,
            answer,
            timeSpent,
            isCorrect,
          });
        } else if (currentIndex + 1 < questions.length) {
          setCurrentIndex((i) => i + 1);
          setTimeRemaining(QUESTION_SECONDS);
          setSelectedOption(null);
        } else {
          setWaitingForNext(true);
        }
      } catch (error) {
        console.error("Error submitting answer:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentQuestion, currentIndex, isSubmitting, onAnswer, onComplete, questions.length, timeRemaining, total]
  );

  useEffect(() => {
    if (waitingForNext && questions.length > currentIndex + 1) {
      setWaitingForNext(false);
      setCurrentIndex((i) => i + 1);
      setTimeRemaining(QUESTION_SECONDS);
      setSelectedOption(null);
    }
  }, [waitingForNext, questions.length, currentIndex]);

  useEffect(() => {
    if (!currentQuestion || isSubmitting || waitingForNext) return;
    if (timeRemaining <= 0) {
      submitAnswer(selectedOption ? currentQuestion.options?.find((o) => o.id === selectedOption)?.text ?? "No answer" : "No answer");
      return;
    }
    const timer = setTimeout(() => setTimeRemaining((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeRemaining, currentQuestion, isSubmitting, selectedOption, submitAnswer, waitingForNext]);

  useEffect(() => {
    setTimeRemaining(QUESTION_SECONDS);
    setSelectedOption(null);
  }, [currentIndex]);

  if (waitingForNext) {
    return (
      <div className="text-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600 mx-auto" />
        <p className="mt-4 text-slate-600">Loading question {currentIndex + 2}…</p>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="text-center py-12 text-slate-500">Loading next question…</div>
    );
  }

  const getTimerColor = () => {
    if (timeRemaining > 10) return "text-blue-600";
    if (timeRemaining > 5) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Question {currentIndex + 1} of {total}
          </span>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">
            {currentQuestion.difficulty.toUpperCase()}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-brand-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex justify-center mb-6">
        <div className={`text-6xl font-bold font-mono ${getTimerColor()}`}>
          {String(timeRemaining).padStart(2, "0")}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-md p-8 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{currentQuestion.question_text}</h2>

        <div className="space-y-3 mb-6">
          {(currentQuestion.options ?? []).map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setSelectedOption(opt.id);
                submitAnswer(opt.text);
              }}
              className={`w-full text-left rounded-xl border p-4 text-sm transition-all ${
                selectedOption === opt.id
                  ? "border-brand-500 bg-brand-50"
                  : "border-slate-200 hover:border-brand-300 hover:bg-slate-50"
              } disabled:opacity-50`}
            >
              <span className="font-semibold mr-2">{opt.id.toUpperCase()}.</span>
              {opt.text}
            </button>
          ))}
        </div>

        <div className="flex justify-start">
          <button
            type="button"
            onClick={() => aiBoxOnClick?.(currentQuestion.id)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
            disabled={isSubmitting}
          >
            <HelpCircle className="h-4 w-4" />
            Ask AI Mentor
          </button>
        </div>
      </div>

      {timeRemaining <= 5 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">Time running out!</span>
        </div>
      )}
    </div>
  );
}
