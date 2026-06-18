import Link from "next/link";
import { Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/60 bg-white/60">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <Shield className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-slate-900">
              Breach<span className="text-brand-600">Wise</span>
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Train smarter. Respond faster. Rank higher.
          </p>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/attacks" className="hover:text-brand-600 transition-colors">
              Scenarios
            </Link>
            <Link href="/auth" className="hover:text-brand-600 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
        <div className="mt-8 border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} BreachWise. Cybersecurity training simulator.
        </div>
      </div>
    </footer>
  );
}
