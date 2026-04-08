"use client";

import Link from "next/link";
import { useMemo } from "react";

const OPTIONS: { value: "" | "vacation" | "wedding"; label: string }[] = [
  { value: "", label: "All trips" },
  { value: "vacation", label: "Vacations" },
  { value: "wedding", label: "Weddings & events" },
];

function buildHref(
  nextKind: "" | "vacation" | "wedding",
  vibe: string,
  location: string,
  durationMin: string,
  durationMax: string,
): string {
  const p = new URLSearchParams();
  if (vibe.trim()) p.set("vibe", vibe.trim());
  if (location.trim()) p.set("location", location.trim());
  if (durationMin.trim()) p.set("durationMin", durationMin.trim());
  if (durationMax.trim()) p.set("durationMax", durationMax.trim());
  if (nextKind) p.set("kind", nextKind);
  const q = p.toString();
  return q ? `/?${q}` : "/";
}

/**
 * Trip type as links so choosing Vacations / Weddings updates the URL and feed immediately
 * (no separate Search click). Preserves vibe, location, and duration from the current query.
 */
export function TripKindFilterPills({
  kindParam,
  vibe,
  location,
  durationMin,
  durationMax,
  variant = "default",
}: {
  kindParam: "" | "vacation" | "wedding";
  vibe: string;
  location: string;
  durationMin: string;
  durationMax: string;
  variant?: "default" | "discover";
}) {
  const hrefByKind: Record<"" | "vacation" | "wedding", string> = useMemo(
    () => ({
      "": buildHref("", vibe, location, durationMin, durationMax),
      vacation: buildHref("vacation", vibe, location, durationMin, durationMax),
      wedding: buildHref("wedding", vibe, location, durationMin, durationMax),
    }),
    [vibe, location, durationMin, durationMax],
  );

  const pillBase =
    variant === "discover"
      ? "rounded-full px-4 py-2 text-sm font-medium transition-colors"
      : "rounded-full px-3 py-1.5 text-xs font-medium transition-colors";

  const active =
    variant === "discover"
      ? "bg-neutral-950 text-white shadow-sm dark:bg-white dark:text-zinc-950"
      : "bg-white text-neutral-900 shadow-sm dark:bg-zinc-100 dark:text-zinc-900";

  const inactive =
    variant === "discover"
      ? "text-neutral-600 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-zinc-200"
      : "text-neutral-600 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-zinc-200";

  return (
    <div
      className={
        variant === "discover"
          ? "mt-3 inline-flex flex-wrap rounded-full border border-neutral-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900"
          : "mt-1.5 inline-flex rounded-full border border-neutral-200 bg-neutral-50/80 p-0.5 dark:border-zinc-700 dark:bg-zinc-800/60"
      }
      role="group"
      aria-label="Trip type"
    >
      {OPTIONS.map((opt) => {
        const selected = kindParam === opt.value;
        return (
          <Link
            key={opt.value || "all"}
            href={hrefByKind[opt.value]}
            scroll={false}
            className={`${pillBase} ${selected ? active : inactive}`}
            aria-current={selected ? "page" : undefined}
          >
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
}
