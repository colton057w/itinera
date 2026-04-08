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
                  className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-zinc-100"
                >
                  Itinera
                </Link>
                <Link
                  href="/itineraries/new"
                  className="hidden text-sm font-medium text-neutral-700 hover:text-neutral-900 dark:text-zinc-300 dark:hover:text-white sm:inline-flex"
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
