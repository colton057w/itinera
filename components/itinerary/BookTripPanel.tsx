import type { EventType } from "@prisma/client";
import {
  flightSearchUrl,
  hotelSearchUrl,
  activitySearchUrl,
} from "@/lib/booking-links";

type TripEvent = {
  type: EventType;
  title: string;
  location?: string | null;
  lat?: number | null;
  lng?: number | null;
  departureAirportCode?: string | null;
  arrivalAirportCode?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
};

type TripDay = {
  date?: Date | null;
  events: TripEvent[];
};

function extractFlightSearch(days: TripDay[]) {
  for (const day of days) {
    for (const ev of day.events) {
      if (ev.type !== "FLIGHT") continue;
      const url = flightSearchUrl({
        departureAirportCode: ev.departureAirportCode,
        arrivalAirportCode: ev.arrivalAirportCode,
        departureDate: ev.startsAt ?? day.date,
      });
      if (url) {
        return {
          label: `${ev.departureAirportCode ?? "?"} → ${ev.arrivalAirportCode ?? "?"}`,
          url,
        };
      }
    }
  }
  return null;
}

function extractHotelSearch(days: TripDay[]) {
  for (const day of days) {
    for (const ev of day.events) {
      if (ev.type !== "HOTEL") continue;
      const firstDate = ev.startsAt ?? day.date;
      const url = hotelSearchUrl({
        location: ev.location,
        title: ev.title,
        checkIn: firstDate,
        checkOut: ev.endsAt,
        lat: ev.lat,
        lng: ev.lng,
      });
      if (url) {
        return { label: ev.title, url };
      }
    }
  }

  const destination = inferDestination(days);
  if (!destination) return null;
  const firstDay = days.find((d) => d.date);
  const lastDay = [...days].reverse().find((d) => d.date);
  const url = hotelSearchUrl({
    location: destination,
    checkIn: firstDay?.date,
    checkOut: lastDay?.date,
  });
  if (!url) return null;
  return { label: destination, url };
}

function inferDestination(days: TripDay[]): string | null {
  for (const day of days) {
    for (const ev of day.events) {
      if (ev.location?.trim()) return ev.location.trim();
    }
  }
  return null;
}

function extractActivitySearch(days: TripDay[]) {
  const destination = inferDestination(days);
  if (!destination) return null;
  const firstDay = days.find((d) => d.date);
  const url = activitySearchUrl({
    location: destination,
    date: firstDay?.date,
  });
  if (!url) return null;
  return { label: destination, url };
}

type QuickLink = { icon: string; label: string; sub: string; href: string; color: string };

export function BookTripPanel({
  days,
  className,
}: {
  days: TripDay[];
  className?: string;
}) {
  const flight = extractFlightSearch(days);
  const hotel = extractHotelSearch(days);
  const activity = extractActivitySearch(days);

  const links: QuickLink[] = [];

  if (flight) {
    links.push({
      icon: "✈",
      label: "Find flights",
      sub: flight.label,
      href: flight.url,
      color:
        "border-sky-200 bg-sky-50/80 text-sky-900 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100 dark:hover:bg-sky-950/60",
    });
  }

  if (hotel) {
    links.push({
      icon: "🏨",
      label: "Find hotels",
      sub: hotel.label,
      href: hotel.url,
      color:
        "border-violet-200 bg-violet-50/80 text-violet-900 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-100 dark:hover:bg-violet-950/60",
    });
  }

  if (activity) {
    links.push({
      icon: "🎯",
      label: "Find tours",
      sub: activity.label,
      href: activity.url,
      color:
        "border-orange-200 bg-orange-50/80 text-orange-900 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-100 dark:hover:bg-orange-950/60",
    });
  }

  if (links.length === 0) return null;

  return (
    <aside
      className={
        className ??
        "rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
      }
    >
      <p className="text-sm font-semibold text-neutral-900 dark:text-zinc-100">
        Book this trip
      </p>
      <p className="mt-0.5 text-xs text-neutral-500 dark:text-zinc-500">
        One-click search across booking partners
      </p>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <a
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors ${l.color}`}
            >
              <span className="text-lg" aria-hidden>
                {l.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold leading-tight">
                  {l.label}
                </span>
                <span className="block truncate text-xs opacity-70">
                  {l.sub}
                </span>
              </span>
              <span className="shrink-0 text-xs opacity-50" aria-hidden>
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-neutral-500 dark:text-zinc-500">
        Searches open in partner sites. Itinera may earn a commission at no extra
        cost to you.
      </p>
    </aside>
  );
}
