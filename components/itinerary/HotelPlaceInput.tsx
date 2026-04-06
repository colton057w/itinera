"use client";

import { useEffect, useId, useRef, useState } from "react";

type Prediction = {
  placeId: string;
  mainText: string;
  secondaryText: string;
};

type PlaceDetails = {
  name: string;
  formattedAddress: string;
  website: string | null;
  googleMapsUrl: string | null;
  lat: number | null;
  lng: number | null;
};

export type HotelPlaceValue = {
  googlePlaceId?: string;
  googleMapsUrl?: string;
  websiteUrl?: string;
  lat?: number;
  lng?: number;
  title: string;
  location: string;
};

type Props = {
  value: HotelPlaceValue;
  onChange: (patch: Partial<HotelPlaceValue>) => void;
};

export function HotelPlaceInput({ value, onChange }: Props) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(() =>
    value.googlePlaceId ? value.title || value.location || "" : "",
  );
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [highlight, setHighlight] = useState(-1);

  useEffect(() => {
    if (value.googlePlaceId) {
      setQuery(value.title || value.location || "");
    }
  }, [value.googlePlaceId, value.title, value.location]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setPredictions([]);
      return;
    }

    const t = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const res = await fetch(
            `/api/places/autocomplete?input=${encodeURIComponent(query.trim())}`,
          );
          const data = (await res.json()) as {
            predictions?: Prediction[];
            configured?: boolean;
            error?: string;
          };
          setConfigured(data.configured ?? false);
          if (!res.ok) {
            setPredictions([]);
            return;
          }
          setPredictions(data.predictions ?? []);
        } catch {
          setPredictions([]);
        } finally {
          setLoading(false);
        }
      })();
    }, 320);

    return () => window.clearTimeout(t);
  }, [query, open]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setHighlight(-1);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function choosePrediction(p: Prediction) {
    setOpen(false);
    setHighlight(-1);
    setDetailsLoading(true);
    setQuery(p.mainText + (p.secondaryText ? ` · ${p.secondaryText}` : ""));
    try {
      const res = await fetch(
        `/api/places/details?placeId=${encodeURIComponent(p.placeId)}`,
      );
      if (!res.ok) {
        onChange({
          googlePlaceId: p.placeId,
          title: p.mainText,
          location: p.secondaryText || p.mainText,
        });
        return;
      }
      const d = (await res.json()) as PlaceDetails;
      onChange({
        googlePlaceId: p.placeId,
        googleMapsUrl: d.googleMapsUrl || undefined,
        websiteUrl: d.website || undefined,
        lat: d.lat ?? undefined,
        lng: d.lng ?? undefined,
        title: d.name || p.mainText,
        location: d.formattedAddress || p.secondaryText || p.mainText,
      });
    } finally {
      setDetailsLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || predictions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % predictions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? predictions.length - 1 : h - 1));
    } else if (e.key === "Enter" && highlight >= 0) {
      e.preventDefault();
      void choosePrediction(predictions[highlight]!);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="space-y-2 md:col-span-2">
      <label className="block space-y-1">
        <span className="text-xs text-neutral-500 dark:text-zinc-400">
          Find hotel <span className="font-normal">(Google-style search)</span>
        </span>
        <input
          type="text"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          placeholder="e.g. Hotel Caruso Ravello"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(-1);
            if (value.googlePlaceId) {
              onChange({
                googlePlaceId: undefined,
                googleMapsUrl: undefined,
                websiteUrl: undefined,
                lat: undefined,
                lng: undefined,
              });
            }
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
      </label>

      {configured === false ? (
        <p className="text-xs text-amber-800 dark:text-amber-200/90">
          Add{" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">
            GOOGLE_PLACES_API_KEY
          </code>{" "}
          to <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">.env</code> and
          enable <strong>Places API</strong> in Google Cloud. You can still type the hotel name and
          address manually below.
        </p>
      ) : null}

      {open && predictions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="z-20 max-h-56 overflow-auto rounded-lg border border-neutral-200 bg-white py-1 text-sm shadow-lg dark:border-zinc-600 dark:bg-zinc-900"
        >
          {predictions.map((p, i) => (
            <li key={p.placeId} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                className={`flex w-full flex-col items-start px-3 py-2 text-left hover:bg-neutral-50 dark:hover:bg-zinc-800 ${
                  i === highlight ? "bg-neutral-50 dark:bg-zinc-800" : ""
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void choosePrediction(p)}
              >
                <span className="font-medium text-neutral-900 dark:text-zinc-100">
                  {p.mainText}
                </span>
                {p.secondaryText ? (
                  <span className="text-xs text-neutral-500 dark:text-zinc-400">
                    {p.secondaryText}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {loading ? (
        <p className="text-xs text-neutral-500 dark:text-zinc-400">Searching…</p>
      ) : null}
      {detailsLoading ? (
        <p className="text-xs text-neutral-500 dark:text-zinc-400">Loading place details…</p>
      ) : null}

      {value.googlePlaceId ? (
        <p className="text-xs text-emerald-800 dark:text-emerald-400">
          Linked to Google Places — readers will see website and Maps buttons on your itinerary.
        </p>
      ) : null}
    </div>
  );
}
