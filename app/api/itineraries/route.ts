import { Visibility } from "@prisma/client";
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
import { slugFromTitle } from "@/lib/slug";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      title?: string;
      summary?: string | null;
      visibility?: string;
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

    const tagNames = normalizeTags(body.tags);
    const slug = slugFromTitle(title);
    const hotScore = computeHotScore(0, new Date());
    const coverImageUrl = firstCoverFromDays(days);

    const itinerary = await prisma.$transaction(async (tx) => {
      const tagIds = await upsertTagsAndCollectIds(tx, tagNames);

      return tx.itinerary.create({
        data: {
          ownerId: session.user!.id,
          title,
          slug,
          summary: body.summary?.trim() || null,
          visibility,
          coverImageUrl,
          voteScore: 0,
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

    return NextResponse.json({ id: itinerary.id, slug: itinerary.slug });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Create failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
