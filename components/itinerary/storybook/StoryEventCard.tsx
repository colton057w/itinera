"use client";

import { useCallback, useRef, useState } from "react";
import { AirportCombobox } from "@/components/itinerary/AirportCombobox";
import { HotelPlaceInput } from "@/components/itinerary/HotelPlaceInput";
import { StarRating } from "@/components/itinerary/StarRating";
import { AIRLINE_SUGGESTIONS } from "@/lib/airlines";
import type { EventDraft } from "./types";
import { useHeroImage } from "./types";

const kindLabel: Record<string, string> = {
  stay: "Stay",
  meal: "Meal",
  transit: "Transit",
  activity: "Activity",
};

function typeBadgeColor(storyKind: EventDraft["storyKind"], type: EventDraft["type"]) {
  if (storyKind === "stay" || type === "HOTEL") return "bg-violet-100 text-violet-900 dark:bg-violet-900/50 dark:text-violet-200";
  if (storyKind === "meal" || type === "MEAL") return "bg-orange-100 text-orange-900 dark:bg-orange-900/50 dark:text-orange-200";
  if (storyKind === "transit") return "bg-sky-100 text-sky-900 dark:bg-sky-900/50 dark:text-sky-200";
  if (type === "FLIGHT") return "bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-200";
  return "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-200";
}

function placePickerForType(
  type: EventDraft["type"],
): { searchLabel: string; placeholder: string } | null {
  switch (type) {
    case "HOTEL":
      return {
        searchLabel: "Find stay",
        placeholder: "Hotel, resort, or lodging…",
      };
    case "MEAL":
      return {
        searchLabel: "Find restaurant or café",
        placeholder: "Restaurant, bar, or meal spot…",
      };
    case "ACTIVITY":
      return {
        searchLabel: "Find venue or stop",
        placeholder: "Museum, trail, transit hub, tour meetup…",
      };
    case "CUSTOM":
      return {
        searchLabel: "Find place",
        placeholder: "Anywhere on Google Maps…",
      };
    default:
      return null;
  }
}

function badgeText(ev: EventDraft) {
  if (ev.type === "FLIGHT") return "Flight";
  if (ev.type === "HOTEL") return "Stay";
  if (ev.type === "MEAL") return "Meal";
  if (ev.storyKind && kindLabel[ev.storyKind]) return kindLabel[ev.storyKind];
  if (ev.type === "ACTIVITY") return "Activity";
  return "Custom";
}

type Props = {
  dayId: string;
  ev: EventDraft;
  animateEnter: boolean;
  updateEvent: (dayId: string, eventId: string, patch: Partial<EventDraft>) => void;
  removeEvent: (dayId: string, eventId: string) => void;
  uploadFile: (file: File) => Promise<string>;
};

