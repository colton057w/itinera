import type { EventType } from "@prisma/client";
import {
  buildGetYourGuideSearchUrl,
  buildGoogleSearchUrl,
  buildOpenTableSearchUrl,
  looksNightlifeRelated,
} from "@/lib/booking-links";
import { mapsHrefForPlace, withHttps } from "@/lib/external-links";

export function EventPlaceLinks({
  type,
  title,
  location,
  googlePlaceId,
  googleMapsUrl,
  websiteUrl,
  lat,
  lng,
}: {
  type: EventType;
  title: string;
  location: string | null;
  googlePlaceId: string | null;
  googleMapsUrl: string | null;
  websiteUrl: string | null;
  lat: number | null;
  lng: number | null;
}) {
  const mapsHref = mapsHrefForPlace({
    googleMapsUrl,
    googlePlaceId,
    title,
    location,
    lat,
    lng,
  });
  const hasMaps = Boolean(mapsHref);
  const hasLinks = Boolean(websiteUrl?.trim() || hasMaps);
  const hasListedPlace = Boolean(
    googlePlaceId?.trim() || googleMapsUrl?.trim() || websiteUrl?.trim(),
  );
  const query = [title.trim(), location?.trim() ?? ""].filter(Boolean).join(" ");
  const nightlifeRelated = looksNightlifeRelated(title, location);
  const reservationHref =
    type === "MEAL" || nightlifeRelated
      ? buildOpenTableSearchUrl(query || title.trim())
      : null;
  const activityBookingHref =
    type === "ACTIVITY" && !nightlifeRelated
      ? buildGetYourGuideSearchUrl(query || title.trim())
      : null;
  const genericBookingHref =
    type === "CUSTOM"
      ? buildGoogleSearchUrl(`${query || title.trim()} booking`)
      : null;
  const hasActionLinks = Boolean(
    reservationHref || activityBookingHref || genericBookingHref,
  );

  if (!hasLinks && !hasActionLinks && !location?.trim()) return null;

  const placeSectionLabel =
    type === "HOTEL" && (hasListedPlace || location?.trim())
      ? "Stay / hotel"
      : type !== "HOTEL" && hasListedPlace
        ? "Place"
        : null;

  return (
    <div className="mt-2 space-y-1">
      {placeSectionLabel ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-400">
          {placeSectionLabel}
        </p>
      ) : null}
      {location?.trim() ? (
        <p className="text-sm text-neutral-800 dark:text-zinc-200">{location.trim()}</p>
      ) : null}
      {hasLinks || hasActionLinks ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {reservationHref ? (
            <a
              href={reservationHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-emerald-800 underline decoration-emerald-600/40 underline-offset-2 hover:decoration-emerald-800 dark:text-emerald-300"
            >
              {type === "MEAL" ? "Reserve table" : "Reserve nightlife spot"}
            </a>
          ) : null}
          {activityBookingHref ? (
            <a
              href={activityBookingHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-emerald-800 underline decoration-emerald-600/40 underline-offset-2 hover:decoration-emerald-800 dark:text-emerald-300"
            >
              Book activity tickets
            </a>
          ) : null}
          {genericBookingHref ? (
            <a
              href={genericBookingHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-emerald-800 underline decoration-emerald-600/40 underline-offset-2 hover:decoration-emerald-800 dark:text-emerald-300"
            >
              Find booking options
            </a>
          ) : null}
          {websiteUrl?.trim() ? (
            <a
              href={withHttps(websiteUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-700 underline decoration-emerald-600/35 underline-offset-2 hover:decoration-emerald-700 dark:text-emerald-400"
            >
              Official website
            </a>
          ) : null}
          {mapsHref ? (
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-700 underline decoration-emerald-600/35 underline-offset-2 hover:decoration-emerald-700 dark:text-emerald-400"
            >
              Open in Google Maps
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
