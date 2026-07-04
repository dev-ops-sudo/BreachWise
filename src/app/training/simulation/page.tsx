"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import AIEnhancedWarRoom from "@/components/AIEnhancedWarRoom";
import { attackToScenarioId } from "@/lib/scenarios";

function SimulationContent() {
  const searchParams = useSearchParams();
  const attackId = searchParams.get("attack") ?? "";

  if (!attackId || !attackToScenarioId[attackId]) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <Shield className="mx-auto h-12 w-12 text-brand-400" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          AI War Room - Invalid simulation
        </h1>
        <p className="mt-2 text-slate-600">
          Select a scenario from the library to begin.
        </p>
        <Link href="/attacks" className="btn-primary mt-6 inline-flex">
          <ArrowLeft className="h-4 w-4" />
          Browse Scenarios
        </Link>
      </div>
    );
  }

  return <AIEnhancedWarRoom attackId={attackId} enableAI={true} />;
}

export default function SimulationPage() {
  return (
    <>
      <Navbar variant="auth" />
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          </div>
        }
      >
        <SimulationContent />
      </Suspense>
    </>
  );
}
