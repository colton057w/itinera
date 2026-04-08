import type { MarketingShowcaseData } from "@/lib/marketing-showcase-types";
import { prisma } from "@/lib/prisma";
import { fetchAviationStackFlight } from "@/lib/aviationstack";

function isDbConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; name?: string; message?: string };
  if (e.code === "P1001") return true;
  if (e.code === "P2021") return true;
  if (e.name === "PrismaClientInitializationError") return true;
  if (typeof e.message === "string" && e.message.includes("Can't reach database")) {
    return true;
  }
  return false;
}

export function guessFlightIata(title: string, airline: string | null): string | null {
  const combined = `${title} ${airline ?? ""}`.toUpperCase();
  const spaced = combined.match(/\b([A-Z]{2})\s*(\d{1,4})\b/);
  if (spaced) return `${spaced[1]}${spaced[2]}`;
  const compact = combined.match(/\b([A-Z]{2}\d{2,4})\b/);
  return compact ? compact[1] : null;
}

function formatWhen(d: Date | null | undefined): string | null {
  if (!d || Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

function legLabel(km: number): string {
  const mins = Math.max(5, Math.round((km / 32) * 60));
  const dist = km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
  return `${dist} · ~${mins} min`;
}

const DEAL_FALLBACK: MarketingShowcaseData["deals"] = [
  {
    headline: "Lisbon",
    subline: "Add deals to the database with prisma db seed",
    tag: "Sample",
    priceHint: "Watchlist ready",
    source: "fallback",
  },
  {
    headline: "Tokyo",
    subline: "Add rows to MarketFlightDeal or wire your own fare provider",
    tag: "Sample",
    priceHint: "DB-ready",
    source: "fallback",
  },
];

async function loadDeals(): Promise<MarketingShowcaseData["deals"]> {
  try {
    const rows = await prisma.marketFlightDeal.findMany({
      orderBy: [{ sortOrder: "asc" }, { fetchedAt: "desc" }],
      take: 12,
    });
    if (rows.length === 0) return DEAL_FALLBACK;
    return rows.map((d) => ({
      headline: d.headline,
      subline: d.subline,
      tag: d.tag,
      priceHint: d.priceHint,
      source: d.source,
    }));
  } catch (e) {
    if (isDbConnectionError(e)) return DEAL_FALLBACK;
    throw e;
  }
}

export async function loadMarketingShowcase(userId: string | null): Promise<MarketingShowcaseData> {
  const deals = await loadDeals();

  const base = (): MarketingShowcaseData => ({
    isLoggedIn: Boolean(userId),
    collaboration: { trips: [], guestComments: [] },
    reservations: { items: [] },
    flights: { items: [] },
    mapRoutes: null,
    deals,
  });

  if (!userId) {
    return base();
  }

  try {
    const [trips, guestComments, bookingEvents, flightEvents, geoEvents] = await Promise.all([
      prisma.itinerary.findMany({
        where: { ownerId: userId },
        orderBy: { updatedAt: "desc" },
        take: 3,
        select: {
          title: true,
          slug: true,
          updatedAt: true,
          _count: { select: { forks: true } },
        },
      }),
      prisma.comment.findMany({
        where: {
          itinerary: { ownerId: userId },
          authorId: { not: userId },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          body: true,
          createdAt: true,
          author: { select: { name: true } },
          itinerary: { select: { title: true } },
        },
      }),
      prisma.event.findMany({
        where: {
          type: { in: ["FLIGHT", "HOTEL"] },
          day: { itinerary: { ownerId: userId } },
        },
        take: 40,
        select: {
          type: true,
          title: true,
          location: true,
          startsAt: true,
          departureAirportCode: true,
          arrivalAirportCode: true,
          day: {
            select: {
              date: true,
              label: true,
              itinerary: { select: { title: true, slug: true } },
            },
          },
        },
      }),
      prisma.event.findMany({
        where: {
          type: "FLIGHT",
          day: { itinerary: { ownerId: userId } },
        },
        take: 40,
        select: {
          title: true,
          airline: true,
          departureAirportCode: true,
          arrivalAirportCode: true,
          startsAt: true,
          day: { select: { itinerary: { select: { slug: true } } } },
        },
      }),
      prisma.event.findMany({
        where: {
          lat: { not: null },
          lng: { not: null },
          day: { itinerary: { ownerId: userId } },
        },
        orderBy: [{ day: { dayIndex: "asc" } }, { eventIndex: "asc" }],
        take: 80,
        select: {
          title: true,
          lat: true,
          lng: true,
          day: {
            select: {
              itinerary: { select: { title: true, slug: true } },
            },
          },
        },
      }),
    ]);

    const reservationItems = bookingEvents
      .map((ev) => {
        const trip = ev.day.itinerary;
        const when = ev.startsAt ?? ev.day.date;
        const whenLabel = formatWhen(when);
        const sortAt = when?.getTime() ?? 0;
        const detail =
          ev.type === "HOTEL"
            ? ev.location?.trim() || "Hotel stay"
            : [ev.departureAirportCode, ev.arrivalAirportCode].filter(Boolean).join(" → ") ||
              (ev.location?.trim() || "Flight");
        return {
          kind: ev.type === "HOTEL" ? ("hotel" as const) : ("flight" as const),
          title: ev.title,
          tripTitle: trip.title,
          tripSlug: trip.slug,
          whenLabel,
          detail,
          sortAt,
        };
      })
      .sort((a, b) => a.sortAt - b.sortAt)
      .slice(0, 8)
      .map(({ sortAt: _s, ...rest }) => rest);

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const upcomingFlights = flightEvents
      .filter((f) => {
        const t = f.startsAt?.getTime() ?? 0;
        return t >= now - dayMs;
      })
      .sort((a, b) => (a.startsAt?.getTime() ?? 0) - (b.startsAt?.getTime() ?? 0))
      .slice(0, 3);

    const flightItems = await Promise.all(
      upcomingFlights.map(async (f) => {
        const iata = guessFlightIata(f.title, f.airline);
        const live = iata ? await fetchAviationStackFlight(iata) : null;
        return {
          title: f.title,
          route: `${f.departureAirportCode ?? "?"} → ${f.arrivalAirportCode ?? "?"}`,
          whenLabel: formatWhen(f.startsAt),
          tripSlug: f.day.itinerary.slug,
          flightIata: iata,
          live,
        };
      }),
    );

    type GeoGroup = {
      title: string;
      slug: string;
      pts: { title: string; lat: number; lng: number }[];
    };
    const bySlug = new Map<string, GeoGroup>();
    for (const ev of geoEvents) {
      if (ev.lat == null || ev.lng == null) continue;
      const it = ev.day.itinerary;
      const g = bySlug.get(it.slug) ?? { title: it.title, slug: it.slug, pts: [] };
      g.pts.push({ title: ev.title, lat: ev.lat, lng: ev.lng });
      bySlug.set(it.slug, g);
    }

    let best: GeoGroup | null = null;
    for (const g of bySlug.values()) {
      if (g.pts.length >= 3 && (!best || g.pts.length > best.pts.length)) {
        best = g;
      }
    }

    let mapRoutes: MarketingShowcaseData["mapRoutes"] = null;
    if (best && best.pts.length >= 2) {
      const legs: { from: string; to: string; label: string }[] = [];
      for (let i = 0; i < best.pts.length - 1; i++) {
        const a = best.pts[i]!;
        const b = best.pts[i + 1]!;
        const km = haversineKm(a, b);
        legs.push({
          from: a.title,
          to: b.title,
          label: legLabel(km),
        });
      }
      mapRoutes = {
        tripTitle: best.title,
        tripSlug: best.slug,
        legs: legs.slice(0, 4),
        stopCount: best.pts.length,
      };
    }

    return {
      isLoggedIn: true,
      collaboration: {
        trips: trips.map((t) => ({
          title: t.title,
          slug: t.slug,
          updatedAt: t.updatedAt.toISOString(),
          forkCount: t._count.forks,
        })),
        guestComments: guestComments.map((c) => {
          const body = c.body.trim();
          return {
            itineraryTitle: c.itinerary.title,
            authorName: c.author.name,
            excerpt: body.length > 120 ? `${body.slice(0, 120)}…` : body,
            createdAt: c.createdAt.toISOString(),
          };
        }),
      },
      reservations: { items: reservationItems },
      flights: { items: flightItems },
      mapRoutes,
      deals,
    };
  } catch (e) {
    if (isDbConnectionError(e)) {
      return base();
    }
    throw e;
  }
}
