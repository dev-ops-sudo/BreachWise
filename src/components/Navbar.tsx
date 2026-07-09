"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import NavbarActions from "@/components/NavbarActions";

interface NavbarProps {
  variant?: "default" | "auth";
  isHomepage?: boolean;
}

export default function Navbar({ variant = "default", isHomepage = false }: NavbarProps) {
  const [visible, setVisible] = useState(!isHomepage);

  useEffect(() => {
    if (!isHomepage) return;

    const handleScroll = () => {
      // Reveal navbar after scrolling down 300px
      if (window.scrollY > 300) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomepage]);

  return (
    <header 
      className={`z-50 border-b transition-all duration-300 ${
        isHomepage 
          ? `fixed top-0 left-0 right-0 ${visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"}`
          : "sticky top-0 translate-y-0 opacity-100"
      } border-slate-200/60 bg-white/80 backdrop-blur-md`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-md shadow-brand-600/25 transition-transform group-hover:scale-105">
            <Shield className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Breach<span className="text-brand-600">Wise</span>
          </span>
        </Link>

        {variant === "default" ? (
          <nav className="hidden items-center gap-1 md:flex">
            <Link href="/#features" className="btn-ghost">
              Features
            </Link>
            <Link href="/#how-it-works" className="btn-ghost">
              How It Works
            </Link>
            <Link href="/attacks" className="btn-ghost">
              Scenarios
            </Link>
          </nav>
        ) : null}

        <NavbarActions variant={variant} />
      </div>
    </header>
  );
}
