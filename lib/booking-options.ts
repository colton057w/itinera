import type { EventType } from "@prisma/client";
import { mapsHrefForPlace, withHttps } from "@/lib/external-links";

type BookingProvider = "Travelpayouts" | "Skyscanner" | "Booking.com" | "OpenTable" | "Google Maps" | "Official site";
type BookingKind = "flight" | "stay" | "venue";
type BookingReadiness = "ready" | "needs-details";

export type BookingLink = {
  label: string;
  href: string;
  provider: BookingProvider;
};

export type BookingItem = {
  id: string;
  kind: BookingKind;
  title: string;
  detail: string;
  timing: string | null;
  readiness: BookingReadiness;
  note: string;
  priceHint: string | null;
  links: BookingLink[];
};

export type BookingGroup = {
  kind: BookingKind;
  title: string;
  description: string;
  items: BookingItem[];
};

export type BookingPlan = {
  generatedAt: string;
  partySize: number;
  roomCount: number;
  tripLinks: BookingLink[];
  groups: BookingGroup[];
  warnings: string[];
  meta: {
    flightCount: number;
    stayCount: number;
    venueCount: number;
    livePriceCount: number;
    travelpayoutsEnabled: boolean;
  };
};

type BookingEventInput = {
  id: string;
  type: EventType;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  websiteUrl: string | null;
  googlePlaceId: string | null;
  googleMapsUrl: string | null;
  lat: number | null;
  lng: number | null;
  airline: string | null;
  departureAirportCode: string | null;
  arrivalAirportCode: string | null;
  departureAirportName: string | null;
  arrivalAirportName: string | null;
};

type BookingDayInput = {
  id: string;
  dayIndex: number;
  label: string | null;
  date: Date | null;
  events: BookingEventInput[];
};

export type BookingPlanInput = {
  title: string;
  days: BookingDayInput[];
  partySize?: number;
  roomCount?: number;
};

type TravelPayoutsPriceResponse = {
  success?: boolean;
  data?: Record<
    string,
    Record<
      string,
      {
        price?: number;
        airline?: string;
        departure_at?: string;
      }
    >
  >;
};

type FlightDraft = {
  id: string;
  title: string;
  detail: string;
  timing: string | null;
  readiness: BookingReadiness;
  note: string;
  links: BookingLink[];
  originCode: string | null;
  destinationCode: string | null;
  departDate: string | null;
  priceHint: string | null;
};

const DEFAULT_PARTY_SIZE = 2;
const DEFAULT_ROOM_COUNT = 1;

export async function buildBookingPlan(input: BookingPlanInput): Promise<BookingPlan> {
  const partySize = clampCount(input.partySize, DEFAULT_PARTY_SIZE, 1, 8);
  const roomCount = clampCount(input.roomCount, DEFAULT_ROOM_COUNT, 1, 4);
  const days = [...input.days].sort((a, b) => a.dayIndex - b.dayIndex);
  const tripStart = firstDefinedDate(days.map((day) => day.date));
  const tripEnd = lastDefinedDate(days.map((day) => day.date));

  const flightDrafts = days.flatMap((day) => buildFlightDrafts(day));
  const pricedFlights = await Promise.all(flightDrafts.map((draft) => withTravelPayoutsPrice(draft)));

  const stayItems = days.flatMap((day, index) =>
    buildStayItems({
      day,
      nextDay: days[index + 1] ?? null,
      tripStart,
      tripEnd,
      partySize,
      roomCount,
    }),
  );

  const venueItems = days.flatMap((day) => buildVenueItems(day, partySize));

  const flightItems: BookingItem[] = pricedFlights.map((draft) => ({
    id: draft.id,
    kind: "flight",
    title: draft.title,
    detail: draft.detail,
    timing: draft.timing,
    readiness: draft.readiness,
    note: draft.note,
    priceHint: draft.priceHint,
    links: draft.links,
  }));

  const groups: BookingGroup[] = [
    {
      kind: "flight",
      title: "Flights",
      description: "Search legs from the itinerary timeline, with live Travelpayouts price hints when configured.",
      items: flightItems,
    },
    {
      kind: "stay",
      title: "Stays",
      description: "Open hotel searches using the itinerary's dates, city hints, and room defaults.",
      items: stayItems,
    },
    {
      kind: "venue",
      title: "Tables and venues",
      description: "Jump into reservation flows for meal stops and venue links mentioned in the plan.",
      items: venueItems,
    },
  ].filter((group) => group.items.length > 0);

  const tripLinks = buildTripLinks(groups);
  const livePriceCount = flightItems.filter((item) => item.priceHint).length;
  const warnings = buildWarnings({
    flights: flightItems,
    stays: stayItems,
    venues: venueItems,
    travelpayoutsEnabled: travelPayoutsEnabled(),
  });

  return {
    generatedAt: new Date().toISOString(),
    partySize,
    roomCount,
    tripLinks,
    groups,
    warnings,
    meta: {
      flightCount: flightItems.length,
      stayCount: stayItems.length,
      venueCount: venueItems.length,
      livePriceCount,
      travelpayoutsEnabled: travelPayoutsEnabled(),
    },
  };
}

