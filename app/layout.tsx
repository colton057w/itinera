import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { NavAuth } from "@/components/NavAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Providers } from "@/components/providers";
import "./globals.css";

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
          <header className="border-b border-neutral-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
              <nav className="flex items-center gap-6">
                <Link
                  href="/"
                  className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-zinc-100"
                >
                  Itinera
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
        </Providers>
      </body>
    </html>
  );
}
