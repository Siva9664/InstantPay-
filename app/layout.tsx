import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "InstantPay AI – Gig Worker Instant Payout Agent",
  description:
    "AI-powered instant payout tool for gig workers. Chat with the AI, report completed jobs, and get paid instantly via PayPal.",
  keywords: [
    "gig worker",
    "instant payout",
    "PayPal",
    "AI agent",
    "freelance",
    "fintech",
  ],
  openGraph: {
    title: "InstantPay AI – Get Paid Instantly",
    description:
      "Report a completed job and receive instant PayPal payment — powered by AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /**
     * We add suppressHydrationWarning on <html> because the theme class
     * ("dark" / "") is set client-side and differs from the server render.
     */
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
