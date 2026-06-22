"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    initBreachWiseLiveBackground?: (canvas: HTMLCanvasElement) => void;
  }
}

export default function AntigravityBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || initializedRef.current) return;

    const runBackground = () => {
      if (window.initBreachWiseLiveBackground) {
        window.initBreachWiseLiveBackground(canvas);
        initializedRef.current = true;
      }
    };

    // Load external script from public/live-background.js
    const existing = document.querySelector(
      'script[data-breachwise-bg="true"]'
    ) as HTMLScriptElement | null;

    if (existing) {
      if (window.initBreachWiseLiveBackground) {
        runBackground();
      } else {
        existing.addEventListener("load", runBackground, { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "/live-background.js";
    script.async = true;
    script.dataset.breachwiseBg = "true";
    script.onload = runBackground;
    script.onerror = () => {
      console.error(
        "Failed to load /live-background.js — paste your script in public/live-background.js"
      );
    };
    document.body.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="mesh-orb mesh-orb-1" />
      <div className="mesh-orb mesh-orb-2" />
      <div className="mesh-orb mesh-orb-3" />
      <div className="mesh-grid" />
      <canvas
        id="breachwise-live-bg"
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
