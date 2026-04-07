import type { EventType } from "@prisma/client";
import type { DayDraft, EventDraft, StoryKind } from "@/components/itinerary/storybook/types";
import { newId } from "@/components/itinerary/storybook/types";

function toDatetimeLocal(d: Date | null): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function inferStoryKind(type: EventType, title: string): StoryKind | undefined {
  if (type === "HOTEL") return "stay";
  if (type === "MEAL") return "meal";
  if (type === "ACTIVITY") {
    return title.trim().toLowerCase() === "transit" ? "transit" : "activity";
  }
  return undefined;
}

type LoadedEvent = {
  eventIndex: number;
  type: EventType;
  title: string;
  description: string | null;
  location: string | null;
  coverImageUrl: string | null;
  googlePlaceId: string | null;
  googleMapsUrl: string | null;
  websiteUrl: string | null;
  lat: number | null;
  lng: number | null;
  ratingStars: number | null;
  airline: string | null;
  departureAirportCode: string | null;
  arrivalAirportCode: string | null;
  departureAirportName: string | null;
  arrivalAirportName: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
};

type LoadedDay = {
  label: string | null;
  date: Date | null;
  dayIndex: number;
  events: LoadedEvent[];
};

function eventToDraft(ev: LoadedEvent): EventDraft {
  return {
    clientId: newId(),
    type: ev.type,
    storyKind: inferStoryKind(ev.type, ev.title),
    title: ev.title,
    description: ev.description ?? "",
    location: ev.location ?? "",
    coverImageUrl: ev.coverImageUrl ?? undefined,
    googlePlaceId: ev.googlePlaceId ?? undefined,
    googleMapsUrl: ev.googleMapsUrl ?? undefined,
    websiteUrl: ev.websiteUrl ?? undefined,
    lat: ev.lat ?? undefined,
    lng: ev.lng ?? undefined,
    ratingStars: ev.ratingStars,
    airline: ev.airline ?? "",
    departureAirportCode: ev.departureAirportCode ?? "",
    departureAirportName: ev.departureAirportName ?? "",
    arrivalAirportCode: ev.arrivalAirportCode ?? "",
    arrivalAirportName: ev.arrivalAirportName ?? "",
    departureAt: toDatetimeLocal(ev.startsAt),
    arrivalAt: toDatetimeLocal(ev.endsAt),
  };
}

export function itineraryDaysToDraft(days: LoadedDay[]): DayDraft[] {
  return [...days]
    .sort((a, b) => a.dayIndex - b.dayIndex)
    .map((day) => ({
      clientId: newId(),
      label: day.label ?? `Day ${day.dayIndex + 1}`,
      date: day.date
        ? `${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, "0")}-${String(day.date.getDate()).padStart(2, "0")}`
        : "",
      events: [...day.events]
        .sort((a, b) => a.eventIndex - b.eventIndex)
        .map((ev) => eventToDraft(ev)),
    }));
}
