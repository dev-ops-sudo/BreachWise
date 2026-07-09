"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { LogOut, Sun, Moon, User as UserIcon } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface NavbarActionsProps {
  variant?: "default" | "auth";
}

export default function NavbarActions({ variant = "default" }: NavbarActionsProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initialTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setTheme(initialTheme);

    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user);
        setLoading(false);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    } catch {
      setLoading(false);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    setTheme(nextTheme);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const renderThemeToggle = () => {
    if (!mounted) return <div className="h-9 w-9" />;
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-cyan-400 transition-colors border border-slate-200/20 dark:border-cyan-500/10"
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? (
          <Moon className="h-[18px] w-[18px] transition-transform hover:rotate-12 duration-300" />
        ) : (
          <Sun className="h-[18px] w-[18px] text-yellow-400 transition-transform hover:rotate-45 duration-300" />
        )}
      </button>
    );
  };

  if (variant === "auth") {
    return (
      <div className="flex items-center gap-3">
        {renderThemeToggle()}
        <Link href="/" className="btn-ghost">
          ← Back to Home
        </Link>
      </div>
    );
  }

  if (loading) {
    return <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-100" />;
  }

  if (user) {
    const name =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "User";

    return (
      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-1.5 text-sm font-medium text-slate-600 sm:flex dark:text-slate-300">
          <UserIcon className="h-4 w-4" />
          {name}
        </span>
        <Link href="/attacks" className="btn-primary text-sm !px-5 !py-2.5">
          Scenarios
        </Link>
        <Link href="/training/history" className="btn-ghost hidden text-sm sm:inline-flex">
          History
        </Link>
        {renderThemeToggle()}
        <button
          type="button"
          onClick={handleSignOut}
          className="btn-ghost !px-3"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {renderThemeToggle()}
      <Link href="/auth" className="btn-ghost hidden sm:inline-flex">
        Log in
      </Link>
      <Link href="/auth?mode=signup" className="btn-primary text-sm !px-5 !py-2.5">
        Get Started
      </Link>
    </div>
  );
}
