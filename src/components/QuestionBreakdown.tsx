import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { AnswerFeedbackItem } from "@/lib/war-room-types";

interface QuestionBreakdownProps {
  items: AnswerFeedbackItem[];
}

export default function QuestionBreakdown({ items }: QuestionBreakdownProps) {
  if (!items.length) return null;

  return (
    <div className="mb-8">
      <h3 className="mb-4 text-xl font-bold text-slate-900">Question-by-Question Review</h3>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={`${item.question}-${index}`}
            className={`animate-message-in rounded-2xl border p-5 ${
              item.is_correct
                ? "border-emerald-200 bg-emerald-50/50"
                : "border-red-200 bg-red-50/40"
            }`}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                {item.is_correct ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="text-sm font-semibold text-slate-900">
                  Question {index + 1}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    item.is_correct
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {item.is_correct ? "Correct" : "Incorrect"}
                </span>
              </div>
              {item.time_seconds > 0 && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  {item.time_seconds}s
                </span>
              )}
            </div>

            <p className="mb-4 text-sm font-medium leading-relaxed text-slate-800">
              {item.question}
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Your answer ({item.answer_mode === "text" ? "written" : "selected"})
                </p>
                <p className="mt-1 text-sm text-slate-800">{item.user_answer || "No answer"}</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                  Correct answer
                </p>
                <p className="mt-1 text-sm text-emerald-900">{item.correct_answer}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white/90 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-600">
                AI reasoning
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.feedback}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
