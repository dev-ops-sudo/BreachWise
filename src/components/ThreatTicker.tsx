"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal, Shield, ShieldAlert, Play, Pause, RefreshCw } from "lucide-react";

interface LogEvent {
  id: string;
  timestamp: string;
  category: "attack" | "contain" | "system" | "success";
  message: string;
  target: string;
}

const INITIAL_LOGS: LogEvent[] = [
  { id: "1", timestamp: "08:42:15", category: "system", message: "BreachWise live monitor initiated.", target: "CORE-NET" },
  { id: "2", timestamp: "08:42:18", category: "system", message: "AI Mentor Engine loaded successfully.", target: "AI-COGNITIVE" },
  { id: "3", timestamp: "08:42:24", category: "attack", message: "Ransomware outbreak simulation running.", target: "FS-PROD-01" },
  { id: "4", timestamp: "08:42:30", category: "contain", message: "Isolating network segment VLAN-12.", target: "SWITCH-SW03" },
  { id: "5", timestamp: "08:42:36", category: "success", message: "Containment confirmed. Uptime maintained.", target: "FS-PROD-01" },
  { id: "6", timestamp: "08:42:48", category: "attack", message: "Spear phishing campaign detected.", target: "EXCHANGE-02" },
];

const TEMPLATES: Omit<LogEvent, "id" | "timestamp">[] = [
  { category: "attack", message: "Brute-force SSH attempt detected", target: "GW-EXTERNAL" },
  { category: "attack", message: "Suspicious DLL loaded into lsass.exe", target: "WIN-MGMT-AD" },
  { category: "contain", message: "Revoking OAuth session tokens", target: "CLOUD-IDENTITY" },
  { category: "success", message: "Malicious process terminated", target: "ENDPOINT-AGENT" },
  { category: "system", message: "Weekly compliance assessment complete", target: "NIST-IR" },
  { category: "attack", message: "SQL Injection vector identified & blocked", target: "DB-SQL-CORE" },
  { category: "contain", message: "Rotating API credentials", target: "VAULT-MAIN" },
  { category: "success", message: "Honeypot decoy active, redirecting traffic", target: "DMZ-HONEY" },
];

export default function ThreatTicker() {
  const [logs, setLogs] = useState<LogEvent[]>(INITIAL_LOGS);
  const [isPlaying, setIsPlaying] = useState(true);
  const [filter, setFilter] = useState<"all" | "attack" | "contain" | "system" | "success">("all");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const time = new Date();
      const hStr = String(time.getHours()).padStart(2, "0");
      const mStr = String(time.getMinutes()).padStart(2, "0");
      const sStr = String(time.getSeconds()).padStart(2, "0");
      const timestamp = `${hStr}:${mStr}:${sStr}`;

      const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
      const newLog: LogEvent = {
        id: Math.random().toString(),
        timestamp,
        ...template,
      };

      setLogs((prev) => {
        const next = [...prev, newLog];
        // Keep last 40 logs
        return next.slice(-40);
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    // Auto scroll to bottom when new logs arrive
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const filteredLogs = logs.filter(
    (log) => filter === "all" || log.category === filter
  );

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case "attack":
        return { bg: "bg-red-500/10 dark:bg-red-500/10 border-red-500/20", text: "text-red-500", label: "ALERT" };
      case "contain":
        return { bg: "bg-amber-500/10 dark:bg-amber-500/10 border-amber-500/20", text: "text-amber-500", label: "CONTAIN" };
      case "success":
        return { bg: "bg-emerald-500/10 dark:bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-500", label: "SUCCESS" };
      default:
        return { bg: "bg-cyan-500/10 dark:bg-cyan-500/10 border-cyan-500/20", text: "text-cyan-500", label: "SYSTEM" };
    }
  };

  return (
    <div className="glass-card flex flex-col rounded-3xl border border-slate-200/80 dark:border-cyan-500/15 overflow-hidden shadow-2xl bg-white/60 dark:bg-slate-950/70 backdrop-blur-md">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/40 dark:border-cyan-500/10 bg-slate-50/50 dark:bg-slate-900/30 px-5 py-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-4.5 w-4.5 text-brand-600 dark:text-cyan-400" />
          <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-200">
            Threat Inject & Simulation Feed
          </span>
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-cyan-400 transition-colors"
            title={isPlaying ? "Pause Feed" : "Resume Feed"}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setLogs(INITIAL_LOGS)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-cyan-400 transition-colors"
            title="Reset Log"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200/40 dark:border-cyan-500/10 px-4 py-2 gap-1.5 overflow-x-auto">
        {(["all", "attack", "contain", "system", "success"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilter(t)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
              filter === t
                ? "bg-brand-600 dark:bg-cyan-500/20 text-white dark:text-cyan-300"
                : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Console logs output */}
      <div
        ref={containerRef}
        className="chat-scroll h-60 overflow-y-auto p-5 font-mono text-xs space-y-3 dark:bg-slate-950/20"
      >
        {filteredLogs.map((log) => {
          const config = getCategoryStyles(log.category);
          return (
            <div
              key={log.id}
              className={`flex items-start gap-3 rounded-lg border p-2.5 transition-all duration-300 hover:scale-[1.01] ${config.bg}`}
            >
              <span className="text-slate-400 shrink-0 select-none">[{log.timestamp}]</span>
              <span className={`font-bold shrink-0 px-1.5 py-0.5 rounded text-[10px] tracking-wide border ${config.text} border-current/10 bg-current/5`}>
                {config.label}
              </span>
              <div className="min-w-0 flex-1">
                <span className="text-slate-700 dark:text-slate-300 break-words">{log.message}</span>
                <span className="mx-2 text-slate-400 dark:text-slate-500">→</span>
                <span className="text-brand-600 dark:text-cyan-400 font-semibold">{log.target}</span>
              </div>
            </div>
          );
        })}

        {filteredLogs.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-slate-400 dark:text-slate-600 py-10 space-y-2">
            <Terminal className="h-8 w-8 opacity-40 animate-pulse" />
            <p>No active logs in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
