import { Visibility } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuestPortal, type GuestEventPayload } from "@/components/guest/GuestPortal";
import { prisma } from "@/lib/prisma";
import { isWeddingStyleTrip } from "@/lib/weddingItinerary";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const it = await prisma.itinerary.findUnique({
    where: { slug },
    select: { title: true },
  });
  return { title: it ? `Guests · ${it.title}` : "Guest view" };
}

export default async function GuestItineraryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const it = await prisma.itinerary.findUnique({
    where: { slug },
    include: {
      tags: { include: { tag: true } },
      days: {
        orderBy: { dayIndex: "asc" },
        include: {
          events: {
            orderBy: { eventIndex: "asc" },
            include: {
              guestPhotos: {
                orderBy: { createdAt: "desc" },
                take: 24,
              },
            },
          },
        },
      },
    },
  });

  if (!it) notFound();
  if (it.visibility !== Visibility.PUBLIC) notFound();

  const tagNames = it.tags.map((t) => t.tag.name);
  if (
    !isWeddingStyleTrip({
      tripKind: it.tripKind,
      tagNames,
      title: it.title,
    })
  ) {
    notFound();
  }

  const events: GuestEventPayload[] = [];
  for (const day of it.days) {
    const dayLabel = day.label ?? `Day ${day.dayIndex + 1}`;
    for (const ev of day.events) {
      events.push({
        id: ev.id,
        title: ev.title,
        type: ev.type,
        location: ev.location,
        googleMapsUrl: ev.googleMapsUrl,
        googlePlaceId: ev.googlePlaceId,
        lat: ev.lat,
        lng: ev.lng,
        dayLabel,
        startsAt: ev.startsAt?.toISOString() ?? null,
        endsAt: ev.endsAt?.toISOString() ?? null,
        guestPhotos: ev.guestPhotos.map((p) => ({
          id: p.id,
          url: p.url,
          caption: p.caption,
          authorName: p.authorName,
        })),
      });
    }
  }

  const tripStart = it.days[0]?.date?.toISOString() ?? null;

  return (
    <div>
      <div className="border-b border-neutral-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-950">
        <Link
          href={`/itineraries/${it.slug}`}
          className="text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Full itinerary
        </Link>
      </div>
      <GuestPortal
        itineraryId={it.id}
        title={it.title}
        tripStart={tripStart}
        events={events}
      />
    </div>
  );
}
