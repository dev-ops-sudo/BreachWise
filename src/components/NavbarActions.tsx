"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { LogOut, User as UserIcon } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface NavbarActionsProps {
  variant?: "default" | "auth";
}

export default function NavbarActions({ variant = "default" }: NavbarActionsProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (variant === "auth") {
    return (
      <Link href="/" className="btn-ghost">
        ← Back to Home
      </Link>
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
        <span className="hidden items-center gap-1.5 text-sm font-medium text-slate-600 sm:flex">
          <UserIcon className="h-4 w-4" />
          {name}
        </span>
        <Link href="/attacks" className="btn-primary text-sm !px-5 !py-2.5">
          Scenarios
        </Link>
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
    <>
      <Link href="/auth" className="btn-ghost hidden sm:inline-flex">
        Log in
      </Link>
      <Link href="/auth?mode=signup" className="btn-primary text-sm !px-5 !py-2.5">
        Get Started
      </Link>
    </>
  );
}