function buildTripLinks(groups: BookingGroup[]): BookingLink[] {
  const byKind = new Map<BookingKind, BookingLink>();

  for (const group of groups) {
    for (const item of group.items) {
      const primary = item.links[0];
      if (primary && !byKind.has(group.kind)) {
        byKind.set(group.kind, {
          ...primary,
          label:
            group.kind === "flight"
              ? "Search flights"
              : group.kind === "stay"
                ? "Search stays"
                : "Reserve venues",
        });
      }
    }
  }

  return ["flight", "stay", "venue"]
    .map((kind) => byKind.get(kind as BookingKind))
    .filter((link): link is BookingLink => Boolean(link));
}

function buildWarnings(args: {
  flights: BookingItem[];
  stays: BookingItem[];
  venues: BookingItem[];
  travelpayoutsEnabled: boolean;
}): string[] {
  const warnings: string[] = [];

  if (args.flights.some((item) => item.readiness === "needs-details")) {
    warnings.push("Add airport codes or flight times for sharper flight searches.");
  }
  if (args.stays.length === 0) {
    warnings.push("Add at least one hotel stop to generate stay booking links.");
  }
  if (args.venues.length === 0) {
    warnings.push("Add meal or venue stops to unlock restaurant reservation links.");
  }
  if (!args.travelpayoutsEnabled && args.flights.length > 0) {
    warnings.push("Set TRAVELPAYOUTS_TOKEN to surface live cached flight prices from Travelpayouts.");
  }

  return warnings;
}

function buildFlightDrafts(day: BookingDayInput): FlightDraft[] {
  return day.events
    .filter((event) => event.type === "FLIGHT")
    .map((event) => {
      const date = firstDefinedDate([event.startsAt, day.date]);
      const departDate = toIsoDate(date);
      const codes = inferFlightCodes(event);
      const links = buildFlightLinks(codes.originCode, codes.destinationCode, departDate);
      const readiness =
        codes.originCode && codes.destinationCode && departDate ? "ready" : "needs-details";
      const timing = formatTiming(event.startsAt, event.endsAt, day.date);
      const routeLabel =
        codes.originCode && codes.destinationCode
          ? `${codes.originCode} -> ${codes.destinationCode}`
          : codes.destinationCode
            ? `To ${codes.destinationCode}`
            : codes.originCode
              ? `From ${codes.originCode}`
              : "Airport details still needed";
      const note =
        readiness === "ready"
          ? "Launches directly into an itinerary-matched flight search."
          : "Opens a flexible flight search with the known airport details prefilled.";

      return {
        id: event.id,
        title: event.title,
        detail: routeLabel,
        timing,
        readiness,
        note,
        links,
        originCode: codes.originCode,
        destinationCode: codes.destinationCode,
        departDate,
        priceHint: null,
      };
    })
    .filter((draft) => draft.links.length > 0);
}

