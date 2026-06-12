"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

function avatarLetter(name: string | null | undefined, email: string | null | undefined) {
  const n = (name ?? email ?? "?").trim();
  return n.slice(0, 1).toUpperCase();
}

export function NavAuth() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <span
        className="inline-block h-8 w-24 animate-pulse rounded-full bg-neutral-200/80 dark:bg-zinc-800"
        aria-hidden
      />
    );
  }

  if (!session) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm font-medium text-neutral-700 hover:text-neutral-900 dark:text-zinc-300 dark:hover:text-white"
        >
          Log in
        </Link>
        <Link
          href="/register"
          className="rounded-full bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Sign up
        </Link>
      </div>
    );
  }

  const display = session.user?.name || session.user?.email || "Account";
  const email = session.user?.email ?? null;
  const imageUrl = session.user?.image ?? null;
  const initial = avatarLetter(session.user?.name, email);
  const isAdmin = session.user?.role === "ADMIN";

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full py-1 pl-1 pr-2 marker:hidden hover:bg-neutral-100 dark:hover:bg-zinc-800 [&::-webkit-details-marker]:hidden">
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-xs font-semibold text-neutral-700 dark:bg-zinc-700 dark:text-zinc-200">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- session image URLs are not always whitelisted in next/image
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
          {isAdmin ? (
            <span
              className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-amber-500 dark:border-zinc-950 sm:hidden"
              title="Admin"
              aria-label="Admin"
            />
          ) : null}
        </span>
        <span className="hidden max-w-[9rem] truncate text-sm font-medium text-neutral-800 dark:text-zinc-200 sm:inline">
          {display}
        </span>
        {isAdmin ? (
          <span className="hidden rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 sm:inline">
            Admin
          </span>
        ) : null}
        <svg
          className="h-3.5 w-3.5 text-neutral-400 transition-transform group-open:rotate-180 dark:text-zinc-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-neutral-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
        <div className="border-b border-neutral-100 px-3 py-2 dark:border-zinc-800">
          <p className="flex items-center gap-1.5 truncate text-sm font-medium text-neutral-900 dark:text-zinc-100">
            <span className="truncate">{display}</span>
            {isAdmin ? (
              <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                Admin
              </span>
            ) : null}
          </p>
          {email ? (
            <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-zinc-400">{email}</p>
          ) : null}
        </div>
        <Link
          href="/profile"
          className="block px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Your profile
        </Link>
        {isAdmin ? (
          <Link
            href="/admin/users"
            className="block px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/40"
          >
            Admin · Users
          </Link>
        ) : null}
        <Link
          href="/forum"
          className="block px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Forum
        </Link>
        <Link
          href="/itineraries/new"
          className="block px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          New itinerary
        </Link>
        <button
          type="button"
          className="w-full px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          onClick={() => void signOut({ callbackUrl: "/" })}
        >
          Sign out
        </button>
      </div>
    </details>
  );
}
