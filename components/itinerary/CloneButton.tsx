"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { formatMinorUnits } from "@/lib/formatMoney";

const isDev = process.env.NODE_ENV === "development";

export function CloneButton({
  sourceId,
  premiumCloneEnabled,
  premiumClonePriceCents,
  premiumCloneCurrency,
  skipPremiumGate,
}: {
  sourceId: string;
  premiumCloneEnabled?: boolean;
  premiumClonePriceCents?: number | null;
  premiumCloneCurrency?: string | null;
  /** Owner cloning their own trip — no fee UI */
  skipPremiumGate?: boolean;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  const premiumActive =
    Boolean(premiumCloneEnabled) &&
    premiumClonePriceCents != null &&
    premiumClonePriceCents > 0 &&
    !skipPremiumGate;

  const currency = (premiumCloneCurrency ?? "USD").trim().toUpperCase() || "USD";
  const premiumLabel = premiumActive
    ? formatMinorUnits(premiumClonePriceCents, currency)
    : null;

  const cloneBlockedByPremium = premiumActive && !isDev;

  const close = useCallback(() => {
    setOpen(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (open) {
      dialogRef.current?.querySelector<HTMLInputElement>('input[type="date"]')?.focus();
    }
  }, [open]);

  function openModal() {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }
    const t = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    setStartDate(
      `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`,
    );
    setError(null);
    setOpen(true);
  }

  async function submitClone() {
    if (cloneBlockedByPremium) {
      setError("Checkout for premium clones is not available on this server yet.");
      return;
    }
    if (!startDate.trim()) {
      setError("Choose a start date for your copy.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/itineraries/${sourceId}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: startDate.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        slug?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not clone this trip.");
        return;
      }
      if (!data.slug) return;
      close();
      router.push(`/itineraries/${data.slug}/edit`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={loading && !open}
        onClick={openModal}
        className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm hover:bg-neutral-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        {premiumActive ? `Clone trip · ${premiumLabel}` : "Clone trip"}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" aria-hidden />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            className="relative z-10 w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
          >
            <h2
              id={titleId}
              className="text-lg font-semibold text-neutral-900 dark:text-zinc-100"
            >
              {premiumActive ? "Premium clone" : "Clone this trip"}
            </h2>
            <p
              id={descId}
              className="mt-2 text-sm text-neutral-600 dark:text-zinc-400"
            >
              Pick when your version starts. We&apos;ll shift every day and timed event (including
              flights) to match, and open your copy for editing.
            </p>
            {premiumActive ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-100">
                <p className="font-medium">Creator fee: {premiumLabel}</p>
                <p className="mt-1 text-xs text-amber-900/90 dark:text-amber-200/90">
                  {cloneBlockedByPremium
                    ? "Stripe checkout is not configured yet — cloning from paid itineraries is temporarily unavailable in production."
                    : "Development only: fee is waived so you can test the flow."}
                </p>
              </div>
            ) : null}
            <label className="mt-5 block text-sm font-medium text-neutral-800 dark:text-zinc-200">
              Trip start date
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>
            {error ? (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={close}
                className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading || cloneBlockedByPremium}
                onClick={() => void submitClone()}
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
              >
                {loading ? "Cloning…" : cloneBlockedByPremium ? "Paywall soon" : "Clone & edit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
