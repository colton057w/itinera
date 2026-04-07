export type ItineraryMapPoint = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  dayLabel: string;
};

type DayInput = {
  dayIndex: number;
  label: string | null;
  events: Array<{
    id: string;
    title: string;
    lat: number | null;
    lng: number | null;
  }>;
};

/** Collect events with valid coordinates for the itinerary map. */
export function buildItineraryMapPoints(days: DayInput[]): ItineraryMapPoint[] {
  const out: ItineraryMapPoint[] = [];
  for (const day of days) {
    const dayLabel = day.label ?? `Day ${day.dayIndex + 1}`;
    for (const ev of day.events) {
      if (ev.lat == null || ev.lng == null) continue;
      if (Number.isNaN(ev.lat) || Number.isNaN(ev.lng)) continue;
      if (ev.lat < -90 || ev.lat > 90 || ev.lng < -180 || ev.lng > 180) continue;
      out.push({
        id: ev.id,
        lat: ev.lat,
        lng: ev.lng,
        title: ev.title,
        dayLabel,
      });
    }
  }
  return out;
}
