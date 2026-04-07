"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  buildItineraryRequestBody,
  parseTagsInput,
} from "@/lib/buildItineraryRequestBody";
import { StoryEventCard } from "./StoryEventCard";
import type { DayDraft, EventDraft, StoryKind } from "./types";
import { createQuickEvent, newId } from "./types";

const QUICK_ADD: { kind: StoryKind; label: string; emoji: string }[] = [
  { kind: "stay", label: "Stay", emoji: "🏨" },
  { kind: "meal", label: "Meal", emoji: "🍽" },
  { kind: "transit", label: "Transit", emoji: "🚆" },
  { kind: "activity", label: "Activity", emoji: "✨" },
];

export type StorybookBuilderProps = {
  mode?: "create" | "edit";
  itineraryId?: string;
  /** Slug for redirect after save (unchanged on edit) */
  returnSlug?: string;
  initialTitle?: string;
  initialTagsInput?: string;
  initialVisibility?: "PUBLIC" | "PRIVATE";
  initialTripKind?: "VACATION" | "WEDDING_EVENT";
  initialDays?: DayDraft[];
};

export function StorybookBuilder({
  mode = "create",
  itineraryId,
  returnSlug,
  initialTitle = "",
  initialTagsInput = "",
  initialVisibility = "PUBLIC",
  initialTripKind = "VACATION",
  initialDays,
}: StorybookBuilderProps = {}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [tagsInput, setTagsInput] = useState(initialTagsInput);
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">(initialVisibility);
  const [tripKind, setTripKind] = useState<"VACATION" | "WEDDING_EVENT">(initialTripKind);
  const [days, setDays] = useState<DayDraft[]>(initialDays ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [enteringEventId, setEnteringEventId] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => title.trim().length > 0 && days.length > 0,
    [title, days],
  );

  const addDay = useCallback(() => {
    setDays((d) => [
      ...d,
      { clientId: newId(), label: `Day ${d.length + 1}`, date: "", events: [] },
    ]);
  }, []);

  const updateDay = useCallback((clientId: string, patch: Partial<DayDraft>) => {
    setDays((d) => d.map((x) => (x.clientId === clientId ? { ...x, ...patch } : x)));
  }, []);

  const removeDay = useCallback((clientId: string) => {
    setDays((d) => d.filter((x) => x.clientId !== clientId));
  }, []);

  const quickAddEvent = useCallback((dayId: string, kind: StoryKind) => {
    const ev = createQuickEvent(kind);
    setEnteringEventId(ev.clientId);
    setDays((d) =>
      d.map((day) =>
        day.clientId === dayId
          ? { ...day, events: [...day.events, ev] }
          : day,
      ),
    );
  }, []);

  useEffect(() => {
    if (!enteringEventId) return;
    const t = window.setTimeout(() => setEnteringEventId(null), 480);
    return () => window.clearTimeout(t);
  }, [enteringEventId]);

  const updateEvent = useCallback(
    (dayId: string, eventId: string, patch: Partial<EventDraft>) => {
      setDays((d) =>
        d.map((day) =>
          day.clientId === dayId
            ? {
                ...day,
                events: day.events.map((e) =>
                  e.clientId === eventId ? { ...e, ...patch } : e,
                ),
              }
            : day,
        ),
      );
    },
    [],
  );

  const removeEvent = useCallback((dayId: string, eventId: string) => {
    setDays((d) =>
      d.map((day) =>
        day.clientId === dayId
          ? { ...day, events: day.events.filter((e) => e.clientId !== eventId) }
          : day,
      ),
    );
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) throw new Error("Upload failed");
    const data = (await res.json()) as { url: string };
    return data.url;
  }, []);

  const submit = useCallback(async () => {
    setError(null);
    setSaving(true);
    try {
      const tags = parseTagsInput(tagsInput);
      const payload = buildItineraryRequestBody(title, visibility, tripKind, tags, days);
      if (mode === "edit" && itineraryId) {
        const res = await fetch(`/api/itineraries/${itineraryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error ?? "Save failed");
        }
        const updated = (await res.json()) as { slug: string };
        router.push(`/itineraries/${returnSlug ?? updated.slug}`);
        router.refresh();
      } else {
        const res = await fetch("/api/itineraries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error ?? "Create failed");
        }
        const created = (await res.json()) as { id: string; slug: string };
        router.push(`/itineraries/${created.slug}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }, [days, itineraryId, mode, returnSlug, router, tagsInput, title, tripKind, visibility]);

  const dayColumn = (day: DayDraft, dayIndex: number, mobileTimeline: boolean) => (
    <div
      key={day.clientId}
      className={
        mobileTimeline
          ? "relative pl-6"
          : "flex w-[min(100%,280px)] shrink-0 flex-col rounded-2xl border border-neutral-200/80 bg-white/90 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90"
      }
    >
      {mobileTimeline ? (
        <span
          className="absolute left-[7px] top-3 bottom-0 w-px bg-gradient-to-b from-emerald-400 to-emerald-400/20 dark:from-emerald-600 dark:to-emerald-600/20"
          aria-hidden
        />
      ) : null}
      {mobileTimeline ? (
        <span
          className="absolute left-1 top-2.5 h-3.5 w-3.5 rounded-full border-2 border-emerald-500 bg-white dark:border-emerald-400 dark:bg-zinc-900"
          aria-hidden
        />
      ) : null}

      <div
        className={
          mobileTimeline
            ? "rounded-2xl border border-neutral-200/80 bg-white/95 p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/95"
            : "border-b border-neutral-100 p-3 dark:border-zinc-800"
        }
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <input
            className="min-w-0 flex-1 border-0 bg-transparent text-base font-semibold text-neutral-900 outline-none ring-0 placeholder:text-neutral-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            value={day.label}
            onChange={(e) => updateDay(day.clientId, { label: e.target.value })}
            placeholder={`Day ${dayIndex + 1}`}
          />
          <button
            type="button"
            onClick={() => removeDay(day.clientId)}
            className="shrink-0 text-xs font-medium text-red-600 hover:underline dark:text-red-400"
          >
            Remove
          </button>
        </div>
        <label className="mt-2 flex items-center gap-2 text-xs text-neutral-500 dark:text-zinc-400">
          <span className="shrink-0">Date</span>
          <input
            type="date"
            className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 text-sm text-neutral-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            value={day.date}
            onChange={(e) => updateDay(day.clientId, { date: e.target.value })}
          />
        </label>
      </div>

      <div className={mobileTimeline ? "mt-3 space-y-3 pl-0" : "flex flex-1 flex-col gap-3 p-3"}>
        <ul className="flex flex-col gap-3">
          {day.events.map((ev) => (
            <StoryEventCard
              key={ev.clientId}
              dayId={day.clientId}
              ev={ev}
              animateEnter={ev.clientId === enteringEventId}
              updateEvent={updateEvent}
              removeEvent={removeEvent}
              uploadFile={uploadFile}
            />
          ))}
        </ul>

        <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 p-2 dark:border-zinc-700 dark:bg-zinc-800/40">
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-zinc-500">
            Quick add
          </p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {QUICK_ADD.map((q) => (
              <button
                key={q.kind}
                type="button"
                onClick={() => quickAddEvent(day.clientId, q.kind)}
                className="flex flex-col items-center gap-0.5 rounded-lg border border-transparent bg-white px-2 py-2 text-xs font-medium text-neutral-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/80 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/50"
              >
                <span className="text-lg leading-none" aria-hidden>
                  {q.emoji}
                </span>
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-100/90 via-white to-neutral-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/85 px-4 py-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/85">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              {mode === "edit" ? "Edit story" : "Storybook builder"}
            </p>
            <input
              className="w-full border-0 border-b-2 border-transparent border-b-neutral-200 bg-transparent text-2xl font-semibold tracking-tight text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-b-emerald-500 dark:border-b-zinc-700 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-b-emerald-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Name your trip story…"
            />
            <input
              className="w-full max-w-xl border-0 bg-transparent text-sm text-neutral-600 outline-none placeholder:text-neutral-400 dark:text-zinc-400 dark:placeholder:text-zinc-500"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="#honeymoon, #japan — comma separated"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {mode === "edit" && returnSlug ? (
              <Link
                href={`/itineraries/${returnSlug}`}
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                ← View trip
              </Link>
            ) : null}
            <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-600 dark:text-zinc-400">
              <span className="sr-only">Trip type</span>
              <select
                className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm font-medium dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                value={tripKind}
                onChange={(e) =>
                  setTripKind(e.target.value as "VACATION" | "WEDDING_EVENT")
                }
              >
                <option value="VACATION">Vacation trip</option>
                <option value="WEDDING_EVENT">Wedding or event</option>
              </select>
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-600 dark:text-zinc-400">
              <span className="sr-only">Visibility</span>
              <select
                className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm font-medium dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "PRIVATE")}
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </label>
            <button
              type="button"
              disabled={!canSubmit || saving}
              onClick={() => void submit()}
              className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            >
              {saving
                ? mode === "edit"
                  ? "Saving…"
                  : "Publishing…"
                : mode === "edit"
                  ? "Save changes"
                  : "Publish story"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {error ? (
          <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        ) : null}

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-zinc-100">
              Your timeline
            </h2>
            <p className="text-sm text-neutral-600 dark:text-zinc-400">
              <span className="hidden md:inline">Scroll horizontally to browse days — each column is one day.</span>
              <span className="md:hidden">Days stack vertically with a simple timeline.</span>
            </p>
          </div>
          <button
            type="button"
            onClick={addDay}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            <span aria-hidden>＋</span>
            Add day
          </button>
        </div>

        {days.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-neutral-200 bg-white/60 px-8 py-20 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
            <p className="text-lg font-medium text-neutral-800 dark:text-zinc-200">
              Start by adding your first day
            </p>
            <p className="mt-2 text-sm text-neutral-600 dark:text-zinc-400">
              Then use Quick add for stays, meals, transit, and activities with big photos.
            </p>
            <button
              type="button"
              onClick={addDay}
              className="mt-6 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            >
              Add day 1
            </button>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <div className="overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:thin]">
                <div className="flex min-h-[520px] gap-4 pr-4">
                  {days.map((day, i) => dayColumn(day, i, false))}
                  <button
                    type="button"
                    onClick={addDay}
                    className="flex w-[min(100%,200px)] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50/50 text-sm font-medium text-neutral-600 transition hover:border-emerald-400 hover:bg-emerald-50/50 hover:text-emerald-800 dark:border-zinc-600 dark:bg-zinc-800/30 dark:text-zinc-400 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300"
                  >
                    <span className="text-2xl" aria-hidden>
                      +
                    </span>
                    New day
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-8 md:hidden">
              {days.map((day, i) => dayColumn(day, i, true))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
