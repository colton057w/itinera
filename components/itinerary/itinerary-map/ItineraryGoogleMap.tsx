"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useEffect, useRef } from "react";
import { useItineraryMap } from "./ItineraryMapContext";

export function ItineraryGoogleMap({ apiKey }: { apiKey: string }) {
  const { points, focusEvent, setMapInstance } = useItineraryMap();
  const elRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef(focusEvent);
  focusRef.current = focusEvent;

  const pointsKey = points.map((p) => `${p.id}:${p.lat},${p.lng}`).join("|");

  useEffect(() => {
    if (!apiKey || points.length === 0) {
      setMapInstance(null);
      return;
    }

    if (!elRef.current) return;

    let cancelled = false;
    const markers: google.maps.Marker[] = [];
    let map: google.maps.Map | null = null;

    void (async () => {
      try {
        setOptions({ key: apiKey, v: "weekly" });
        await importLibrary("maps");
        if (cancelled || !elRef.current) return;

        map = new google.maps.Map(elRef.current, {
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          gestureHandling: "cooperative",
        });
        setMapInstance(map);

        for (const p of points) {
          const marker = new google.maps.Marker({
            position: { lat: p.lat, lng: p.lng },
            map,
            title: `${p.title} · ${p.dayLabel}`,
          });
          marker.addListener("click", () => focusRef.current(p.id));
          markers.push(marker);
        }

        if (points.length === 1) {
          const only = points[0]!;
          map.setCenter({ lat: only.lat, lng: only.lng });
          map.setZoom(14);
        } else {
          const bounds = new google.maps.LatLngBounds();
          for (const p of points) {
            bounds.extend({ lat: p.lat, lng: p.lng });
          }
          map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
        }
      } catch (err) {
        console.error("[ItineraryGoogleMap]", err);
      }
    })();

    return () => {
      cancelled = true;
      for (const m of markers) {
        m.setMap(null);
      }
      markers.length = 0;
      setMapInstance(null);
      map = null;
    };
  }, [apiKey, pointsKey, points, setMapInstance]);

  if (!apiKey) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/80 px-4 text-center dark:border-zinc-600 dark:bg-zinc-900/40">
        <p className="text-sm font-medium text-neutral-700 dark:text-zinc-300">Map unavailable</p>
        <p className="mt-1 max-w-xs text-xs text-neutral-500 dark:text-zinc-500">
          Add{" "}
          <code className="rounded bg-neutral-200 px-1 py-0.5 dark:bg-zinc-800">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
          </code>{" "}
          (Maps JavaScript API enabled) to show stops on a map.
        </p>
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/80 px-4 text-center text-sm text-neutral-600 dark:border-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-400">
        No pinned places yet. Events get coordinates when you pick a location from search while
        planning.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 shadow-sm dark:border-zinc-700">
      <div
        ref={elRef}
        className="h-[min(42vh,320px)] w-full min-h-[220px] bg-neutral-100 dark:bg-zinc-800"
        role="region"
        aria-label="Map of itinerary stops"
      />
    </div>
  );
}
