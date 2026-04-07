import type { EventType } from "@prisma/client";
import { bookingLinkForEvent } from "@/lib/booking-links";
import { mapsHrefForPlace, withHttps } from "@/lib/external-links";
import { BookingLink } from "./BookingLink";

export function EventPlaceLinks({
  type,
  title,
  location,
  googlePlaceId,
  googleMapsUrl,
  websiteUrl,
  lat,
  lng,
  departureAirportCode,
  arrivalAirportCode,
  startsAt,
  endsAt,
  dayDate,
}: {
  type: EventType;
  title: string;
  location: string | null;
  googlePlaceId: string | null;
  googleMapsUrl: string | null;
  websiteUrl: string | null;
  lat: number | null;
  lng: number | null;
  departureAirportCode?: string | null;
  arrivalAirportCode?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  dayDate?: Date | null;
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

  const booking = bookingLinkForEvent({
    type,
    title,
    location,
    lat,
    lng,
    departureAirportCode,
    arrivalAirportCode,
    startsAt,
    endsAt,
    dayDate,
  });

  if (!hasLinks && !location?.trim() && !booking) return null;

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
      {hasLinks ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
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
      {booking ? (
        <div className="mt-1.5">
          <BookingLink link={booking} />
        </div>
      ) : null}
    </div>
  );
}
