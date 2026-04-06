import { EventType, Visibility } from "@prisma/client";
import { NextResponse } from "next/server";
import { computeHotScore } from "@/lib/hotScore";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";
import { slugFromTitle } from "@/lib/slug";

const EVENT_TYPES = new Set<string>(Object.values(EventType));

type EventInput = {
  eventIndex: number;
  type: string;
  title: string;
  description: string | null;
  location: string | null;
  coverImageUrl?: string | null;
  googlePlaceId?: string | null;
  googleMapsUrl?: string | null;
  websiteUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
};

type DayInput = {
  dayIndex: number;
  label: string | null;
  date: string | null;
  events: EventInput[];
};

function normalizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of raw) {
    const n = String(t)
      .trim()
      .replace(/^#+/, "")
      .toLowerCase();
    if (!n || n.length > 48 || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
    if (out.length >= 24) break;
  }
  return out;
}

function firstCoverFromDays(days: DayInput[]): string | null {
  for (const d of days) {
    for (const ev of d.events ?? []) {
      if (ev.coverImageUrl) return ev.coverImageUrl;
    }
  }
  return null;
}

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
      const tagIds: string[] = [];
      for (const name of tagNames) {
        const tag = await tx.tag.upsert({
          where: { name },
          create: { name },
          update: {},
        });
        tagIds.push(tag.id);
      }

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
            create: days.map((day) => ({
              dayIndex: day.dayIndex,
              label: day.label,
              date: day.date ? new Date(day.date) : null,
              events: {
                create: (day.events ?? []).map((ev) => {
                  if (!EVENT_TYPES.has(ev.type)) {
                    throw new Error(`Invalid event type: ${ev.type}`);
                  }
                  const t = ev.title?.trim();
                  if (!t) throw new Error("Each event needs a title");
                  const media = ev.coverImageUrl
                    ? {
                        create: [{ url: ev.coverImageUrl, sortOrder: 0 }],
                      }
                    : undefined;
                  return {
                    eventIndex: ev.eventIndex,
                    type: ev.type as EventType,
                    title: t,
                    description: ev.description?.trim() || null,
                    location: ev.location?.trim() || null,
                    coverImageUrl: ev.coverImageUrl || null,
                    googlePlaceId: ev.googlePlaceId?.trim() || null,
                    googleMapsUrl: ev.googleMapsUrl?.trim() || null,
                    websiteUrl: ev.websiteUrl?.trim() || null,
                    lat: ev.lat ?? null,
                    lng: ev.lng ?? null,
                    media,
                  };
                }),
              },
            })),
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
