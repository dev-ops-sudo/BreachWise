"use client";

import { useState } from "react";
import { Check, Clock, Target } from "lucide-react";
import {
  Attack,
  categoryColors,
  difficultyColors,
} from "@/lib/attacks";

interface AttackCardProps {
  attack: Attack;
  selected: boolean;
  onToggle: (id: string) => void;
}

export default function AttackCard({ attack, selected, onToggle }: AttackCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className={`glass-card group relative overflow-hidden rounded-2xl transition-all duration-300 ${
        selected
          ? "ring-2 ring-brand-500 ring-offset-2 ring-offset-slate-50"
          : "hover:shadow-lg hover:shadow-brand-600/10"
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${attack.color} opacity-80`}
      />

      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-3xl shadow-inner">
              {attack.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{attack.title}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${categoryColors[attack.category]}`}
                >
                  {attack.category}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyColors[attack.difficulty]}`}
                >
                  {attack.difficulty}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="h-3 w-3" />
                  {attack.duration}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggle(attack.id)}
            aria-label={selected ? "Deselect scenario" : "Select scenario"}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
              selected
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-slate-200 bg-white text-transparent hover:border-brand-300"
            }`}
          >
            <Check className="h-4 w-4" strokeWidth={3} />
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          {attack.description}
        </p>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs font-semibold text-brand-600 hover:text-brand-700"
        >
          {expanded ? "Hide objectives ↑" : "View objectives ↓"}
        </button>

        {expanded && (
          <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3">
            {attack.objectives.map((obj) => (
              <li
                key={obj}
                className="flex items-start gap-2 text-sm text-slate-600"
              >
                <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />
                {obj}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
