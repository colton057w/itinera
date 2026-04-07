import type { EventType } from "@prisma/client";

type BookingEventLike = {
  type: EventType;
  title: string;
  location: string | null;
  startsAt: Date | null;
  departureAirportCode: string | null;
  arrivalAirportCode: string | null;
};

type BookingDayLike = {
  dayIndex: number;
  date: Date | null;
  events: BookingEventLike[];
};

export type BookingLinkOption = {
  label: string;
  href: string;
  note: string;
};

export type OneClickBookingModel = {
  summary: string;
  dateRangeLabel: string | null;
  stackLinks: BookingLinkOption[];
  quickLinks: BookingLinkOption[];
};

function toYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(date: Date, days: number): Date {
  const shifted = new Date(date);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted;
}

function normalizedIata(raw: string | null | undefined): string | null {
  const clean = raw?.trim().toUpperCase().replace(/[^A-Z]/g, "");
  if (!clean || clean.length !== 3) return null;
  return clean;
}

function parseIataCodes(raw: string): string[] {
  const matches = raw.toUpperCase().match(/\b[A-Z]{3}\b/g) ?? [];
  const out: string[] = [];
  for (const code of matches) {
    if (!out.includes(code)) out.push(code);
  }
  return out;
}

function asSearchQuery(parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => part?.trim() ?? "")
    .filter(Boolean)
    .join(" ");
}

function collectTimelineBounds(days: BookingDayLike[]): { start: Date | null; end: Date | null } {
  let start: Date | null = null;
  let end: Date | null = null;
  for (const day of days) {
    if (day.date && (!start || day.date < start)) start = day.date;
    if (day.date && (!end || day.date > end)) end = day.date;
    for (const ev of day.events) {
      if (!ev.startsAt) continue;
      if (!start || ev.startsAt < start) start = ev.startsAt;
      if (!end || ev.startsAt > end) end = ev.startsAt;
    }
  }
  return { start, end };
}

function buildTravelpayoutsFlightSearchUrl(opts: {
  originIata: string;
  destinationIata?: string | null;
  departDate: string;
  returnDate?: string | null;
  adults?: number;
  marker?: string | null;
}): string {
  const url = new URL("https://search.aviasales.com/flights/");
  url.searchParams.set("origin_iata", opts.originIata);
  if (opts.destinationIata?.trim()) {
    url.searchParams.set("destination_iata", opts.destinationIata.trim());
  }
  url.searchParams.set("depart_date", opts.departDate);
  if (opts.returnDate) {
    url.searchParams.set("return_date", opts.returnDate);
    url.searchParams.set("one_way", "false");
  } else {
    url.searchParams.set("one_way", "true");
  }
  url.searchParams.set("adults", String(Math.max(1, opts.adults ?? 1)));
  url.searchParams.set("children", "0");
  url.searchParams.set("infants", "0");
  url.searchParams.set("trip_class", "0");
  url.searchParams.set("locale", "en");
  if (opts.marker?.trim()) {
    url.searchParams.set("marker", opts.marker.trim());
  }
  return url.toString();
}

function buildTravelpayoutsHotelSearchUrl(opts: {
  query: string;
  checkIn: string;
  checkOut: string;
  adults?: number;
  marker?: string | null;
}): string {
  const url = new URL("https://search.hotellook.com/");
  url.searchParams.set("destination", opts.query);
  url.searchParams.set("checkIn", opts.checkIn);
  url.searchParams.set("checkOut", opts.checkOut);
  url.searchParams.set("adults", String(Math.max(1, opts.adults ?? 1)));
  url.searchParams.set("children", "0");
  url.searchParams.set("currency", "usd");
  url.searchParams.set("locale", "en");
  if (opts.marker?.trim()) {
    url.searchParams.set("marker", opts.marker.trim());
  }
  return url.toString();
}

function buildExpediaHotelSearchUrl(opts: {
  query: string;
  checkIn: string;
  checkOut: string;
  adults?: number;
}): string {
  const url = new URL("https://www.expedia.com/Hotel-Search");
  url.searchParams.set("destination", opts.query);
  url.searchParams.set("startDate", opts.checkIn);
  url.searchParams.set("endDate", opts.checkOut);
  url.searchParams.set("adults", String(Math.max(1, opts.adults ?? 1)));
  url.searchParams.set("rooms", "1");
  return url.toString();
}

export function buildOpenTableSearchUrl(query: string): string {
  const url = new URL("https://www.opentable.com/s/");
  url.searchParams.set("term", query.trim());
  return url.toString();
}

export function buildGetYourGuideSearchUrl(query: string): string {
  const url = new URL("https://www.getyourguide.com/s/");
  url.searchParams.set("q", query.trim());
  return url.toString();
}

export function buildGoogleSearchUrl(query: string): string {
  const url = new URL("https://www.google.com/search");
  url.searchParams.set("q", query.trim());
  return url.toString();
}

