"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckSquare,
  Filter,
  Layers,
  Play,
  RotateCcw,
  Search,
  Square,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AttackCard from "@/components/AttackCard";
import {
  attacks,
  AttackCategory,
  resumeSession,
} from "@/lib/attacks";

const categories: (AttackCategory | "All")[] = [
  "All",
  "Malware",
  "Network",
  "Social",
  "Insider",
  "Cloud",
  "Web",
];

export default function AttacksPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<AttackCategory | "All">("All");

  const filtered = useMemo(() => {
    return attacks.filter((a) => {
      const matchesSearch =
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "All" || a.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  const toggleAttack = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(filtered.map((a) => a.id)));
  };

  const clearAll = () => setSelected(new Set());

  const allSelected =
    filtered.length > 0 && filtered.every((a) => selected.has(a.id));

  const startHref =
    selected.size === attacks.length
      ? "/training?mode=all"
      : selected.size > 0
        ? `/training?scenarios=${Array.from(selected).join(",")}`
        : "#";

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
                Scenario Library
              </h1>
              <p className="mt-2 max-w-2xl text-slate-600">
                Browse every attack type, read the briefing, then select one scenario
                or run the full curriculum. Your progress saves automatically.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700">
              <Layers className="h-4 w-4" />
              {attacks.length} scenarios available
            </div>
          </div>
        </div>

        {/* Resume banner */}
        <div className="mb-8 glass-card rounded-2xl border-l-4 border-l-brand-500 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100">
                <RotateCcw className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                  Resume training
                </p>
                <p className="font-semibold text-slate-900">
                  {resumeSession.attackTitle} — {resumeSession.module}
                </p>
                <p className="text-sm text-slate-500">
                  {resumeSession.progress}% complete · Last played{" "}
                  {resumeSession.lastPlayed}
                </p>
              </div>
            </div>
            <Link
              href={`/training?resume=${resumeSession.attackId}`}
              className="btn-primary !px-5 !py-2.5 text-sm"
            >
              <Play className="h-4 w-4" fill="currentColor" />
              Resume Here
            </Link>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600"
              style={{ width: `${resumeSession.progress}%` }}
            />
          </div>
        </div>

        {/* Filters & search */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search scenarios..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  category === cat
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-brand-200 hover:text-brand-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Selection bar */}
        <div className="sticky top-[73px] z-40 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-5 py-3.5 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={allSelected ? clearAll : selectAll}
              className="flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              {allSelected ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {allSelected ? "Deselect All" : "Select All Attacks"}
            </button>
            <span className="text-sm text-slate-400">|</span>
            <span className="text-sm text-slate-600">
              {selected.size} of {attacks.length} selected
            </span>
          </div>

          {selected.size > 0 ? (
            <Link href={startHref} className="btn-primary !px-5 !py-2.5 text-sm">
              <Play className="h-4 w-4" fill="currentColor" />
              {selected.size === attacks.length
                ? "Start Full Curriculum"
                : `Start ${selected.size} Scenario${selected.size > 1 ? "s" : ""}`}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <span className="text-sm text-slate-400">
              Select scenarios to begin
            </span>
          )}
        </div>

        {/* Attack grid */}
        <div className="grid gap-5 md:grid-cols-2">
          {filtered.map((attack) => (
            <AttackCard
              key={attack.id}
              attack={attack}
              selected={selected.has(attack.id)}
              onToggle={toggleAttack}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-lg font-semibold text-slate-700">No scenarios found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try adjusting your search or filter.
            </p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
