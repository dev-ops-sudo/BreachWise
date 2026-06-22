"use client";

import { Suspense } from "react";
import ResultsContent from "./results-content";

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">Generating report...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