function buildFlightLinks(
  originCode: string | null,
  destinationCode: string | null,
  departDate: string | null,
): BookingLink[] {
  if (!departDate || (!originCode && !destinationCode)) {
    return [];
  }

  const partnerId = process.env.SKYSCANNER_PARTNER_ID?.trim();
  const url = new URL(
    originCode && destinationCode
      ? "https://skyscanner.net/g/referrals/v1/flights/day-view/"
      : "https://skyscanner.net/g/referrals/v1/flights/browse-view/",
  );

  if (originCode) url.searchParams.set("origin", originCode.toLowerCase());
  if (destinationCode) url.searchParams.set("destination", destinationCode.toLowerCase());
  url.searchParams.set("outboundDate", departDate);
  if (partnerId) url.searchParams.set("mediaPartnerId", partnerId);

  return [{ label: "Search on Skyscanner", href: url.toString(), provider: "Skyscanner" }];
}

function buildStayItems(args: {
  day: BookingDayInput;
  nextDay: BookingDayInput | null;
  tripStart: Date | null;
  tripEnd: Date | null;
  partySize: number;
  roomCount: number;
}): BookingItem[] {
  const { day, nextDay, tripStart, tripEnd, partySize, roomCount } = args;

  return day.events
    .filter((event) => event.type === "HOTEL")
    .map((event) => {
      const checkInDate = firstDefinedDate([event.startsAt, day.date, tripStart]);
      const nextHotelDate = nextDefinedHotelDate(nextDay);
      const checkOutDate =
        firstLaterDate(checkInDate, [event.endsAt, nextHotelDate, nextDay?.date ?? null, tripEnd]) ??
        addDays(checkInDate, 1);
      const query = bestLodgingQuery(event);
      const timing =
        checkInDate && checkOutDate
          ? `${formatDateLabel(checkInDate)} - ${formatDateLabel(checkOutDate)}`
          : null;
      const links = buildStayLinks({
        query,
        checkIn: toIsoDate(checkInDate),
        checkOut: toIsoDate(checkOutDate),
        partySize,
        roomCount,
        websiteUrl: event.websiteUrl,
        mapsHref: buildMapsHref(event),
      });

      return {
        id: event.id,
        kind: "stay",
        title: event.title,
        detail: query || event.location?.trim() || "Lodging details still needed",
        timing,
        readiness: query && checkInDate && checkOutDate ? "ready" : "needs-details",
        note:
          query && checkInDate && checkOutDate
            ? "Check-in and checkout are prefilled from the itinerary timeline."
            : "Add clearer hotel/location data to make stay searches more precise.",
        priceHint: null,
        links,
      };
    })
    .filter((item) => item.links.length > 0);
}

function buildStayLinks(args: {
  query: string | null;
  checkIn: string | null;
  checkOut: string | null;
  partySize: number;
  roomCount: number;
  websiteUrl: string | null;
  mapsHref: string | null;
}): BookingLink[] {
  const links: BookingLink[] = [];

  if (args.query && args.checkIn && args.checkOut) {
    const bookingUrl = new URL("https://www.booking.com/searchresults.html");
    bookingUrl.searchParams.set("ss", args.query);
    bookingUrl.searchParams.set("checkin", args.checkIn);
    bookingUrl.searchParams.set("checkout", args.checkOut);
    bookingUrl.searchParams.set("group_adults", String(args.partySize));
    bookingUrl.searchParams.set("no_rooms", String(args.roomCount));

    const affiliateId = process.env.BOOKING_AFFILIATE_ID?.trim();
    if (affiliateId) bookingUrl.searchParams.set("aid", affiliateId);

    links.push({
      label: "Search on Booking.com",
      href: bookingUrl.toString(),
      provider: "Booking.com",
    });
  }

  if (args.websiteUrl?.trim()) {
    links.push({
      label: "Official hotel site",
      href: withHttps(args.websiteUrl),
      provider: "Official site",
    });
  }

  if (args.mapsHref) {
    links.push({
      label: "Open in Google Maps",
      href: args.mapsHref,
      provider: "Google Maps",
    });
  }

  return links;
}

