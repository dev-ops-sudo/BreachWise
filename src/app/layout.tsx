import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
      <body className={`${inter.variable} antialiased textured-bg min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
