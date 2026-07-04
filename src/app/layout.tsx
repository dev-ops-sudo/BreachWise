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
    <html lang="en">
      <body className={`${inter.className} ${inter.variable} antialiased min-h-screen bg-slate-50`}>
        <div className="fixed inset-0 z-0 overflow-hidden">
          <AntigravityBackground />
        </div>
        <div className="relative z-10 min-h-screen">{children}</div>
      </body>
    </html>
  );
}
