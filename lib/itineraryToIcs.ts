import { createEvents, type EventAttributes } from "ics";

export type ItineraryCalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startTime: string | null;
  endTime: string | null;
  dayDate: string | null;
  dayIndex: number;
  dayLabel: string;
};

type BuildIcsInput = {
  itineraryTitle: string;
  events: ItineraryCalendarEvent[];
};

type DateArray = [number, number, number];
type DateTimeArray = [number, number, number, number, number];

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toAllDayDateArray(date: Date): DateArray {
  return [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];
}

function toDateTimeArray(date: Date): DateTimeArray {
  return [
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
  ];
}

function toFileSafeSlug(title: string): string {
  return (
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "itinerary"
  );
}

function resolveEventDescription(event: ItineraryCalendarEvent): string | undefined {
  const chunks: string[] = [];
  chunks.push(`Day: ${event.dayLabel}`);
  if (event.description && event.description.trim()) {
    chunks.push(`Creator notes: ${event.description.trim()}`);
  }
  return chunks.length ? chunks.join("\n\n") : undefined;
}

function mapToIcsEvent(
  event: ItineraryCalendarEvent,
  fallbackBaseDate: Date,
): EventAttributes {
  const title = event.title.trim() || "Untitled event";
  const description = resolveEventDescription(event);
  const location = event.location?.trim() || undefined;

  const startDate = event.startTime ? new Date(event.startTime) : null;
  const endDate = event.endTime ? new Date(event.endTime) : null;

  if (startDate && !Number.isNaN(startDate.getTime())) {
    if (endDate && !Number.isNaN(endDate.getTime())) {
      return {
        title,
        description,
        location,
        start: toDateTimeArray(startDate),
        end: toDateTimeArray(endDate),
        startInputType: "utc",
        endInputType: "utc",
        startOutputType: "utc",
        endOutputType: "utc",
      };
    }

    return {
      title,
      description,
      location,
      start: toDateTimeArray(startDate),
      duration: { hours: 1 },
      startInputType: "utc",
      startOutputType: "utc",
    };
  }

  const dayDate = event.dayDate ? new Date(event.dayDate) : null;
  const sourceDate =
    dayDate && !Number.isNaN(dayDate.getTime())
      ? dayDate
      : addDays(fallbackBaseDate, event.dayIndex);

  return {
    title,
    description,
    location,
    start: toAllDayDateArray(sourceDate),
    end: toAllDayDateArray(addDays(sourceDate, 1)),
  };
}

export function createItineraryIcs({ itineraryTitle, events }: BuildIcsInput): {
  fileName: string;
  icsValue: string;
} {
  if (!events.length) {
    throw new Error("No events available to export.");
  }

  const firstDated = events
    .map((event) => event.dayDate)
    .find((value): value is string => Boolean(value));
  const fallbackBaseDate = firstDated ? new Date(firstDated) : new Date();

  const calendarEvents = events.map((event) => mapToIcsEvent(event, fallbackBaseDate));
  const { error, value } = createEvents(calendarEvents, {
    calName: `${itineraryTitle} itinerary`,
    productId: "itinera/itinerary-export",
  });

  if (error || !value) {
    throw error ?? new Error("Unable to generate calendar file.");
  }

  return {
    fileName: `${toFileSafeSlug(itineraryTitle)}.ics`,
    icsValue: value,
  };
}