function buildVenueItems(day: BookingDayInput, partySize: number): BookingItem[] {
  return day.events
    .filter((event) => event.type === "MEAL" || event.type === "ACTIVITY" || event.type === "CUSTOM")
    .map((event) => {
      const query = bestVenueQuery(event);
      const date = firstDefinedDate([event.startsAt, day.date]);
      const timing = event.type === "MEAL" ? formatMealTiming(event, day.date) : formatTiming(event.startsAt, event.endsAt, day.date);
      const links = buildVenueLinks({
        type: event.type,
        query,
        date: toIsoDate(date),
        time: mealSearchTime(event),
        partySize,
        websiteUrl: event.websiteUrl,
        mapsHref: buildMapsHref(event),
      });

      return {
        id: event.id,
        kind: "venue",
        title: event.title,
        detail: event.location?.trim() || query || "Venue details still needed",
        timing,
        readiness: links.length > 0 ? "ready" : "needs-details",
        note:
          event.type === "MEAL"
            ? "Searches reservation platforms and venue links from the itinerary stop."
            : "Opens the venue's booking or location pages from the itinerary stop.",
        priceHint: null,
        links,
      };
    })
    .filter((item) => item.links.length > 0);
}

function buildVenueLinks(args: {
  type: EventType;
  query: string | null;
  date: string | null;
  time: string | null;
  partySize: number;
  websiteUrl: string | null;
  mapsHref: string | null;
}): BookingLink[] {
  const links: BookingLink[] = [];

  if (args.type === "MEAL" && args.query) {
    const openTable = new URL("https://www.opentable.com/s/");
    openTable.searchParams.set("term", args.query);
    openTable.searchParams.set("covers", String(args.partySize));
    if (args.date) openTable.searchParams.set("date", args.date);
    if (args.time) openTable.searchParams.set("time", args.time);
    links.push({
      label: "Search on OpenTable",
      href: openTable.toString(),
      provider: "OpenTable",
    });
  }

  if (args.websiteUrl?.trim()) {
    links.push({
      label: args.type === "MEAL" ? "Venue website" : "Official site",
      href: withHttps(args.websiteUrl),
      provider: "Official site",
    });
  }

  if (args.mapsHref) {
    links.push({
      label: "Open in Google Maps",
      href: args.mapsHref,
      provider: "Google Maps",
    });
  }

  return links;
}

async function withTravelPayoutsPrice(draft: FlightDraft): Promise<FlightDraft> {
  if (!travelPayoutsEnabled()) return draft;
  if (!draft.originCode || !draft.destinationCode || !draft.departDate) return draft;

  const url = new URL("https://api.travelpayouts.com/v1/prices/cheap");
  url.searchParams.set("origin", draft.originCode);
  url.searchParams.set("destination", draft.destinationCode);
  url.searchParams.set("depart_date", draft.departDate);
  url.searchParams.set("currency", "usd");
  url.searchParams.set("token", process.env.TRAVELPAYOUTS_TOKEN!.trim());

  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return draft;

    const json = (await res.json()) as TravelPayoutsPriceResponse;
    const price = firstTravelPayoutsPrice(json, draft.destinationCode);
    if (price == null) return draft;

    return {
      ...draft,
      priceHint: `${formatUsd(price)} from Travelpayouts cache`,
      links: [
        {
          label: "Search with live fare context",
          href: draft.links[0]?.href ?? "",
          provider: "Travelpayouts",
        },
        ...draft.links.filter((link) => link.href.trim() !== ""),
      ].filter((link) => link.href.trim() !== ""),
    };
  } catch {
    return draft;
  }
}

function firstTravelPayoutsPrice(
  response: TravelPayoutsPriceResponse,
  destinationCode: string,
): number | null {
  const bucket = response.data?.[destinationCode];
  if (!bucket) return null;
  const firstHit = Object.values(bucket)[0];
  return typeof firstHit?.price === "number" ? firstHit.price : null;
}

function inferFlightCodes(event: BookingEventInput): {
  originCode: string | null;
  destinationCode: string | null;
} {
  let originCode = normalizeIata(event.departureAirportCode);
  let destinationCode = normalizeIata(event.arrivalAirportCode);
  const inferred = extractIataCodes([
    event.title,
    event.location,
    event.departureAirportName,
    event.arrivalAirportName,
  ]);

  if (!originCode && inferred.length >= 2) {
    originCode = inferred[0];
  }
  if (!destinationCode) {
    destinationCode = inferred.at(-1) ?? null;
  }

  if (originCode === destinationCode) {
    originCode = null;
  }

  return { originCode, destinationCode };
}

