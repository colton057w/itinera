"use client";

import { useMemo } from "react";
import { formatMinorUnits } from "@/lib/formatMoney";

export type BudgetLine = {
  id: string;
  title: string;
  type: string;
  minor: number;
  currency: string;
};

function sumByCurrency(lines: BudgetLine[]): { currency: string; minor: number }[] {
  const m = new Map<string, number>();
  for (const l of lines) {
    if (l.minor <= 0) continue;
    const c = (l.currency || "USD").toUpperCase();
    m.set(c, (m.get(c) ?? 0) + l.minor);
  }
  return [...m.entries()].map(([currency, minor]) => ({ currency, minor }));
}

export function BudgetSummary({
  lines,
  className,
}: {
  lines: BudgetLine[];
  className?: string;
}) {
  const priced = useMemo(() => lines.filter((l) => l.minor > 0), [lines]);
  const totals = useMemo(() => sumByCurrency(priced), [priced]);

  if (priced.length === 0) {
    return (
      <aside
        className={
          className ??
          "rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 p-4 text-sm text-neutral-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400"
        }
      >
        <p className="font-medium text-neutral-800 dark:text-zinc-200">Budget</p>
        <p className="mt-1 text-xs">
          No estimates yet. Add optional costs while editing each stop to see a trip total.
        </p>
      </aside>
    );
  }

  return (
    <aside
      className={
        className ??
        "rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
      }
    >
      <p className="text-sm font-semibold text-neutral-900 dark:text-zinc-100">Budget</p>
      <p className="mt-0.5 text-xs text-neutral-500 dark:text-zinc-500">
        Planner estimates — cloned trips keep these for your planning
      </p>
      <ul className="mt-3 space-y-2 border-t border-neutral-100 pt-3 dark:border-zinc-800">
        {totals.map((t) => (
          <li
            key={t.currency}
            className="flex items-baseline justify-between text-sm"
          >
            <span className="text-neutral-600 dark:text-zinc-400">Total ({t.currency})</span>
            <span className="font-semibold tabular-nums text-neutral-900 dark:text-zinc-100">
              {formatMinorUnits(t.minor, t.currency)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-neutral-500 dark:text-zinc-500">
        Higher estimates in the timeline show a soft amber cue compared to other stops in the same
        currency.
      </p>
    </aside>
  );
}
