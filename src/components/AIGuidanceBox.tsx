"use client";

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Bot, Send, Sparkles, Zap } from "lucide-react";

export interface AIGuidanceBoxHandle {
  focusChat: (prefill?: string) => void;
  pulse: () => void;
}

interface AIGuidanceBoxProps {
  currentQuestion?: string;
  onClose?: () => void;
  sessionId?: string;
  compact?: boolean;
}

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  source?: "groq" | "fallback";
}

const SUGGESTED_PROMPTS = [
  "What should I do first?",
  "Explain containment",
  "Why preserve logs?",
];

const AIGuidanceBox = forwardRef<AIGuidanceBoxHandle, AIGuidanceBoxProps>(
  function AIGuidanceBox({ currentQuestion, onClose, compact = false }, ref) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [statusNote, setStatusNote] = useState<string | null>(null);
    const [highlight, setHighlight] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useImperativeHandle(ref, () => ({
      focusChat: (prefill?: string) => {
        setHighlight(true);
        window.setTimeout(() => setHighlight(false), 1200);
        if (prefill) setInputValue(prefill);
        inputRef.current?.focus();
      },
      pulse: () => {
        setHighlight(true);
        window.setTimeout(() => setHighlight(false), 1200);
      },
    }));

    useEffect(() => {
      scrollToBottom();
    }, [messages, isLoading]);

    const sendMessage = async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        type: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      setIsLoading(true);
      setStatusNote(null);

      try {
        const response = await fetch("/api/warroom/ai-guidance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "guidance",
            question: trimmed,
            context: currentQuestion,
          }),
        });

        const data = await response.json().catch(() => ({}));
        const reply =
          typeof data.response === "string" && data.response.trim()
            ? data.response.trim()
            : "Focus on containment, evidence preservation, and clear stakeholder communication.";

        if (data.source === "fallback") {
          setStatusNote("Using offline mentor mode — add GROQ_API_KEY for live AI.");
        } else if (data.source === "groq") {
          setStatusNote(null);
        }

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            type: "ai",
            content: reply,
            timestamp: new Date(),
            source: data.source,
          },
        ]);
      } catch {
        setStatusNote("Network error — showing offline tip.");
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            type: "ai",
            content:
              "Connection issue. Default IR advice: isolate affected hosts, preserve logs, and notify leadership with facts only.",
            timestamp: new Date(),
            source: "fallback",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div
        className={`flex h-full flex-col overflow-hidden rounded-2xl border bg-slate-950/95 shadow-2xl shadow-brand-900/20 transition-all duration-500 ${
          highlight
            ? "border-cyan-400 ring-2 ring-cyan-400/40 mentor-pulse"
            : "border-cyan-500/20"
        } ${compact ? "max-h-[520px]" : "min-h-[480px]"}`}
      >
        {/* Header */}
        <div className="relative overflow-hidden border-b border-cyan-500/20 bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 px-4 py-3">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(34,211,238,0.08),transparent)] animate-shimmer-slide" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 ring-1 ring-cyan-400/30">
                <Bot className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">AI Mentor</h3>
                <p className="text-[10px] uppercase tracking-wider text-cyan-400/80">
                  Live IR coaching
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Online
              </span>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close mentor"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4 chat-scroll">
          {messages.length === 0 && (
            <div className="animate-fade-in-up py-6 text-center">
              <Sparkles className="mx-auto mb-3 h-8 w-8 text-cyan-400/60" />
              <p className="text-sm font-medium text-slate-200">
                Ask anything about this scenario
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Hints, NIST phases, containment — no spoilers
              </p>
              {currentQuestion && (
                <p className="mx-auto mt-4 max-w-xs rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-left text-[11px] leading-relaxed text-slate-400">
                  <span className="font-semibold text-cyan-400/90">Active Q: </span>
                  {currentQuestion.slice(0, 120)}
                  {currentQuestion.length > 120 ? "…" : ""}
                </p>
              )}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 transition hover:border-cyan-500/50 hover:text-cyan-200"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex animate-message-in ${message.type === "user" ? "justify-end" : "justify-start"}`}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div
                className={`max-w-[85%] px-3.5 py-2.5 ${
                  message.type === "user"
                    ? "rounded-2xl rounded-br-md bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-lg shadow-brand-900/30"
                    : "rounded-2xl rounded-bl-md border border-slate-800 bg-slate-900 text-slate-100"
                }`}
              >
                {message.type === "ai" && (
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] text-cyan-400/90">
                    <Zap className="h-3 w-3" />
                    {message.source === "groq" ? "Groq AI" : "Offline mentor"}
                  </div>
                )}
                <p className="text-sm leading-relaxed">{message.content}</p>
                <span className="mt-1 block text-[10px] opacity-50">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-message-in">
              <div className="rounded-2xl rounded-bl-md border border-slate-800 bg-slate-900 px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="typing-dot h-2 w-2 rounded-full bg-cyan-400" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-cyan-400 [animation-delay:0.15s]" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-cyan-400 [animation-delay:0.3s]" />
                </div>
              </div>
            </div>
          )}

          {statusNote && (
            <p className="text-center text-[11px] text-amber-400/90">{statusNote}</p>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-800 bg-slate-900/80 p-3">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(inputValue);
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask the mentor..."
              disabled={isLoading}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-brand-600 text-white shadow-lg shadow-cyan-900/30 transition hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }
);

export default AIGuidanceBox;