function normalizeIata(value: string | null | undefined): string | null {
  const trimmed = value?.trim().toUpperCase();
  return trimmed && /^[A-Z]{3}$/.test(trimmed) ? trimmed : null;
}

function extractIataCodes(values: Array<string | null | undefined>): string[] {
  const codes: string[] = [];

  for (const value of values) {
    if (!value) continue;
    const matches = value.match(/\b[A-Z]{3}\b/g) ?? [];
    for (const match of matches) {
      if (!codes.includes(match)) codes.push(match);
    }
  }

  return codes;
}

function bestLodgingQuery(event: BookingEventInput): string | null {
  const location = event.location?.trim();
  if (location) return location;
  const cleanedTitle = stripLead(event.title, ["check-in", "stay", "hotel"]);
  return cleanedTitle || null;
}

function bestVenueQuery(event: BookingEventInput): string | null {
  const location = event.location?.trim();
  if (location) return location;
  return event.title.trim() || null;
}

function stripLead(value: string, prefixes: string[]): string {
  let next = value.trim();
  for (const prefix of prefixes) {
    next = next.replace(new RegExp(`^${escapeRegExp(prefix)}\\s*[—:-]?\\s*`, "i"), "");
  }
  return next.trim();
}

function buildMapsHref(event: BookingEventInput): string | null {
  return mapsHrefForPlace({
    googleMapsUrl: event.googleMapsUrl,
    googlePlaceId: event.googlePlaceId,
    title: event.title,
    location: event.location,
    lat: event.lat,
    lng: event.lng,
  });
}

function nextDefinedHotelDate(day: BookingDayInput | null): Date | null {
  if (!day) return null;
  const hotelEvent = day.events.find((event) => event.type === "HOTEL");
  return firstDefinedDate([hotelEvent?.startsAt ?? null, day.date]);
}

function firstDefinedDate(values: Array<Date | null | undefined>): Date | null {
  for (const value of values) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  }
  return null;
}

function lastDefinedDate(values: Array<Date | null | undefined>): Date | null {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    const value = values[index];
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  }
  return null;
}

function firstLaterDate(base: Date | null, candidates: Array<Date | null | undefined>): Date | null {
  if (!base) return null;
  for (const candidate of candidates) {
    if (candidate instanceof Date && !Number.isNaN(candidate.getTime()) && candidate > base) {
      return candidate;
    }
  }
  return null;
}

function addDays(value: Date | null, amount: number): Date | null {
  if (!value) return null;
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

function toIsoDate(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

function formatTiming(start: Date | null, end: Date | null, fallbackDate: Date | null): string | null {
  if (!start && !end && !fallbackDate) return null;
  if (start && end) {
    return `${formatDateLabel(start)} ${formatTimeLabel(start)} - ${formatTimeLabel(end)}`;
  }
  if (start) {
    return `${formatDateLabel(start)} ${formatTimeLabel(start)}`;
  }
  if (fallbackDate) {
    return formatDateLabel(fallbackDate);
  }
  return null;
}

function formatMealTiming(event: BookingEventInput, fallbackDate: Date | null): string | null {
  const date = firstDefinedDate([event.startsAt, fallbackDate]);
  if (!date) return null;
  return `${formatDateLabel(date)} at ${mealSearchTime(event) ?? "18:30"}`;
}

function mealSearchTime(event: BookingEventInput): string | null {
  if (event.startsAt) {
    return `${String(event.startsAt.getUTCHours()).padStart(2, "0")}:${String(
      event.startsAt.getUTCMinutes(),
    ).padStart(2, "0")}`;
  }

  const source = `${event.title} ${event.description ?? ""}`.toLowerCase();
  if (source.includes("breakfast")) return "09:00";
  if (source.includes("brunch")) return "11:00";
  if (source.includes("lunch")) return "13:00";
  if (source.includes("cocktail") || source.includes("drinks") || source.includes("club")) {
    return "21:00";
  }
  if (source.includes("dinner") || source.includes("reception")) return "19:00";
  return "18:30";
}

function formatDateLabel(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(value);
}

function formatTimeLabel(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function clampCount(value: number | undefined, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function travelPayoutsEnabled(): boolean {
  return Boolean(process.env.TRAVELPAYOUTS_TOKEN?.trim());
}
