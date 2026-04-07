"use client";

import { useState } from "react";
import {
  createItineraryIcs,
  type ItineraryCalendarEvent,
} from "@/lib/itineraryToIcs";

type ExportToCalendarButtonProps = {
  itineraryTitle: string;
  events: ItineraryCalendarEvent[];
};

function downloadIcsFile(fileName: string, fileContent: string) {
  const blob = new Blob([fileContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function ExportToCalendarButton({
  itineraryTitle,
  events,
}: ExportToCalendarButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onExportClick() {
    setBusy(true);
    setError(null);
    try {
      const { fileName, icsValue } = createItineraryIcs({
        itineraryTitle,
        events,
      });
      downloadIcsFile(fileName, icsValue);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not export this itinerary.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={busy || events.length === 0}
        onClick={() => void onExportClick()}
        className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        {busy ? "Exporting…" : "Export to Calendar"}
      </button>
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
