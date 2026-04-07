"use client";

import { useItineraryMap } from "./ItineraryMapContext";

function cx(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function EventMapHighlight({
  eventId,
  hasCoords,
  label,
  className,
  budgetHighSpend,
  children,
}: {
  eventId: string;
  hasCoords: boolean;
  /** Used for the “show on map” control name */
  label: string;
  className?: string;
  /** Softer emphasis for above-typical estimates (same currency as siblings) */
  budgetHighSpend?: boolean;
  children: React.ReactNode;
}) {
  const { selectedEventId, focusEvent } = useItineraryMap();
  const selected = selectedEventId === eventId;

  function onClick(e: React.MouseEvent) {
    if (!hasCoords) return;
    const t = e.target as HTMLElement;
    if (t.closest("a, button")) return;
    focusEvent(eventId);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!hasCoords) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      focusEvent(eventId);
    }
  }

  return (
    <div
      id={`event-map-${eventId}`}
      className={cx(
        className,
        hasCoords &&
          "cursor-pointer transition-[box-shadow] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/80",
        selected &&
          "ring-2 ring-emerald-500 ring-offset-2 ring-offset-neutral-50 shadow-md dark:ring-emerald-400 dark:ring-offset-zinc-950",
        budgetHighSpend &&
          !selected &&
          "ring-1 ring-amber-400/70 dark:ring-amber-600/50",
      )}
      onClick={hasCoords ? onClick : undefined}
      onKeyDown={onKeyDown}
      role={hasCoords ? "button" : undefined}
      tabIndex={hasCoords ? 0 : undefined}
      aria-label={hasCoords ? `Show on map: ${label}` : undefined}
    >
      {children}
    </div>
  );
}
