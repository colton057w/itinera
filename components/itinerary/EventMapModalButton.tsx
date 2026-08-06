"use client";

import { useId, useMemo, useState } from "react";

type Props = {
  title: string;
  location: string | null;
  lat: number | null;
  lng: number | null;
};

function mapboxEmbedUrl({
  lat,
  lng,
  token,
}: {
  lat: number;
  lng: number;
  token: string;
}): string {
  const style = "mapbox/streets-v12";
  const path = `/styles/v1/${style}.html`;
  const query = new URLSearchParams({
    zoomwheel: "true",
    title: "false",
    access_token: token,
  });
  return `https://api.mapbox.com${path}?${query.toString()}#14/${lat}/${lng}`;
}

export function EventMapModalButton({ title, location, lat, lng }: Props) {
  const [open, setOpen] = useState(false);
  const modalTitleId = useId();
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ?? "";
  const hasCoords = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);

  const src = useMemo(() => {
    if (!hasCoords || !mapboxToken) return "";
    return mapboxEmbedUrl({
      lat: lat!,
      lng: lng!,
      token: mapboxToken,
    });
  }, [hasCoords, lat, lng, mapboxToken]);

  if (!hasCoords) return null;

  return (
    <>
      <button
        type="button"
        className="mt-3 inline-flex items-center justify-center rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
        onClick={() => setOpen(true)}
      >
        See on Map
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={modalTitleId}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-zinc-700">
              <div>
                <h3 id={modalTitleId} className="text-sm font-semibold text-neutral-900 dark:text-zinc-100">
                  {title}
                </h3>
                {location?.trim() ? (
                  <p className="text-xs text-neutral-600 dark:text-zinc-400">{location.trim()}</p>
                ) : null}
              </div>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            {src ? (
              <iframe
                title={`Map view for ${title}`}
                src={src}
                className="h-[420px] w-full border-0"
                loading="lazy"
                allowFullScreen
              />
            ) : (
              <div className="flex h-[260px] items-center justify-center px-4 text-sm text-neutral-600 dark:text-zinc-400">
                Add <code className="mx-1 rounded bg-neutral-100 px-1 dark:bg-zinc-800">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> to view embedded map.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
