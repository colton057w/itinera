"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Variation = {
  id: string;
  slug: string;
  title: string;
  ownerName: string | null;
  createdAt: string;
};

export function ForkVariationsSection({ itineraryId }: { itineraryId: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Variation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || items !== null) return;
    setLoading(true);
    setError(null);
    void fetch(`/api/itineraries/${itineraryId}/variations`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load variations");
        const data = (await res.json()) as { variations: Variation[] };
        setItems(data.variations);
      })
      .catch(() => setError("Something went wrong"))
      .finally(() => setLoading(false));
  }, [open, items, itineraryId]);

  return (
    <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-800/40">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-neutral-800 dark:text-zinc-200">
          Trip variations
        </p>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-xs font-semibold text-emerald-800 hover:underline dark:text-emerald-400"
        >
          {open ? "Hide" : "View variations"}
        </button>
      </div>
      <p className="mt-1 text-xs text-neutral-600 dark:text-zinc-400">
        Other public trips cloned from this plan — different dates, swaps, or budgets.
      </p>
      {open ? (
        <div className="mt-3 border-t border-neutral-200 pt-3 dark:border-zinc-600">
          {loading ? (
            <p className="text-sm text-neutral-500 dark:text-zinc-500">Loading…</p>
          ) : error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : items && items.length === 0 ? (
            <p className="text-sm text-neutral-600 dark:text-zinc-400">
              No public variations yet. Be the first to fork this itinerary.
            </p>
          ) : (
            <ul className="space-y-2">
              {items?.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/itineraries/${v.slug}`}
                    className="text-sm font-medium text-emerald-800 hover:underline dark:text-emerald-400"
                  >
                    {v.title}
                  </Link>
                  <span className="ml-2 text-xs text-neutral-500 dark:text-zinc-500">
                    by {v.ownerName ?? "Planner"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
