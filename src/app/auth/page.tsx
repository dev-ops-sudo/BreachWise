"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import Navbar from "@/components/Navbar";
import { GoogleIcon, ShieldSticker, LockSticker } from "@/components/Stickers";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const authError = searchParams.get("error");
  const nextPath = searchParams.get("next") ?? "/attacks";

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const authMessage = searchParams.get("message");
  const [message, setMessage] = useState<string | null>(() => {
    if (authError === "auth_callback_failed") {
      return (
        authMessage ||
        "Google sign-in failed. Check Supabase Google provider settings and try again."
      );
    }
    if (authError === "google_not_enabled") {
      return "Google sign-in is not enabled yet. Enable the Google provider in Supabase.";
    }
    return null;
  });

  const supabaseConfigured = isSupabaseConfigured();

  const handleGoogleSignIn = async () => {
    if (!supabaseConfigured) {
      setMessage("Supabase is not configured. Add your keys to .env.local first.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const supabase = createClient();
    const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supabaseConfigured) {
      setMessage("Supabase is not configured. Add your keys to .env.local first.");
      return;
    }

    setLoading(true);
    setMessage(null);
    const supabase = createClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setMessage("Check your email to confirm your account, then log in.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.push(nextPath);
    router.refresh();
  };

  return (
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-12">
      <div className="grid w-full max-w-4xl items-center gap-10 lg:grid-cols-2">
        <div className="hidden lg:block">
          <div className="relative">
            <ShieldSticker className="absolute -left-4 -top-4 h-20 w-20 animate-float opacity-80" />
            <LockSticker className="absolute -bottom-6 -right-2 h-16 w-16 animate-float-delay opacity-80" />
            <div className="glass-card rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-slate-900">
                Your war room awaits
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Sign in to access scenarios, track your rank, and resume training
                exactly where you stopped — across any device.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "8+ realistic attack scenarios",
                  "AI-scored incident response",
                  "Resume progress anytime",
                  "Global leaderboard ranking",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-slate-700"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-xs text-brand-600">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-8 shadow-xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-slate-900">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {mode === "login"
                ? "Log in to continue your training"
                : "Start your cybersecurity journey today"}
            </p>
          </div>

          {!supabaseConfigured && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Add your Supabase URL and anon key to <code>.env.local</code> to
              enable auth. See <code>.env.example</code> for the format.
            </div>
          )}

          {message && (
            <div
              className={`mb-4 rounded-xl px-4 py-3 text-sm ${
                message.includes("Check your email")
                  ? "border border-green-200 bg-green-50 text-green-800"
                  : "border border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                mode === "login"
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                mode === "signup"
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Sign Up
            </button>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99] disabled:opacity-60"
          >
            <GoogleIcon className="h-5 w-5" />
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="name"
                    type="text"
                    placeholder="Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Log In"
                  : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="font-semibold text-brand-600 hover:text-brand-700"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-semibold text-brand-600 hover:text-brand-700"
                >
                  Log in
                </button>
              </>
            )}
          </p>

          <p className="mt-4 text-center text-xs text-slate-400">
            By continuing, you agree to our{" "}
            <Link href="#" className="underline hover:text-slate-600">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="#" className="underline hover:text-slate-600">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <>
      <Navbar variant="auth" />
      <Suspense
        fallback={
          <div className="flex min-h-[calc(100vh-73px)] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          </div>
        }
      >
        <AuthForm />
      </Suspense>
    </>
  );
}
