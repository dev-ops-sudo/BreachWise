import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AntigravityBackground from "@/components/AntigravityBackground";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "BreachWise — Cybersecurity Training Simulator",
  description:
    "Train in realistic cyber attack scenarios, get ranked on your response, and resume exactly where you left off.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} ${inter.variable} antialiased min-h-screen`}>
        <div className="fixed inset-0 z-0 overflow-hidden">
          <AntigravityBackground />
        </div>
        <div className="relative z-10 min-h-screen">{children}</div>
      </body>
    </html>
  );
}
