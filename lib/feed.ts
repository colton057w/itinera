import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function isDbConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; name?: string; message?: string };
  if (e.code === "P1001") return true;
  if (e.name === "PrismaClientInitializationError") return true;
  if (typeof e.message === "string" && e.message.includes("Can't reach database")) {
    return true;
  }
  return false;
}

export type FeedItem = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  coverImageUrl: string | null;
  voteScore: number;
  hotScore: number;
  createdAt: string;
  dayCount: number;
  owner: { id: string; name: string | null; image: string | null };
  tags: string[];
};

export async function queryFeed(options: {
  vibe?: string | null;
  location?: string | null;
  durationMin?: number | null;
  durationMax?: number | null;
}): Promise<{ items: FeedItem[]; databaseAvailable: boolean }> {
  const vibe = options.vibe?.trim();
  const location = options.location?.trim();

  const where: Prisma.ItineraryWhereInput = {
    visibility: "PUBLIC",
  };

  if (vibe) {
    where.tags = {
      some: {
        tag: {
          name: { contains: vibe, mode: "insensitive" },
        },
      },
    };
  }

  if (location) {
    where.OR = [
      { title: { contains: location, mode: "insensitive" } },
      { summary: { contains: location, mode: "insensitive" } },
      {
        days: {
          some: {
            events: {
              some: { location: { contains: location, mode: "insensitive" } },
            },
          },
        },
      },
    ];
  }

  try {
    const raw = await prisma.itinerary.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, image: true } },
        tags: { include: { tag: true } },
        _count: { select: { days: true } },
      },
      orderBy: [{ hotScore: "desc" }, { createdAt: "desc" }],
      take: 60,
    });

    let items = raw;
    if (options.durationMin != null && !Number.isNaN(options.durationMin)) {
      items = items.filter((i) => i._count.days >= options.durationMin!);
    }
    if (options.durationMax != null && !Number.isNaN(options.durationMax)) {
      items = items.filter((i) => i._count.days <= options.durationMax!);
    }

    return {
      databaseAvailable: true,
      items: items.map((i) => ({
        id: i.id,
        slug: i.slug,
        title: i.title,
        summary: i.summary,
        coverImageUrl: i.coverImageUrl,
        voteScore: i.voteScore,
        hotScore: i.hotScore,
        createdAt: i.createdAt.toISOString(),
        dayCount: i._count.days,
        owner: i.owner,
        tags: i.tags.map((t) => t.tag.name),
      })),
    };
  } catch (error) {
    if (isDbConnectionError(error)) {
      return { items: [], databaseAvailable: false };
    }
    throw error;
  }
}
