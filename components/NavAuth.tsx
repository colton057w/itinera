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
    return <span className="text-sm text-neutral-500 dark:text-zinc-500">…</span>;
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
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-[10px] leading-none shadow dark:bg-amber-900/90 sm:hidden"
              title="Admin"
              aria-label="Admin"
            >
              👑
            </span>
          ) : null}
        </span>
        <span className="hidden max-w-[9rem] truncate text-sm font-medium text-neutral-800 dark:text-zinc-200 sm:inline">
          {isAdmin ? (
            <span className="mr-1 inline-block text-amber-600 dark:text-amber-400" title="Admin" aria-label="Admin">
              👑
            </span>
          ) : null}
          {display}
        </span>
        <span className="text-neutral-400 group-open:rotate-180 dark:text-zinc-500" aria-hidden>
          ▾
        </span>
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-neutral-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
        <div className="border-b border-neutral-100 px-3 py-2 dark:border-zinc-800">
          <p className="truncate text-sm font-medium text-neutral-900 dark:text-zinc-100">
            {isAdmin ? (
              <span className="mr-1 text-amber-600 dark:text-amber-400" title="Admin" aria-label="Admin">
                👑
              </span>
            ) : null}
            {display}
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
