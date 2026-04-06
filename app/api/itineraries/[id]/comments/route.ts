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
    include: {
      author: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json({ comments: buildCommentTree(rows) });
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

  const body = (await req.json()) as { body?: string; parentId?: string | null };
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

  const created = await prisma.comment.create({
    data: {
      itineraryId,
      authorId: session.user.id,
      parentId: body.parentId ?? null,
      body: text,
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json({
    comment: {
      id: created.id,
      body: created.body,
      createdAt: created.createdAt.toISOString(),
      parentId: created.parentId,
      author: created.author,
      replies: [],
    } satisfies CommentNode,
  });
}
