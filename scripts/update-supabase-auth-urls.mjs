/**
 * Updates Supabase Auth URL settings for production + local dev.
 *
 * Usage:
 *   set SUPABASE_ACCESS_TOKEN=your_pat_from_dashboard
 *   node scripts/update-supabase-auth-urls.mjs
 */

const PROJECT_REF = "anfdmykskxmqbyrnndai";
const PRODUCTION_URL = "https://breachwise-gray.vercel.app";

const REDIRECT_URLS = [
  `${PRODUCTION_URL}/**`,
  `${PRODUCTION_URL}/auth/callback`,
  "https://*-nighteager0001-9960s-projects.vercel.app/**",
  "http://localhost:3000/**",
  "http://localhost:3000/auth/callback",
  "http://localhost:3001/**",
  "http://localhost:3001/auth/callback",
  "http://localhost:3002/**",
  "http://localhost:3002/auth/callback",
];

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    console.error(
      "Missing SUPABASE_ACCESS_TOKEN. Create one at https://supabase.com/dashboard/account/tokens"
    );
    process.exit(1);
  }

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        site_url: PRODUCTION_URL,
        uri_allow_list: REDIRECT_URLS.join(","),
      }),
    }
  );

  const body = await response.text();
  if (!response.ok) {
    console.error("Failed to update Supabase auth config:", response.status, body);
    process.exit(1);
  }

  console.log("Supabase auth URLs updated successfully.");
  console.log(JSON.parse(body));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
