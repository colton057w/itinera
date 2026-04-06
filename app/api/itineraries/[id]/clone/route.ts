import { Visibility } from "@prisma/client";
import { NextResponse } from "next/server";
import { computeHotScore } from "@/lib/hotScore";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";
import { slugFromTitle } from "@/lib/slug";

type RemapDay = { sourceDayIndex: number; date: string };

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
    remapDays?: RemapDay[];
  };

  const source = await prisma.itinerary.findUnique({
    where: { id: sourceId },
    include: {
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

  const remap = new Map<number, Date>();
  for (const r of body.remapDays ?? []) {
    remap.set(r.sourceDayIndex, new Date(r.date));
  }

  const now = new Date();
  const hotScore = computeHotScore(0, now);

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
          forkedFromId: source.id,
          forkedAt: now,
          voteScore: 0,
          hotScore,
          tags: {
            create: source.tags.map((it) => ({
              tag: { connect: { id: it.tagId } },
            })),
          },
          days: {
            create: source.days.map((day) => ({
              dayIndex: day.dayIndex,
              label: day.label,
              date: remap.get(day.dayIndex) ?? null,
              events: {
                create: day.events.map((ev) => ({
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
                  startsAt: ev.startsAt,
                  endsAt: ev.endsAt,
                  coverImageUrl: ev.coverImageUrl,
                  media: {
                    create: ev.media.map((m) => ({
                      url: m.url,
                      width: m.width,
                      height: m.height,
                      sortOrder: m.sortOrder,
                    })),
                  },
                })),
              },
            })),
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
