"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  itineraryId: string;
  initialStarred: boolean;
};

export function ItineraryStarButton({ itineraryId, initialStarred }: Props) {
  const { status } = useSession();
  const router = useRouter();
  const [starred, setStarred] = useState(initialStarred);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (status !== "authenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/itineraries/${itineraryId}/star`, {
        method: starred ? "DELETE" : "POST",
      });
      if (!res.ok) return;
      setStarred(!starred);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      aria-label={starred ? "Remove from starred" : "Star this itinerary"}
      aria-pressed={starred}
      onClick={() => void toggle()}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${
        starred
          ? "border-amber-400/80 bg-amber-50 text-amber-900 dark:border-amber-600/60 dark:bg-amber-950/50 dark:text-amber-100"
          : "border-neutral-200 bg-white text-neutral-700 hover:border-amber-300 hover:bg-amber-50/50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-amber-700 dark:hover:bg-amber-950/30"
      }`}
    >
      <span className="mr-1.5 text-base leading-none" aria-hidden>
        {starred ? "★" : "☆"}
      </span>
      {starred ? "Starred" : "Star"}
    </button>
  );
}
