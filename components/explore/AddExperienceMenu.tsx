"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CuratedExperience } from "@/lib/curated-types";
import { appendExperienceQueue, replaceExperienceQueue, type QueuedExperience } from "@/lib/experience-queue";

type Props = {
  experience: CuratedExperience;
  cityName: string;
};

function toQueued(ex: CuratedExperience, cityName: string): QueuedExperience {
  return {
    title: ex.title,
    description: ex.subtitle,
    location: ex.locationLabel,
    coverImageUrl: ex.image,
    storyKind: ex.storyKind,
    cityName,
  };
}

export function AddExperienceMenu({ experience, cityName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [open]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const startNew = useCallback(() => {
    replaceExperienceQueue([toQueued(experience, cityName)]);
    setOpen(false);
    router.push("/itineraries/new");
  }, [experience, cityName, router]);

  const queueAdd = useCallback(() => {
    appendExperienceQueue(toQueued(experience, cityName));
    setOpen(false);
    showToast("Saved to your queue — open New story to drop it on your timeline.");
  }, [experience, cityName, showToast]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="inline-flex items-center gap-1.5 rounded-full bg-neutral-950 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-neutral-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
      >
        Add to trip
        <span className="text-[10px] opacity-80" aria-hidden>
          ▾
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-[220px] rounded-2xl border border-neutral-200 bg-white py-2 shadow-xl dark:border-zinc-600 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={startNew}
              className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left text-sm transition hover:bg-neutral-50 dark:hover:bg-zinc-800"
            >
              <span className="font-semibold text-neutral-900 dark:text-zinc-100">New itinerary</span>
              <span className="text-xs text-neutral-500 dark:text-zinc-400">
                Opens the story builder with this experience on day 1
              </span>
            </button>
            <div className="mx-3 border-t border-neutral-100 dark:border-zinc-800" />
            <button
              type="button"
              onClick={queueAdd}
              className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left text-sm transition hover:bg-neutral-50 dark:hover:bg-zinc-800"
            >
              <span className="font-semibold text-neutral-900 dark:text-zinc-100">Queue for later</span>
              <span className="text-xs text-neutral-500 dark:text-zinc-400">
                Append to a list, then open New story from the nav when you are ready.
              </span>
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {toast ? (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute right-0 top-[calc(100%+12px)] z-40 max-w-[min(320px,85vw)] rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-950 shadow-lg dark:border-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-100"
          >
            {toast}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
