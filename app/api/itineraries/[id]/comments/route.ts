import { Visibility } from "@prisma/client";
import { NextResponse } from "next/server";
import { buildCommentTree } from "@/lib/comments";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";
import type { CommentNode } from "@/types/comment";

async function canViewItinerary(
  itineraryId: string,
  userId: string | undefined,
): Promise<boolean> {
  const it = await prisma.itinerary.findUnique({
    where: { id: itineraryId },
    select: { visibility: true, ownerId: true },
  });
  if (!it) return false;
  if (it.visibility === Visibility.PUBLIC) return true;
  return Boolean(userId && userId === it.ownerId);
}

function commentInclude(userId: string | undefined) {
  return {
    author: { select: { id: true, name: true, image: true } },
    ...(userId
      ? {
          votes: {
            where: { userId },
            select: { value: true },
            take: 1,
          },
        }
      : {}),
  } as const;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: itineraryId } = await context.params;
  const session = await auth();

  const ok = await canViewItinerary(itineraryId, session?.user?.id);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await prisma.comment.findMany({
    where: { itineraryId },
    orderBy: { createdAt: "asc" },
    include: commentInclude(session?.user?.id),
  });

  return NextResponse.json({ comments: buildCommentTree(rows) });
}

function parseMentionedDayIndices(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const out: number[] = [];
  for (const x of raw) {
    if (typeof x === "number" && Number.isInteger(x) && x >= 0 && x < 10_000) {
      out.push(x);
    }
  }
  return [...new Set(out)].slice(0, 8);
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: itineraryId } = await context.params;
  const ok = await canViewItinerary(itineraryId, session.user.id);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as {
    body?: string;
    parentId?: string | null;
    mentionedDayIndices?: unknown;
  };
  const text = body.body?.trim();
  if (!text || text.length > 8000) {
    return NextResponse.json({ error: "Invalid comment" }, { status: 400 });
  }

  if (body.parentId) {
    const parent = await prisma.comment.findFirst({
      where: { id: body.parentId, itineraryId },
    });
    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 400 });
    }
  }

  const mentionedDayIndices = parseMentionedDayIndices(body.mentionedDayIndices);
  if (mentionedDayIndices.length > 0) {
    const dayRows = await prisma.day.findMany({
      where: { itineraryId },
      select: { dayIndex: true },
    });
    const allowed = new Set(dayRows.map((d) => d.dayIndex));
    for (const i of mentionedDayIndices) {
      if (!allowed.has(i)) {
        return NextResponse.json({ error: "Invalid day mention" }, { status: 400 });
      }
    }
  }

  const created = await prisma.comment.create({
    data: {
      itineraryId,
      authorId: session.user.id,
      parentId: body.parentId ?? null,
      body: text,
      mentionedDayIndices,
    },
    include: commentInclude(session.user.id),
  });

  const node: CommentNode = {
    id: created.id,
    body: created.body,
    createdAt: created.createdAt.toISOString(),
    parentId: created.parentId,
    author: created.author,
    replies: [],
    mentionedDayIndices: [...created.mentionedDayIndices],
    voteScore: created.voteScore,
    myVote: created.votes?.[0]?.value === 1 ? 1 : created.votes?.[0]?.value === -1 ? -1 : 0,
  };

  return NextResponse.json({ comment: node });
}
