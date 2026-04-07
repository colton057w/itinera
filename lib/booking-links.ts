import type { EventType } from "@prisma/client";

const marker = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER ?? "";

function qs(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(
    (e): e is [string, string] => e[1] != null && e[1] !== "",
  );
  return entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
}

function fmtDate(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Aviasales short-date for path segment: DDMM */
function aviasalesDate(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}${mm}`;
}

// ---------------------------------------------------------------------------
// Flight booking via Aviasales (Travelpayouts)
// ---------------------------------------------------------------------------

export function flightSearchUrl(opts: {
  departureAirportCode?: string | null;
  arrivalAirportCode?: string | null;
  departureDate?: Date | string | null;
  returnDate?: Date | string | null;
}): string | null {
  const origin = opts.departureAirportCode?.trim().toUpperCase();
  const dest = opts.arrivalAirportCode?.trim().toUpperCase();
  if (!origin || !dest) return null;

  const depStr = opts.departureDate ? aviasalesDate(opts.departureDate) : "";
  const retStr = opts.returnDate ? aviasalesDate(opts.returnDate) : "";

  const path = `${origin}${depStr}${dest}${retStr}1`;
  const q = marker ? `?marker=${encodeURIComponent(marker)}` : "";
  return `https://www.aviasales.com/search/${path}${q}`;
}

// ---------------------------------------------------------------------------
// Hotel booking via Hotellook (Travelpayouts)
// ---------------------------------------------------------------------------

export function hotelSearchUrl(opts: {
  location?: string | null;
  title?: string | null;
  checkIn?: Date | string | null;
  checkOut?: Date | string | null;
  lat?: number | null;
  lng?: number | null;
}): string | null {
  const destination =
    opts.location?.trim() || opts.title?.trim();
  if (!destination && opts.lat == null) return null;

  const params: Record<string, string | undefined> = {
    destination: destination || undefined,
    checkIn: opts.checkIn ? fmtDate(opts.checkIn) : undefined,
    checkOut: opts.checkOut ? fmtDate(opts.checkOut) : undefined,
    marker: marker || undefined,
  };

  if (
    opts.lat != null &&
    opts.lng != null &&
    Number.isFinite(opts.lat) &&
    Number.isFinite(opts.lng)
  ) {
    params.lat = String(opts.lat);
    params.lng = String(opts.lng);
  }

  return `https://search.hotellook.com/?${qs(params)}`;
}

// ---------------------------------------------------------------------------
// Activity / tour booking via GetYourGuide
// ---------------------------------------------------------------------------

export function activitySearchUrl(opts: {
  title?: string | null;
  location?: string | null;
  date?: Date | string | null;
}): string | null {
  const q = opts.location?.trim() || opts.title?.trim();
  if (!q) return null;

  const params: Record<string, string | undefined> = {
    q,
    date_from: opts.date ? fmtDate(opts.date) : undefined,
    partner_id: marker || undefined,
  };

  return `https://www.getyourguide.com/s/?${qs(params)}`;
}

// ---------------------------------------------------------------------------
// Restaurant / meal reservation via OpenTable search
// ---------------------------------------------------------------------------

export function restaurantSearchUrl(opts: {
  title?: string | null;
  location?: string | null;
  date?: Date | string | null;
  lat?: number | null;
  lng?: number | null;
}): string | null {
  const term = opts.title?.trim();
  if (!term) return null;

  const params: Record<string, string | undefined> = {
    term,
    dateTime: opts.date ? fmtDate(opts.date) : undefined,
  };

  if (
    opts.lat != null &&
    opts.lng != null &&
    Number.isFinite(opts.lat) &&
    Number.isFinite(opts.lng)
  ) {
    params.latitude = String(opts.lat);
    params.longitude = String(opts.lng);
  }

  return `https://www.opentable.com/s?${qs(params)}`;
}

// ---------------------------------------------------------------------------
// Unified booking URL per event type
// ---------------------------------------------------------------------------

export type BookingLinkResult = {
  label: string;
  href: string;
  provider: string;
};

export function bookingLinkForEvent(ev: {
  type: EventType;
  title: string;
  location?: string | null;
  lat?: number | null;
  lng?: number | null;
  departureAirportCode?: string | null;
  arrivalAirportCode?: string | null;
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
  dayDate?: Date | string | null;
}): BookingLinkResult | null {
  const dateForEvent = ev.startsAt ?? ev.dayDate ?? null;

  switch (ev.type) {
    case "FLIGHT": {
      const url = flightSearchUrl({
        departureAirportCode: ev.departureAirportCode,
        arrivalAirportCode: ev.arrivalAirportCode,
        departureDate: ev.startsAt ?? ev.dayDate,
        returnDate: ev.endsAt,
      });
      if (!url) return null;
      return { label: "Search flights", href: url, provider: "Aviasales" };
    }
    case "HOTEL": {
      const url = hotelSearchUrl({
        location: ev.location,
        title: ev.title,
        checkIn: dateForEvent,
        checkOut: ev.endsAt,
        lat: ev.lat,
        lng: ev.lng,
      });
      if (!url) return null;
      return { label: "Search hotels", href: url, provider: "Hotellook" };
    }
    case "MEAL": {
      const url = restaurantSearchUrl({
        title: ev.title,
        location: ev.location,
        date: dateForEvent,
        lat: ev.lat,
        lng: ev.lng,
      });
      if (!url) return null;
      return { label: "Reserve table", href: url, provider: "OpenTable" };
    }
    case "ACTIVITY":
    case "CUSTOM": {
      const url = activitySearchUrl({
        title: ev.title,
        location: ev.location,
        date: dateForEvent,
      });
      if (!url) return null;
      return {
        label: ev.type === "ACTIVITY" ? "Find tours" : "Search activity",
        href: url,
        provider: "GetYourGuide",
      };
    }
    default:
      return null;
  }
}
