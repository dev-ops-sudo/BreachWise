"use client";

import { Suspense } from "react";
import AuthCallbackContent from "./callback-content";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Processing sign in...</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
