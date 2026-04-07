"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  itineraryId: string;
  redirectTo?: string;
  variant?: "default" | "compact";
};

export function DeleteItineraryButton({
  itineraryId,
  redirectTo = "/",
  variant = "default",
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (
      !window.confirm(
        "Delete this itinerary permanently? All days, events, and comments on it will be removed. This cannot be undone.",
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/itineraries/${itineraryId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Delete failed");
      }
      router.push(redirectTo);
      router.refresh();
    } catch {
      setBusy(false);
      window.alert("Could not delete this itinerary. Try again.");
    }
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => void onDelete()}
        className="shrink-0 self-center rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
      >
        {busy ? "…" : "Delete"}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void onDelete()}
      className="inline-flex items-center justify-center rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
    >
      {busy ? "Deleting…" : "Delete itinerary"}
    </button>
  );
}
