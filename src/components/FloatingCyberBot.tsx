"use client";

import { useState } from "react";
import { Bot, MessageCircle, X } from "lucide-react";
import AIGuidanceBox from "./AIGuidanceBox";

export default function FloatingCyberBot() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-brand-600 text-white shadow-2xl shadow-cyan-900/40 transition-all hover:scale-110 hover:shadow-cyan-500/30 active:scale-95"
        aria-label={open ? "Close AI mentor" : "Open AI mentor"}
      >
        <span className="absolute inset-0 rounded-2xl bg-cyan-400/20 animate-ping opacity-75 group-hover:opacity-100" />
        {open ? (
          <X className="relative h-6 w-6" />
        ) : (
          <MessageCircle className="relative h-6 w-6" />
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[min(100vw-2rem,380px)] animate-scale-in origin-bottom-right">
          <div className="mb-2 flex items-center gap-2 rounded-full border border-cyan-500/20 bg-slate-950/90 px-3 py-1.5 text-xs text-cyan-200 backdrop-blur-md">
            <Bot className="h-3.5 w-3.5" />
            Try the AI mentor — same engine as the war room
          </div>
          <AIGuidanceBox compact onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
