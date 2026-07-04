/**
 * Canonical app URL for auth redirects (Supabase OAuth / email links).
 * Falls back to browser origin on the client.
 */
export function getSiteUrl(): string {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
  }

  return "http://localhost:3000";
}

export function getAuthCallbackUrl(nextPath = "/attacks"): string {
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`;
}
