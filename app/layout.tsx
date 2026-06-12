import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
import { NavAuth } from "@/components/NavAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Providers } from "@/components/providers";
import "./globals.css";

const travelPayoutsDriveLoader = `
  (function () {
      var script = document.createElement("script");
      script.async = 1;
      script.src = 'https://emrldco.com/NTE2MDAx.js?t=516001';
      document.head.appendChild(script);
  })();
`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Itinera",
  description: "Share and clone vacation and wedding itineraries.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-zinc-50 font-sans text-neutral-900 dark:bg-zinc-950 dark:text-zinc-100">
        <Providers>
          <header className="sticky top-0 z-40 border-b border-neutral-200/90 bg-white/95 shadow-sm backdrop-blur-xl dark:border-zinc-800/90 dark:bg-zinc-950/95">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
              <nav className="flex items-center gap-6">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-lg font-semibold tracking-tight text-neutral-900 dark:text-zinc-100"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white dark:bg-emerald-500">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  Itinera
                </Link>
                <Link
                  href="/forum"
                  className="text-sm font-medium text-neutral-700 hover:text-neutral-900 dark:text-zinc-300 dark:hover:text-white"
                >
                  Forum
                </Link>
                <Link
                  href="/itineraries/new"
                  className="text-sm font-medium text-neutral-700 hover:text-neutral-900 dark:text-zinc-300 dark:hover:text-white"
                >
                  New itinerary
                </Link>
              </nav>
              <div className="flex items-center gap-2 sm:gap-3">
                <ThemeToggle />
                <NavAuth />
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-neutral-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-zinc-100">
                  Itinera
                </p>
                <p className="mt-1 max-w-sm text-sm text-neutral-500 dark:text-zinc-400">
                  Plan, share, and clone vacation and wedding itineraries.
                </p>
              </div>
              <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <Link
                  href="/"
                  className="text-neutral-600 transition-colors hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Explore
                </Link>
                <Link
                  href="/forum"
                  className="text-neutral-600 transition-colors hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Forum
                </Link>
                <Link
                  href="/itineraries/new"
                  className="text-neutral-600 transition-colors hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  New itinerary
                </Link>
              </nav>
              <p className="text-xs text-neutral-400 dark:text-zinc-600">
                © {new Date().getFullYear()} Itinera
              </p>
            </div>
          </footer>
        </Providers>
        <Script
          id="travelpayouts-drive"
          strategy="afterInteractive"
          data-noptimize="1"
          data-cfasync="false"
          data-wpfc-render="false"
          seraph-accel-crit="1"
          data-no-defer="1"
        >
          {travelPayoutsDriveLoader}
        </Script>
        <Analytics />
      </body>
    </html>
  );
}
