"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { HotelPlaceInput } from "@/components/itinerary/HotelPlaceInput";

type EventDraft = {
  clientId: string;
  type: "FLIGHT" | "HOTEL" | "ACTIVITY" | "MEAL" | "CUSTOM";
  title: string;
  description: string;
  location: string;
  coverImageUrl?: string;
  googlePlaceId?: string;
  googleMapsUrl?: string;
  websiteUrl?: string;
  lat?: number;
  lng?: number;
};

type DayDraft = {
  clientId: string;
  label: string;
  date: string;
  events: EventDraft[];
};

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function ItineraryCreator() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [days, setDays] = useState<DayDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = useMemo(
    () => title.trim().length > 0 && days.length > 0,
    [title, days],
  );

  function addDay() {
    setDays((d) => [
      ...d,
      { clientId: newId(), label: `Day ${d.length + 1}`, date: "", events: [] },
    ]);
  }

  function updateDay(clientId: string, patch: Partial<DayDraft>) {
    setDays((d) => d.map((x) => (x.clientId === clientId ? { ...x, ...patch } : x)));
  }

  function removeDay(clientId: string) {
    setDays((d) => d.filter((x) => x.clientId !== clientId));
  }

  function addEvent(dayId: string) {
    setDays((d) =>
      d.map((day) =>
        day.clientId === dayId
          ? {
              ...day,
              events: [
                ...day.events,
                {
                  clientId: newId(),
                  type: "ACTIVITY",
                  title: "",
                  description: "",
                  location: "",
                },
              ],
            }
          : day,
      ),
    );
  }

  function updateEvent(dayId: string, eventId: string, patch: Partial<EventDraft>) {
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
  }

  function removeEvent(dayId: string, eventId: string) {
    setDays((d) =>
      d.map((day) =>
        day.clientId === dayId
          ? { ...day, events: day.events.filter((e) => e.clientId !== eventId) }
          : day,
      ),
    );
  }

  async function uploadFile(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) throw new Error("Upload failed");
    const data = (await res.json()) as { url: string };
    return data.url;
  }

  async function onPickPhoto(dayId: string, eventId: string, file: File | null) {
    if (!file) return;
    const url = await uploadFile(file);
    updateEvent(dayId, eventId, { coverImageUrl: url });
  }

  function parseTags(raw: string): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const part of raw.split(/[,\n]+/)) {
      const t = part.trim().replace(/^#+/, "").toLowerCase();
      if (!t || seen.has(t)) continue;
      seen.add(t);
      out.push(t);
      if (out.length > 24) break;
    }
    return out;
  }

  async function submit() {
    setError(null);
    setSaving(true);
    try {
      const tags = parseTags(tagsInput);
      const payload = {
        title: title.trim(),
        visibility,
        tags,
        days: days.map((day, dayIndex) => ({
          dayIndex,
          label: day.label || null,
          date: day.date ? new Date(day.date).toISOString() : null,
          events: day.events.map((ev, eventIndex) => ({
            eventIndex,
            type: ev.type,
            title: ev.title.trim() || "Untitled",
            description: ev.description || null,
            location: ev.location || null,
            coverImageUrl: ev.coverImageUrl || null,
            googlePlaceId: ev.googlePlaceId || null,
            googleMapsUrl: ev.googleMapsUrl || null,
            websiteUrl: ev.websiteUrl || null,
            lat: ev.lat ?? null,
            lng: ev.lng ?? null,
          })),
        })),
      };

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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-zinc-100">
          New itinerary
        </h1>
        <p className="text-sm text-neutral-600 dark:text-zinc-400">
          Add days, drop in events, and attach photos. Tag vibes like{" "}
          <span className="font-medium">#destination-wedding</span> or{" "}
          <span className="font-medium">#italy</span> so others can find your plan.
        </p>
      </header>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <label className="block space-y-1">
          <span className="text-xs font-medium uppercase text-neutral-500 dark:text-zinc-400">
            Title
          </span>
          <input
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none ring-neutral-900 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:ring-zinc-400"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Amalfi Coast — 5 days"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-medium uppercase text-neutral-500 dark:text-zinc-400">
            Tags
          </span>
          <input
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="#italy, #budget, #summer-wedding"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-medium uppercase text-neutral-500 dark:text-zinc-400">
            Visibility
          </span>
          <select
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "PRIVATE")}
          >
            <option value="PUBLIC">Public — appear in feed</option>
            <option value="PRIVATE">Private — only you</option>
          </select>
        </label>
      </section>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-neutral-900 dark:text-zinc-100">Days</h2>
        <button
          type="button"
          onClick={addDay}
          className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Add day
        </button>
      </div>

      <div className="space-y-6">
        {days.map((day) => (
          <div
            key={day.clientId}
            className="space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-5 dark:border-zinc-800 dark:bg-zinc-900/40"
          >
            <div className="flex flex-wrap items-end gap-3">
              <label className="min-w-[12rem] flex-1 space-y-1">
                <span className="text-xs font-medium text-neutral-500 dark:text-zinc-400">
                  Day label
                </span>
                <input
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                  value={day.label}
                  onChange={(e) => updateDay(day.clientId, { label: e.target.value })}
                />
              </label>
              <label className="min-w-[10rem] space-y-1">
                <span className="text-xs font-medium text-neutral-500 dark:text-zinc-400">
                  Date (optional)
                </span>
                <input
                  type="date"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                  value={day.date}
                  onChange={(e) => updateDay(day.clientId, { date: e.target.value })}
                />
              </label>
              <button
                type="button"
                onClick={() => removeDay(day.clientId)}
                className="ml-auto text-sm text-red-600 hover:underline dark:text-red-400"
              >
                Remove day
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-700 dark:text-zinc-300">
                  Events
                </h3>
                <button
                  type="button"
                  onClick={() => addEvent(day.clientId)}
                  className="text-sm font-medium text-neutral-900 hover:underline dark:text-zinc-100"
                >
                  + Add event
                </button>
              </div>

              {day.events.length === 0 ? (
                <p className="text-sm text-neutral-500 dark:text-zinc-500">
                  No events yet — add flights, hotels, or wedding moments.
                </p>
              ) : null}

              <ul className="space-y-3">
                {day.events.map((ev) => (
                  <li
                    key={ev.clientId}
                    className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-1">
                        <span className="text-xs text-neutral-500 dark:text-zinc-400">Type</span>
                        <select
                          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                          value={ev.type}
                          onChange={(e) => {
                            const next = e.target.value as EventDraft["type"];
                            updateEvent(day.clientId, ev.clientId, {
                              type: next,
                              ...(next !== "HOTEL"
                                ? {
                                    googlePlaceId: undefined,
                                    googleMapsUrl: undefined,
                                    websiteUrl: undefined,
                                    lat: undefined,
                                    lng: undefined,
                                  }
                                : {}),
                            });
                          }}
                        >
                          <option value="FLIGHT">Flight</option>
                          <option value="HOTEL">Hotel</option>
                          <option value="ACTIVITY">Activity</option>
                          <option value="MEAL">Meal</option>
                          <option value="CUSTOM">Custom</option>
                        </select>
                      </label>
                      {ev.type === "HOTEL" ? (
                        <HotelPlaceInput
                          value={{
                            title: ev.title,
                            location: ev.location,
                            googlePlaceId: ev.googlePlaceId,
                            googleMapsUrl: ev.googleMapsUrl,
                            websiteUrl: ev.websiteUrl,
                            lat: ev.lat,
                            lng: ev.lng,
                          }}
                          onChange={(patch) =>
                            updateEvent(day.clientId, ev.clientId, patch)
                          }
                        />
                      ) : null}
                      <label className="space-y-1 md:col-span-2">
                        <span className="text-xs text-neutral-500 dark:text-zinc-400">
                          {ev.type === "HOTEL" ? "Hotel name" : "Title"}
                        </span>
                        <input
                          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                          value={ev.title}
                          onChange={(e) =>
                            updateEvent(day.clientId, ev.clientId, { title: e.target.value })
                          }
                          placeholder={
                            ev.type === "HOTEL"
                              ? "Filled when you pick a place — edit anytime"
                              : "Rehearsal dinner at Villa Maria"
                          }
                        />
                      </label>
                      <label className="space-y-1 md:col-span-2">
                        <span className="text-xs text-neutral-500 dark:text-zinc-400">
                          {ev.type === "HOTEL" ? "Address (you can edit after place search)" : "Location"}
                        </span>
                        <input
                          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                          value={ev.location}
                          onChange={(e) =>
                            updateEvent(day.clientId, ev.clientId, { location: e.target.value })
                          }
                          placeholder={
                            ev.type === "HOTEL"
                              ? "Full city & address from Google, or type manually"
                              : "Ravello, Italy"
                          }
                        />
                      </label>
                      <label className="space-y-1 md:col-span-2">
                        <span className="text-xs text-neutral-500 dark:text-zinc-400">
                          Description
                        </span>
                        <textarea
                          className="min-h-[80px] w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                          value={ev.description}
                          onChange={(e) =>
                            updateEvent(day.clientId, ev.clientId, {
                              description: e.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="space-y-1 md:col-span-2">
                        <span className="text-xs text-neutral-500 dark:text-zinc-400">
                          Cover photo
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-3 file:py-2 file:text-sm file:text-white dark:file:bg-zinc-700"
                          onChange={(e) =>
                            onPickPhoto(day.clientId, ev.clientId, e.target.files?.[0] ?? null)
                          }
                        />
                        {ev.coverImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={ev.coverImageUrl}
                            alt=""
                            className="mt-2 h-32 w-full rounded-lg object-cover"
                          />
                        ) : null}
                      </label>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                        onClick={() => removeEvent(day.clientId, ev.clientId)}
                      >
                        Remove event
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3 pb-10">
        <button
          type="button"
          disabled={!canSubmit || saving}
          onClick={() => void submit()}
          className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-400"
        >
          {saving ? "Publishing…" : "Publish itinerary"}
        </button>
      </div>
    </div>
  );
}
