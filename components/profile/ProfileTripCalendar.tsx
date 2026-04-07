"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProfileCalendarTrip } from "@/lib/profileTripSpans";
import { ymdInRange } from "@/lib/profileTripSpans";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ymd(year: number, monthIndex: number, day: number): string {
  const m = monthIndex + 1;
  return `${year}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function ProfileTripCalendar({ trips }: { trips: ProfileCalendarTrip[] }) {
  const dated = useMemo(() => trips.filter((t) => t.startDate && t.endDate), [trips]);
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() };
  });

  const { y, m } = cursor;
  const firstDow = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const label = new Date(y, m, 1).toLocaleString(undefined, { month: "long", year: "numeric" });

  const cells: ({ day: number; ymd: string } | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, ymd: ymd(y, m, d) });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  if (cells.length < 42) {
    while (cells.length < 42) cells.push(null);
  }

  const tripsThisMonth = dated.filter((t) => {
    const start = t.startDate!;
    const end = t.endDate!;
    const monthStart = ymd(y, m, 1);
    const monthEnd = ymd(y, m, daysInMonth);
    return !(end < monthStart || start > monthEnd);
  });

  return (
    <section className="mt-10 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-zinc-100">Trip calendar</h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-zinc-400">
            Your itineraries by day date (first to last day with a date set). Tap a trip to open it.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
            onClick={() =>
              setCursor((c) => {
                const nm = c.m - 1;
                if (nm < 0) return { y: c.y - 1, m: 11 };
                return { y: c.y, m: nm };
              })
            }
            aria-label="Previous month"
          >
            ←
          </button>
          <span className="min-w-[10rem] text-center text-sm font-semibold text-neutral-900 dark:text-zinc-100">
            {label}
          </span>
          <button
            type="button"
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
            onClick={() =>
              setCursor((c) => {
                const nm = c.m + 1;
                if (nm > 11) return { y: c.y + 1, m: 0 };
                return { y: c.y, m: nm };
              })
            }
            aria-label="Next month"
          >
            →
          </button>
        </div>
      </div>

      {dated.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-6 text-center text-sm text-neutral-600 dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-400">
          No dated trips yet. Edit an itinerary and set dates on each day to see it on your calendar.
        </p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-zinc-500">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((cell, i) => {
              if (!cell) {
                return <div key={`e-${i}`} className="aspect-square rounded-lg bg-transparent" />;
              }
              const onTrips = dated.filter(
                (t) => t.startDate && t.endDate && ymdInRange(cell.ymd, t.startDate, t.endDate),
              );
              return (
                <div
                  key={cell.ymd}
                  className={`flex aspect-square flex-col items-center justify-start rounded-lg border pt-1 text-sm ${
                    onTrips.length
                      ? "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/50 dark:bg-emerald-950/30"
                      : "border-transparent bg-neutral-50/50 dark:bg-zinc-800/30"
                  }`}
                >
                  <span className="tabular-nums text-neutral-800 dark:text-zinc-200">{cell.day}</span>
                  {onTrips.length > 0 ? (
                    <span
                      className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"
                      title={onTrips.map((t) => t.title).join(", ")}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>

          {tripsThisMonth.length > 0 ? (
            <div className="mt-6 border-t border-neutral-100 pt-4 dark:border-zinc-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-zinc-500">
                This month
              </p>
              <ul className="mt-2 space-y-2">
                {tripsThisMonth.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/itineraries/${t.slug}`}
                      className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm transition hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/20"
                    >
                      <span className="font-medium text-neutral-900 dark:text-zinc-100">{t.title}</span>
                      <span className="text-xs text-neutral-500 dark:text-zinc-500">
                        {t.startDate === t.endDate
                          ? t.startDate
                          : `${t.startDate} → ${t.endDate}`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-4 text-center text-sm text-neutral-500 dark:text-zinc-500">
              No trips overlap this month.
            </p>
          )}
        </>
      )}
    </section>
  );
}
