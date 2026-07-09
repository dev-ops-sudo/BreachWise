"use client";

import React, { useState } from "react";
import { ShieldCheck, BarChart3, AlertCircle, Activity, Award, HelpCircle } from "lucide-react";

interface NistPhase {
  id: string;
  name: string;
  score: number;
  description: string;
  status: "Optimized" | "Adequate" | "Needs Drill" | "Critical";
  color: string;
  glow: string;
  tip: string;
}

const PHASES: NistPhase[] = [
  {
    id: "identify",
    name: "Identify (ID)",
    score: 82,
    status: "Optimized",
    description: "Determine systems, assets, data, and cyber capabilities.",
    color: "bg-cyan-500",
    glow: "shadow-cyan-500/20 dark:shadow-cyan-400/20",
    tip: "Asset inventory, credential audits, and vulnerability scoping are key here. Drill scenario: Cloud API compromise.",
  },
  {
    id: "protect",
    name: "Protect (PR)",
    score: 88,
    status: "Optimized",
    description: "Develop and implement safeguards to ensure service delivery.",
    color: "bg-emerald-500",
    glow: "shadow-emerald-500/20 dark:shadow-emerald-400/20",
    tip: "Limit threat impact via identity access management, user training, and host safeguards. Drill scenario: Spear phishing.",
  },
  {
    id: "detect",
    name: "Detect (DE)",
    score: 65,
    status: "Needs Drill",
    description: "Identify the occurrence of a cybersecurity event.",
    color: "bg-amber-500",
    glow: "shadow-amber-500/20 dark:shadow-amber-400/20",
    tip: "Configure telemetry alerts, monitor log anomalies, and audit system integrity. Drill scenario: Insider exfiltration.",
  },
  {
    id: "respond",
    name: "Respond (RS)",
    score: 72,
    status: "Adequate",
    description: "Take action regarding a detected cybersecurity incident.",
    color: "bg-brand-500",
    glow: "shadow-brand-500/20 dark:shadow-brand-400/20",
    tip: "Isolate segments, contain spreads, and coordinate legal/internal communications. Drill scenario: Ransomware outbreaks.",
  },
  {
    id: "recover",
    name: "Recover (RC)",
    score: 58,
    status: "Critical",
    description: "Restore capabilities or services impaired by a cyber incident.",
    color: "bg-purple-500",
    glow: "shadow-purple-500/20 dark:shadow-purple-400/20",
    tip: "Restore systems from backup, remediate initial access points, and run post-mortem feedback loops. Drill scenario: Zero-day.",
  },
];

export default function NistDashboard() {
  const [hoveredPhase, setHoveredPhase] = useState<NistPhase | null>(null);

  const averageScore = Math.round(
    PHASES.reduce((sum, p) => sum + p.score, 0) / PHASES.length
  );

  return (
    <div className="glass-card mb-8 rounded-3xl border border-slate-200/80 dark:border-cyan-500/15 p-6 shadow-xl bg-white/60 dark:bg-slate-950/70 backdrop-blur-md">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Core Readiness Score Gauge */}
        <div className="flex flex-col items-center justify-center text-center border-slate-200/40 dark:border-cyan-500/10 lg:border-r lg:pr-8 py-4">
          <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200/30 dark:border-cyan-500/10 shadow-inner">
            {/* SVG circle track */}
            <svg className="absolute inset-0 h-full w-full -rotate-90 p-1">
              <circle
                cx="72"
                cy="72"
                r="64"
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="64"
                className="stroke-cyan-500 dark:stroke-cyan-400 transition-all duration-1000"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 64}
                strokeDashoffset={2 * Math.PI * 64 * (1 - averageScore / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight animate-pulse-soft">
                {averageScore}%
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
                Readiness Score
              </span>
            </div>
          </div>

          <div className="mt-5 space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5 justify-center">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              NIST Core Readiness
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 px-4">
              Your consolidated incident preparedness rating based on active scenarios.
            </p>
          </div>

          {/* Quick status pill */}
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 dark:bg-cyan-500/20 px-3.5 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
            <Activity className="h-3.5 w-3.5" />
            Rating: Operational
          </div>
        </div>

        {/* Phase Progress Bars Grid */}
        <div className="lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="h-4.5 w-4.5 text-brand-600 dark:text-cyan-400" />
                IR Lifecycle Breakdown
              </h4>
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5" /> Hover card for operational tips
              </span>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {PHASES.map((p) => (
                <div
                  key={p.id}
                  onMouseEnter={() => setHoveredPhase(p)}
                  onMouseLeave={() => setHoveredPhase(null)}
                  className="glass-card rounded-2xl border border-slate-200/50 dark:border-cyan-500/10 p-3.5 hover:-translate-y-0.5 cursor-pointer bg-white/40 dark:bg-slate-900/20"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {p.name}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        p.status === "Optimized"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : p.status === "Needs Drill"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : p.status === "Adequate"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          : "bg-red-500/10 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {p.description}
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${p.color}`}
                        style={{ width: `${p.score}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white shrink-0">
                      {p.score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Info Panel */}
          <div className="mt-4 min-h-[52px] rounded-2xl border border-dashed border-slate-200 dark:border-cyan-500/20 bg-slate-50/50 dark:bg-slate-900/20 p-3 flex items-center gap-3">
            {hoveredPhase ? (
              <>
                <Award className="h-5 w-5 text-cyan-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Operational Directive ({hoveredPhase.name})
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight truncate">
                    {hoveredPhase.tip}
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 animate-pulse" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Urgent Recommendation: Recover (RC) Score is critical
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Hover over any NIST phase to inspect key objectives and run recommendations.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
