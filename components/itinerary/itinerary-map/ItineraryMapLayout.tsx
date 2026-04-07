"use client";

import type { ItineraryMapPoint } from "@/lib/buildItineraryMapPoints";
import { ItineraryGoogleMap } from "./ItineraryGoogleMap";
import { ItineraryMapProvider } from "./ItineraryMapContext";

export function ItineraryMapLayout({
  points,
  children,
}: {
  points: ItineraryMapPoint[];
  children: React.ReactNode;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";

  return (
    <ItineraryMapProvider points={points}>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <aside className="lg:sticky lg:top-4 lg:z-10 w-full shrink-0 lg:w-[min(100%,400px)]">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-neutral-500 dark:text-zinc-400">
            Trip map
          </h2>
          <ItineraryGoogleMap apiKey={apiKey} />
          <p className="mt-2 text-xs text-neutral-500 dark:text-zinc-500">
            Tap a pin or a card to jump between the map and the timeline.
          </p>
        </aside>
        <div className="min-w-0 flex-1 space-y-10">{children}</div>
      </div>
    </ItineraryMapProvider>
  );
}