export function looksNightlifeRelated(title: string, location: string | null): boolean {
  const haystack = `${title} ${location ?? ""}`.toLowerCase();
  return /(club|nightclub|lounge|rooftop|bar|cocktail|dj|dance|nightlife)/.test(haystack);
}

export function buildOneClickBookingModel(opts: {
  itineraryTitle: string;
  days: BookingDayLike[];
  adults?: number;
  travelpayoutsMarker?: string | null;
}): OneClickBookingModel | null {
  const sortedDays = [...opts.days].sort((a, b) => a.dayIndex - b.dayIndex);
  const flights = sortedDays
    .flatMap((day) =>
      day.events.map((ev) => ({
        dayDate: day.date,
        startsAt: ev.startsAt,
        departureAirportCode: normalizedIata(ev.departureAirportCode),
        arrivalAirportCode: normalizedIata(ev.arrivalAirportCode),
        title: ev.title,
        location: ev.location,
        type: ev.type,
      })),
    )
    .filter((ev) => ev.type === "FLIGHT")
    .map((ev) => {
      const extracted = parseIataCodes(`${ev.title} ${ev.location ?? ""}`);
      const departure = ev.departureAirportCode ?? extracted[0] ?? null;
      const arrival = ev.arrivalAirportCode ?? extracted[1] ?? null;
      return {
        ...ev,
        departureAirportCode: departure,
        arrivalAirportCode: arrival,
      };
    });

  const bounds = collectTimelineBounds(sortedDays);
  const tripStart = bounds.start;
  const tripEnd = bounds.end;
  const checkIn = tripStart ? toYmd(tripStart) : null;
  const checkOut = tripEnd ? toYmd(addUtcDays(tripEnd, 1)) : null;

  const firstFlight = flights[0];
  const returnFlight =
    firstFlight &&
    flights.find(
      (f) =>
        f.departureAirportCode === firstFlight.arrivalAirportCode &&
        f.arrivalAirportCode === firstFlight.departureAirportCode,
    );
  const departDate = firstFlight?.startsAt
    ? toYmd(firstFlight.startsAt)
    : firstFlight?.dayDate
      ? toYmd(firstFlight.dayDate)
      : checkIn;
  const returnDate = returnFlight?.startsAt
    ? toYmd(returnFlight.startsAt)
    : returnFlight?.dayDate
      ? toYmd(returnFlight.dayDate)
      : checkOut
        ? toYmd(addUtcDays(new Date(checkOut), -1))
        : null;

  const hotelAnchor = sortedDays
    .flatMap((day) => day.events)
    .find((ev) => ev.type === "HOTEL" && (ev.location?.trim() || ev.title.trim()));
  const firstLocatedEvent = sortedDays
    .flatMap((day) => day.events)
    .find((ev) => ev.location?.trim() || ev.title.trim());
  const destinationQuery = asSearchQuery([
    hotelAnchor?.location,
    hotelAnchor?.title,
    firstLocatedEvent?.location,
    firstLocatedEvent?.title,
    opts.itineraryTitle,
  ]);

  const stackLinks: BookingLinkOption[] = [];
  const quickLinks: BookingLinkOption[] = [];

  const inferredDestination =
    firstFlight?.arrivalAirportCode ??
    flights.find(
      (f) =>
        f.departureAirportCode &&
        firstFlight?.departureAirportCode &&
        f.departureAirportCode !== firstFlight.departureAirportCode,
    )?.departureAirportCode ??
    null;

  if (firstFlight?.departureAirportCode && departDate) {
    stackLinks.push({
      label: "Find flights (Travelpayouts / Aviasales)",
      href: buildTravelpayoutsFlightSearchUrl({
        originIata: firstFlight.departureAirportCode,
        destinationIata: inferredDestination,
        departDate,
        returnDate,
        adults: opts.adults,
        marker: opts.travelpayoutsMarker,
      }),
      note: "Prefilled from itinerary flight legs and dates (best available route data).",
    });
  }

  if (destinationQuery && checkIn && checkOut) {
    const hotelTp = buildTravelpayoutsHotelSearchUrl({
      query: destinationQuery,
      checkIn,
      checkOut,
      adults: opts.adults,
      marker: opts.travelpayoutsMarker,
    });
    const hotelExpedia = buildExpediaHotelSearchUrl({
      query: destinationQuery,
      checkIn,
      checkOut,
      adults: opts.adults,
    });
    stackLinks.push({
      label: "Find hotels (Travelpayouts / Hotellook)",
      href: hotelTp,
      note: "Checks Booking.com/Agoda-style inventory via Travelpayouts stack.",
    });
    quickLinks.push({
      label: "Compare hotels on Expedia",
      href: hotelExpedia,
      note: "Fallback meta search with the same stay window.",
    });
  }

  if (!stackLinks.length && !quickLinks.length) {
    return null;
  }

  const dateRangeLabel =
    checkIn && checkOut ? `${checkIn} → ${checkOut}` : null;

  return {
    summary:
      "One-click booking opens flight + hotel searches using your itinerary timeline.",
    dateRangeLabel,
    stackLinks,
    quickLinks,
  };
}
