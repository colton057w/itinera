import type { DayDraft } from "@/components/itinerary/storybook/types";
import { parseMoneyToMinor } from "@/lib/formatMoney";

/** Parse "a, b, #c" → normalized tag strings */
export function parseTagsInput(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[,\n]+/)) {
    const t = part.trim().replace(/^#+/, "").toLowerCase();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length > 24) break;
  }
  return out;
}

/** Client → API body for POST / PATCH */
export function buildItineraryRequestBody(
  title: string,
  visibility: "PUBLIC" | "PRIVATE",
  tripKind: "VACATION" | "WEDDING_EVENT",
  tags: string[],
  days: DayDraft[],
) {
  return {
    title: title.trim(),
    visibility,
    tripKind,
    tags,
    days: days.map((day, dayIndex) => ({
      dayIndex,
      label: day.label || null,
      date: day.date ? new Date(day.date).toISOString() : null,
      events: day.events.map((ev, eventIndex) => {
        const flightTitle =
          ev.type === "FLIGHT" &&
          ev.departureAirportCode &&
          ev.arrivalAirportCode &&
          !ev.title.trim()
            ? `${ev.departureAirportCode} → ${ev.arrivalAirportCode}`
            : ev.title.trim() || "Untitled";
        return {
          eventIndex,
          type: ev.type,
          title: flightTitle,
          description: ev.description || null,
          location: ev.location || null,
          coverImageUrl: ev.coverImageUrl || null,
          googlePlaceId: ev.googlePlaceId || null,
          googleMapsUrl: ev.googleMapsUrl || null,
          websiteUrl: ev.websiteUrl || null,
          lat: ev.lat ?? null,
          lng: ev.lng ?? null,
          ratingStars: ev.ratingStars,
          airline: ev.type === "FLIGHT" ? ev.airline.trim() || null : null,
          departureAirportCode:
            ev.type === "FLIGHT" ? ev.departureAirportCode.trim() || null : null,
          arrivalAirportCode:
            ev.type === "FLIGHT" ? ev.arrivalAirportCode.trim() || null : null,
          departureAirportName:
            ev.type === "FLIGHT" ? ev.departureAirportName.trim() || null : null,
          arrivalAirportName:
            ev.type === "FLIGHT" ? ev.arrivalAirportName.trim() || null : null,
          startsAt:
            ev.type === "FLIGHT" && ev.departureAt
              ? new Date(ev.departureAt).toISOString()
              : null,
          endsAt:
            ev.type === "FLIGHT" && ev.arrivalAt
              ? new Date(ev.arrivalAt).toISOString()
              : null,
          estimatedCostMinor: parseMoneyToMinor(ev.estimatedCostDollars.trim() || null),
          currency: (ev.currency || "USD").trim().toUpperCase() || "USD",
        };
      }),
    })),
  };
}
