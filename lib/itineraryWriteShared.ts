import { EventType, type Prisma } from "@prisma/client";

export const EVENT_TYPES = new Set<string>(Object.values(EventType));

export type EventInput = {
  eventIndex: number;
  type: string;
  title: string;
  description: string | null;
  location: string | null;
  coverImageUrl?: string | null;
  googlePlaceId?: string | null;
  googleMapsUrl?: string | null;
  websiteUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
  ratingStars?: number | null;
  airline?: string | null;
  departureAirportCode?: string | null;
  arrivalAirportCode?: string | null;
  departureAirportName?: string | null;
  arrivalAirportName?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
};

export type DayInput = {
  dayIndex: number;
  label: string | null;
  date: string | null;
  events: EventInput[];
};

export function normalizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of raw) {
    const n = String(t)
      .trim()
      .replace(/^#+/, "")
      .toLowerCase();
    if (!n || n.length > 48 || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
    if (out.length >= 24) break;
  }
  return out;
}

export function firstCoverFromDays(days: DayInput[]): string | null {
  for (const d of days) {
    for (const ev of d.events ?? []) {
      if (ev.coverImageUrl) return ev.coverImageUrl;
    }
  }
  return null;
}

function parseRatingStars(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (i < 1 || i > 5) throw new Error("ratingStars must be between 1 and 5");
  return i;
}

function normIata(raw: string | null | undefined): string | null {
  const t = raw?.trim().toUpperCase().replace(/[^A-Z]/g, "");
  if (!t) return null;
  return t.length <= 3 ? t : t.slice(0, 3);
}

function parseIsoDate(raw: string | null | undefined): Date | null {
  if (!raw?.trim()) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function buildDayCreates(
  days: DayInput[],
): Prisma.DayCreateWithoutItineraryInput[] {
  return days.map((day) => ({
    dayIndex: day.dayIndex,
    label: day.label,
    date: day.date ? new Date(day.date) : null,
    events: {
      create: (day.events ?? []).map((ev) => {
        if (!EVENT_TYPES.has(ev.type)) {
          throw new Error(`Invalid event type: ${ev.type}`);
        }
        const t = ev.title?.trim();
        if (!t) throw new Error("Each event needs a title");
        const isFlight = ev.type === "FLIGHT";
        const ratingStars = parseRatingStars(ev.ratingStars);
        const media = ev.coverImageUrl
          ? {
              create: [{ url: ev.coverImageUrl, sortOrder: 0 }],
            }
          : undefined;
        return {
          eventIndex: ev.eventIndex,
          type: ev.type as EventType,
          title: t,
          description: ev.description?.trim() || null,
          location: ev.location?.trim() || null,
          coverImageUrl: ev.coverImageUrl || null,
          googlePlaceId: ev.googlePlaceId?.trim() || null,
          googleMapsUrl: ev.googleMapsUrl?.trim() || null,
          websiteUrl: ev.websiteUrl?.trim() || null,
          lat: ev.lat ?? null,
          lng: ev.lng ?? null,
          ratingStars,
          airline: isFlight ? ev.airline?.trim() || null : null,
          departureAirportCode: isFlight ? normIata(ev.departureAirportCode) : null,
          arrivalAirportCode: isFlight ? normIata(ev.arrivalAirportCode) : null,
          departureAirportName: isFlight
            ? ev.departureAirportName?.trim() || null
            : null,
          arrivalAirportName: isFlight ? ev.arrivalAirportName?.trim() || null : null,
          startsAt: isFlight ? parseIsoDate(ev.startsAt) : null,
          endsAt: isFlight ? parseIsoDate(ev.endsAt) : null,
          media,
        };
      }),
    },
  }));
}

export async function upsertTagsAndCollectIds(
  tx: Prisma.TransactionClient,
  tagNames: string[],
): Promise<string[]> {
  const tagIds: string[] = [];
  for (const name of tagNames) {
    const tag = await tx.tag.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    tagIds.push(tag.id);
  }
  return tagIds;
}
