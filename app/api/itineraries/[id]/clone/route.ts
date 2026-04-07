import { TripKind, Visibility } from "@prisma/client";
import { NextResponse } from "next/server";
import { shiftItineraryDatesForClone, parseIsoDateOnly } from "@/lib/cloneDateShift";
import { computeHotScore } from "@/lib/hotScore";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";
import { slugFromTitle } from "@/lib/slug";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: sourceId } = await context.params;
  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    visibility?: string;
    startDate?: string;
  };

  const startRaw = body.startDate?.trim();
  if (!startRaw) {
    return NextResponse.json({ error: "startDate is required (YYYY-MM-DD)" }, { status: 400 });
  }
  const newTripStart = parseIsoDateOnly(startRaw);
  if (!newTripStart) {
    return NextResponse.json({ error: "Invalid startDate" }, { status: 400 });
  }

  const source = await prisma.itinerary.findUnique({
    where: { id: sourceId },
    include: {
      owner: { select: { name: true } },
      tags: true,
      days: {
        orderBy: { dayIndex: "asc" },
        include: {
          events: {
            orderBy: { eventIndex: "asc" },
            include: { media: { orderBy: { sortOrder: "asc" } } },
          },
        },
      },
    },
  });

  if (!source) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = source.ownerId === session.user.id;
  if (source.visibility === Visibility.PRIVATE && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const newTitle = body.title?.trim() || `${source.title} (copy)`;
  const slug = slugFromTitle(newTitle);
  const visibility =
    body.visibility === "PRIVATE"
      ? Visibility.PRIVATE
      : body.visibility === "PUBLIC"
        ? Visibility.PUBLIC
        : source.visibility;

  const sourceDaysForShift = source.days.map((d) => ({
    dayIndex: d.dayIndex,
    date: d.date,
    events: d.events.map((ev) => ({
      startsAt: ev.startsAt,
      endsAt: ev.endsAt,
    })),
  }));

  const shifted = shiftItineraryDatesForClone(sourceDaysForShift, newTripStart);
  const shiftedByDay = new Map(shifted.map((s) => [s.dayIndex, s]));

  const now = new Date();
  const hotScore = computeHotScore(0, now);
  const cloneSourceAuthorName = source.owner.name?.trim() || "Another planner";

  try {
    const created = await prisma.$transaction(async (tx) => {
      return tx.itinerary.create({
        data: {
          ownerId: session.user!.id,
          title: newTitle,
          slug,
          summary: source.summary,
          coverImageUrl: source.coverImageUrl,
          visibility,
          tripKind: source.tripKind ?? TripKind.VACATION,
          forkedFromId: source.id,
          forkedAt: now,
          cloneSourceAuthorName,
          voteScore: 0,
          hotScore,
          tags: {
            create: source.tags.map((it) => ({
              tag: { connect: { id: it.tagId } },
            })),
          },
          days: {
            create: source.days.map((day) => {
              const s = shiftedByDay.get(day.dayIndex);
              if (!s) {
                throw new Error(`Missing shift for day ${day.dayIndex}`);
              }
              return {
                dayIndex: day.dayIndex,
                label: day.label,
                date: s.date,
                events: {
                  create: day.events.map((ev, i) => {
                    const se = s.events[i];
                    if (!se) {
                      throw new Error(`Missing shift for event ${i} on day ${day.dayIndex}`);
                    }
                    return {
                      eventIndex: ev.eventIndex,
                      type: ev.type,
                      title: ev.title,
                      description: ev.description,
                      location: ev.location,
                      lat: ev.lat,
                      lng: ev.lng,
                      googlePlaceId: ev.googlePlaceId,
                      googleMapsUrl: ev.googleMapsUrl,
                      websiteUrl: ev.websiteUrl,
                      startsAt: se.startsAt,
                      endsAt: se.endsAt,
                      ratingStars: ev.ratingStars,
                      airline: ev.airline,
                      departureAirportCode: ev.departureAirportCode,
                      arrivalAirportCode: ev.arrivalAirportCode,
                      departureAirportName: ev.departureAirportName,
                      arrivalAirportName: ev.arrivalAirportName,
                      coverImageUrl: ev.coverImageUrl,
                      estimatedCostMinor: ev.estimatedCostMinor,
                      currency: ev.currency,
                      media: {
                        create: ev.media.map((m) => ({
                          url: m.url,
                          width: m.width,
                          height: m.height,
                          sortOrder: m.sortOrder,
                        })),
                      },
                    };
                  }),
                },
              };
            }),
          },
        },
      });
    });

    return NextResponse.json(
      { id: created.id, slug: created.slug, forkedFromId: source.id },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Clone failed" }, { status: 500 });
  }
}
