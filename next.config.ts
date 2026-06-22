import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  async rewrites() {
    // Local Express backend is dev-only. Production uses Next.js API routes on Vercel.
    if (process.env.NODE_ENV !== "development") {
      return [];
    }

    const backendPort = process.env.BACKEND_PORT || process.env.PORT || 4000;

    return [
      {
        source: "/api/generate",
        destination: `http://127.0.0.1:${backendPort}/api/generate`,
      },
      {
        source: "/api/evaluate",
        destination: `http://127.0.0.1:${backendPort}/api/evaluate`,
      },
      {
        source: "/api/pregenerate/:path*",
        destination: `http://127.0.0.1:${backendPort}/api/pregenerate/:path*`,
      },
      {
        source: "/api/finalreport/:path*",
        destination: `http://127.0.0.1:${backendPort}/api/finalreport/:path*`,
      },
    ];
  },
};

export default nextConfig;
