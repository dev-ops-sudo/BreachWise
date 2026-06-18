export function ShieldSticker({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="60" cy="60" r="55" fill="#EFF6FF" />
      <path
        d="M60 20L30 35v25c0 18 12 35 30 40 18-5 30-22 30-40V35L60 20z"
        fill="#2563EB"
        opacity="0.15"
      />
      <path
        d="M60 28L38 40v18c0 14 9 27 22 31 13-4 22-17 22-31V40L60 28z"
        fill="#2563EB"
      />
      <path
        d="M52 58l6 6 12-12"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TerminalSticker({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="15" y="25" width="90" height="65" rx="8" fill="#1E40AF" opacity="0.1" />
      <rect x="20" y="30" width="80" height="55" rx="6" fill="#2563EB" />
      <rect x="20" y="30" width="80" height="12" rx="6" fill="#1D4ED8" />
      <circle cx="28" cy="36" r="2.5" fill="#FCA5A5" />
      <circle cx="36" cy="36" r="2.5" fill="#FDE047" />
      <circle cx="44" cy="36" r="2.5" fill="#86EFAC" />
      <path d="M30 52l8 6-8 6" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="46" y1="64" x2="68" y2="64" stroke="#BFDBFE" strokeWidth="2" strokeLinecap="round" />
      <line x1="30" y1="74" x2="58" y2="74" stroke="#BFDBFE" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function RankSticker({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="60" cy="60" r="50" fill="#DBEAFE" />
      <path
        d="M60 25l8 16h18l-14 11 5 17-17-11-17 11 5-17-14-11h18z"
        fill="#2563EB"
      />
      <circle cx="60" cy="55" r="12" fill="#1D4ED8" />
      <text x="60" y="60" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
        #
      </text>
    </svg>
  );
}

export function LockSticker({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="30" y="55" width="60" height="45" rx="8" fill="#2563EB" />
      <path
        d="M42 55V42a18 18 0 0136 0v13"
        stroke="#1D4ED8"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="60" cy="75" r="6" fill="#DBEAFE" />
      <rect x="58" y="75" width="4" height="10" rx="2" fill="#DBEAFE" />
    </svg>
  );
}

export function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
