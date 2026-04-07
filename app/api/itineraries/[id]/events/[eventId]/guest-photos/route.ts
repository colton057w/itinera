import { Visibility, TripKind } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";
import { isWeddingStyleTrip } from "@/lib/weddingItinerary";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string; eventId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: itineraryId, eventId } = await context.params;
  const body = (await req.json().catch(() => ({}))) as {
    url?: string;
    caption?: string;
    authorName?: string;
  };

  const url = body.url?.trim();
  if (!url || !/^https:\/\//i.test(url)) {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, day: { itineraryId } },
    include: {
      day: {
        include: {
          itinerary: {
            include: { tags: { include: { tag: true } } },
          },
        },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const it = event.day.itinerary;
  if (it.visibility !== Visibility.PUBLIC) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tagNames = it.tags.map((t) => t.tag.name);
  if (
    !isWeddingStyleTrip({
      tripKind: it.tripKind as TripKind,
      tagNames,
      title: it.title,
    })
  ) {
    return NextResponse.json(
      { error: "Guest photo wall is only for wedding-style public trips" },
      { status: 403 },
    );
  }

  const authorName =
    session.user.name?.trim() || body.authorName?.trim() || "Guest";

  const photo = await prisma.guestEventPhoto.create({
    data: {
      eventId: event.id,
      url,
      caption: body.caption?.trim() || null,
      authorName,
    },
  });

  return NextResponse.json({
    id: photo.id,
    url: photo.url,
    caption: photo.caption,
    authorName: photo.authorName,
  });
}
