import { TripKind, Visibility } from "@prisma/client";
import { NextResponse } from "next/server";
import { computeHotScore } from "@/lib/hotScore";
import type { DayInput } from "@/lib/itineraryWriteShared";
import {
  buildDayCreates,
  firstCoverFromDays,
  normalizeTags,
  upsertTagsAndCollectIds,
} from "@/lib/itineraryWriteShared";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const existing = await prisma.itinerary.findUnique({
    where: { id },
    select: {
      id: true,
      ownerId: true,
      slug: true,
      voteScore: true,
      createdAt: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await req.json()) as {
      title?: string;
      summary?: string | null;
      visibility?: string;
      tripKind?: string;
      tags?: unknown;
      days?: DayInput[];
    };

    const title = body.title?.trim();
    if (!title) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }

    const days = body.days ?? [];
    if (days.length === 0) {
      return NextResponse.json({ error: "At least one day required" }, { status: 400 });
    }

    const visibility =
      body.visibility === "PRIVATE" ? Visibility.PRIVATE : Visibility.PUBLIC;

    const tripKind =
      body.tripKind === "WEDDING_EVENT" ? TripKind.WEDDING_EVENT : TripKind.VACATION;

    const tagNames = normalizeTags(body.tags);
    const coverImageUrl = firstCoverFromDays(days);
    const hotScore = computeHotScore(existing.voteScore, existing.createdAt);

    await prisma.$transaction(async (tx) => {
      await tx.itineraryTag.deleteMany({ where: { itineraryId: id } });
      await tx.day.deleteMany({ where: { itineraryId: id } });

      const tagIds = await upsertTagsAndCollectIds(tx, tagNames);

      await tx.itinerary.update({
        where: { id },
        data: {
          title,
          summary: body.summary?.trim() || null,
          visibility,
          tripKind,
          coverImageUrl,
          hotScore,
          tags: {
            create: tagIds.map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
          },
          days: {
            create: buildDayCreates(days),
          },
        },
      });
    });

    return NextResponse.json({ id: existing.id, slug: existing.slug });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const it = await prisma.itinerary.findUnique({
    where: { id },
    select: { id: true, ownerId: true },
  });

  if (!it) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (it.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.itinerary.delete({ where: { id: it.id } });

  return NextResponse.json({ ok: true });
}