export function StoryEventCard({
  dayId,
  ev,
  animateEnter,
  updateEvent,
  removeEvent,
  uploadFile,
}: Props) {
  const placePicker = placePickerForType(ev.type);
  const hero = useHeroImage(ev);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback(
    async (file: File | null) => {
      if (!file || !file.type.startsWith("image/")) return;
      setUploading(true);
      try {
        const url = await uploadFile(file);
        updateEvent(dayId, ev.clientId, { coverImageUrl: url });
      } finally {
        setUploading(false);
      }
    },
    [dayId, ev.clientId, updateEvent, uploadFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      void onFile(f ?? null);
    },
    [onFile],
  );

  return (
    <li
      className={`overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900 ${
        animateEnter ? "story-card-enter" : ""
      }`}
    >
      <div
        role={hero && !ev.coverImageUrl ? "button" : undefined}
        tabIndex={hero && !ev.coverImageUrl ? 0 : undefined}
        onKeyDown={
          hero && !ev.coverImageUrl
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileRef.current?.click();
                }
              }
            : undefined
        }
        onDragOver={
          hero
            ? (e) => {
                e.preventDefault();
                setDragOver(true);
              }
            : undefined
        }
        onDragLeave={hero ? () => setDragOver(false) : undefined}
        onDrop={hero ? onDrop : undefined}
        onClick={hero && !ev.coverImageUrl ? () => fileRef.current?.click() : undefined}
        className={
          hero
            ? `relative flex min-h-[160px] flex-col items-center justify-center transition-colors md:min-h-[180px] ${
                ev.coverImageUrl
                  ? "cursor-default border-b border-neutral-200 dark:border-zinc-700"
                  : `cursor-pointer border-b-2 border-dashed ${
                      dragOver
                        ? "border-emerald-500 bg-emerald-50/80 dark:border-emerald-400 dark:bg-emerald-950/40"
                        : "border-neutral-200 bg-gradient-to-br from-neutral-50 to-neutral-100/80 dark:border-zinc-600 dark:from-zinc-800 dark:to-zinc-900"
                    }`
              }`
            : "relative border-b border-neutral-100 dark:border-zinc-800"
        }
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label="Upload cover image"
          onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
        />
        {ev.coverImageUrl && hero ? (
          <div className="relative min-h-[160px] w-full md:min-h-[180px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ev.coverImageUrl}
              alt=""
              className="h-full min-h-[160px] w-full object-cover md:min-h-[180px]"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileRef.current?.click();
              }}
              className="absolute bottom-2 right-2 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur hover:bg-black/70"
            >
              Change photo
            </button>
          </div>
        ) : ev.coverImageUrl && !hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ev.coverImageUrl}
            alt=""
            className="h-28 w-full object-cover"
          />
        ) : hero ? (
          <div className="pointer-events-none flex flex-col items-center gap-2 px-4 py-6 text-center">
            <span className="text-3xl opacity-40" aria-hidden>
              🖼
            </span>
            <p className="text-sm font-medium text-neutral-600 dark:text-zinc-300">
              {uploading ? "Uploading…" : "Drop a photo here or tap to browse"}
            </p>
            <p className="text-xs text-neutral-500 dark:text-zinc-500">
              Show off this moment in your story
            </p>
          </div>
        ) : (
          <div
            className={`flex w-full items-center gap-3 p-3 transition-colors ${
              dragOver ? "bg-emerald-50/90 dark:bg-emerald-950/30" : ""
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileRef.current?.click();
              }}
              className="relative flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            >
              {uploading ? (
                "…"
              ) : ev.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ev.coverImageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                "+ Photo"
              )}
            </button>
            <p className="text-left text-xs text-neutral-500 dark:text-zinc-500">
              Add a cover — or drag and drop an image here.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeBadgeColor(ev.storyKind, ev.type)}`}
          >
            {badgeText(ev)}
          </span>
          <button
            type="button"
            onClick={() => removeEvent(dayId, ev.clientId)}
            className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
          >
            Remove
          </button>
        </div>

        {placePicker ? (
          <div className="border-t border-neutral-100 px-3 pt-3 dark:border-zinc-800">
            <HotelPlaceInput
              searchLabel={placePicker.searchLabel}
              placeholder={placePicker.placeholder}
              value={{
                title: ev.title,
                location: ev.location,
                googlePlaceId: ev.googlePlaceId,
                googleMapsUrl: ev.googleMapsUrl,
                websiteUrl: ev.websiteUrl,
                lat: ev.lat,
                lng: ev.lng,
              }}
              onChange={(patch) => updateEvent(dayId, ev.clientId, patch)}
            />
          </div>
        ) : null}

        <details className="group rounded-xl border border-neutral-100 bg-neutral-50/50 dark:border-zinc-800 dark:bg-zinc-800/40">
          <summary className="cursor-pointer list-none px-3 py-2 text-xs font-medium text-neutral-600 dark:text-zinc-400 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-2">
              Details and type
              <span className="text-neutral-400 group-open:rotate-180 dark:text-zinc-500">▼</span>
            </span>
          </summary>
          <div className="space-y-3 border-t border-neutral-100 p-3 dark:border-zinc-800">
            <label className="block space-y-1">
              <span className="text-xs text-neutral-500 dark:text-zinc-400">Event type</span>
              <select
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                value={ev.type}
                onChange={(e) => {
                  const next = e.target.value as EventDraft["type"];
                  const patch: Partial<EventDraft> = { type: next };
                  if (next === "FLIGHT") {
                    patch.googlePlaceId = undefined;
                    patch.googleMapsUrl = undefined;
                    patch.websiteUrl = undefined;
                    patch.lat = undefined;
                    patch.lng = undefined;
                  }
                  if (next !== "FLIGHT") {
                    patch.airline = "";
                    patch.departureAirportCode = "";
                    patch.departureAirportName = "";
                    patch.arrivalAirportCode = "";
                    patch.arrivalAirportName = "";
                    patch.departureAt = "";
                    patch.arrivalAt = "";
                  }
                  if (next === "HOTEL") patch.storyKind = "stay";
                  else if (next === "MEAL") patch.storyKind = "meal";
                  else if (next === "ACTIVITY") {
                    patch.storyKind = ev.storyKind === "transit" ? "transit" : "activity";
                  } else {
                    patch.storyKind = undefined;
                  }
                  updateEvent(dayId, ev.clientId, patch);
                }}
              >
                <option value="FLIGHT">Flight</option>
                <option value="HOTEL">Hotel / Stay</option>
                <option value="ACTIVITY">Activity</option>
                <option value="MEAL">Meal</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </label>

            {ev.type === "FLIGHT" ? (
              <div className="space-y-3">
                <label className="block space-y-1">
                  <span className="text-xs text-neutral-500 dark:text-zinc-400">Airline</span>
                  <input
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                    list={`airlines-${ev.clientId}`}
                    value={ev.airline}
                    onChange={(e) =>
                      updateEvent(dayId, ev.clientId, { airline: e.target.value })
                    }
                    placeholder="e.g. Delta Air Lines"
                  />
                  <datalist id={`airlines-${ev.clientId}`}>
                    {AIRLINE_SUGGESTIONS.map((a) => (
                      <option key={a} value={a} />
                    ))}
                  </datalist>
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <AirportCombobox
                    label="From"
                    code={ev.departureAirportCode}
                    name={ev.departureAirportName}
                    onChange={({ code, name }) =>
                      updateEvent(dayId, ev.clientId, {
                        departureAirportCode: code,
                        departureAirportName: name,
                      })
                    }
                  />
                  <AirportCombobox
                    label="To"
                    code={ev.arrivalAirportCode}
                    name={ev.arrivalAirportName}
                    onChange={({ code, name }) =>
                      updateEvent(dayId, ev.clientId, {
                        arrivalAirportCode: code,
                        arrivalAirportName: name,
                      })
                    }
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs text-neutral-500 dark:text-zinc-400">Departure</span>
                    <input
                      type="datetime-local"
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                      value={ev.departureAt}
                      onChange={(e) =>
                        updateEvent(dayId, ev.clientId, { departureAt: e.target.value })
                      }
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs text-neutral-500 dark:text-zinc-400">Arrival</span>
                    <input
                      type="datetime-local"
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                      value={ev.arrivalAt}
                      onChange={(e) =>
                        updateEvent(dayId, ev.clientId, { arrivalAt: e.target.value })
                      }
                    />
                  </label>
                </div>
              </div>
            ) : null}

            <label className="block space-y-1">
              <span className="text-xs text-neutral-500 dark:text-zinc-400">Title</span>
              <input
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                value={ev.title}
                onChange={(e) => updateEvent(dayId, ev.clientId, { title: e.target.value })}
                placeholder={
                  placePicker
                    ? "Often filled from place search — edit anytime"
                    : "What happened?"
                }
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-neutral-500 dark:text-zinc-400">Location / address</span>
              <input
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                value={ev.location}
                onChange={(e) => updateEvent(dayId, ev.clientId, { location: e.target.value })}
                placeholder={
                  placePicker
                    ? "From Google Places or type manually"
                    : "City, venue, or neighborhood"
                }
              />
            </label>
            <StarRating
              value={ev.ratingStars}
              onChange={(ratingStars) => updateEvent(dayId, ev.clientId, { ratingStars })}
            />
            <label className="block space-y-1">
              <span className="text-xs text-neutral-500 dark:text-zinc-400">Notes</span>
              <textarea
                className="min-h-[72px] w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                value={ev.description}
                onChange={(e) =>
                  updateEvent(dayId, ev.clientId, { description: e.target.value })
                }
              />
            </label>
          </div>
        </details>
      </div>
    </li>
  );
}
