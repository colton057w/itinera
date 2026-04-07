"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { mapsHrefForPlace } from "@/lib/external-links";

export type GuestEventPayload = {
  id: string;
  title: string;
  type: string;
  location: string | null;
  googleMapsUrl: string | null;
  googlePlaceId: string | null;
  lat: number | null;
  lng: number | null;
  dayLabel: string;
  startsAt: string | null;
  endsAt: string | null;
  guestPhotos: {
    id: string;
    url: string;
    caption: string | null;
    authorName: string | null;
  }[];
};

function formatCountdown(target: Date, now: Date): string {
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return "The big day is here!";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  if (d > 0) return `${d} day${d === 1 ? "" : "s"} to go`;
  if (h > 0) return `${h} hour${h === 1 ? "" : "s"} to go`;
  return "Starting soon";
}

function currentEventId(events: GuestEventPayload[], now: Date): string | null {
  for (const ev of events) {
    const start = ev.startsAt ? new Date(ev.startsAt) : null;
    const end = ev.endsAt ? new Date(ev.endsAt) : null;
    if (start && end && now >= start && now <= end) return ev.id;
    if (start && !end && now >= start && now.getTime() - start.getTime() < 4 * 3600000) {
      return ev.id;
    }
  }
  return null;
}

export function GuestPortal({
  itineraryId,
  title,
  tripStart,
  events,
}: {
  itineraryId: string;
  title: string;
  tripStart: string | null;
  events: GuestEventPayload[];
}) {
  const router = useRouter();
  const { status } = useSession();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 15000);
    return () => window.clearInterval(t);
  }, []);

  const target = useMemo(() => (tripStart ? new Date(tripStart) : null), [tripStart]);
  const countdown = target ? formatCountdown(target, now) : null;
  const liveId = useMemo(() => currentEventId(events, now), [events, now]);

  async function onPickPhoto(eventId: string, file: File) {
    if (status !== "authenticated") {
      window.alert("Log in to add a photo to the guest wall.");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    const up = await fetch("/api/upload", { method: "POST", body: fd });
    if (!up.ok) {
      window.alert("Upload failed");
      return;
    }
    const { url } = (await up.json()) as { url: string };
    const res = await fetch(
      `/api/itineraries/${itineraryId}/events/${eventId}/guest-photos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      },
    );
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      window.alert(err.error ?? "Could not save photo");
      return;
    }
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/90 via-white to-neutral-50 dark:from-rose-950/30 dark:via-zinc-950 dark:to-zinc-950">
      <header className="border-b border-rose-100 bg-white/90 px-6 py-6 backdrop-blur dark:border-rose-900/40 dark:bg-zinc-950/90">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700 dark:text-rose-300">
          Guest view
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-zinc-50">
          {title}
        </h1>
        {countdown ? (
          <p className="mt-3 inline-flex rounded-full bg-rose-100 px-4 py-1.5 text-sm font-medium text-rose-900 dark:bg-rose-900/50 dark:text-rose-100">
            {countdown}
          </p>
        ) : null}
      </header>

      <main className="mx-auto max-w-lg space-y-6 px-4 py-8">
        {events.map((ev) => {
          const maps = mapsHrefForPlace({
            googleMapsUrl: ev.googleMapsUrl,
            googlePlaceId: ev.googlePlaceId,
            title: ev.title,
            location: ev.location,
            lat: ev.lat,
            lng: ev.lng,
          });
          const isLive = liveId === ev.id;
          return (
            <section
              key={ev.id}
              id={`guest-ev-${ev.id}`}
              className={`rounded-2xl border bg-white p-4 shadow-sm dark:bg-zinc-900 ${
                isLive
                  ? "border-rose-400 ring-2 ring-rose-200 dark:border-rose-600 dark:ring-rose-900/50"
                  : "border-neutral-200 dark:border-zinc-800"
              }`}
            >
              {isLive ? (
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-rose-700 dark:text-rose-300">
                  Happening now
                </p>
              ) : null}
              <p className="text-xs text-neutral-500 dark:text-zinc-500">{ev.dayLabel}</p>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-zinc-100">
                {ev.title}
              </h2>
              <p className="text-xs uppercase text-neutral-400 dark:text-zinc-500">
                {ev.type.replaceAll("_", " ")}
              </p>
              {ev.location ? (
                <p className="mt-1 text-sm text-neutral-700 dark:text-zinc-300">{ev.location}</p>
              ) : null}
              {maps ? (
                <a
                  href={maps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  Get directions
                </a>
              ) : null}

              {ev.guestPhotos.length > 0 ? (
                <div className="mt-4">
                  <p className="text-xs font-medium text-neutral-600 dark:text-zinc-400">
                    Guest photos
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-1">
                    {ev.guestPhotos.map((p) => (
                      <a
                        key={p.id}
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100 dark:bg-zinc-800"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.url} alt="" className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}

              <label className="mt-3 block cursor-pointer rounded-lg border border-dashed border-neutral-300 px-3 py-2 text-center text-xs font-medium text-neutral-600 hover:bg-neutral-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800/50">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) void onPickPhoto(ev.id, f);
                  }}
                />
                Add a photo
              </label>
            </section>
          );
        })}
      </main>
    </div>
  );
}
