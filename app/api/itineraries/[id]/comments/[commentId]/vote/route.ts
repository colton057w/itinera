import { Visibility } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";

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

function nextVote(current: -1 | 0 | 1, dir: "up" | "down"): -1 | 0 | 1 {
  if (dir === "up") {
    if (current === 1) return 0;
    return 1;
  }
  if (current === -1) return 0;
  return -1;
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string; commentId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: itineraryId, commentId } = await context.params;
  const ok = await canViewItinerary(itineraryId, session.user.id);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { dir?: string };
  const dir = body.dir === "down" ? "down" : body.dir === "up" ? "up" : null;
  if (!dir) {
    return NextResponse.json({ error: "dir must be up or down" }, { status: 400 });
  }

  const comment = await prisma.comment.findFirst({
    where: { id: commentId, itineraryId },
    select: { id: true },
  });
  if (!comment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const uid = session.user.id;

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.commentVote.findUnique({
      where: {
        userId_commentId: { userId: uid, commentId },
      },
    });
    const current = (existing?.value === 1 || existing?.value === -1
      ? existing.value
      : 0) as -1 | 0 | 1;
    const newVote = nextVote(current, dir);
    const delta = newVote - current;

    if (delta !== 0) {
      await tx.comment.update({
        where: { id: commentId },
        data: { voteScore: { increment: delta } },
      });
    }

    if (newVote === 0) {
      if (existing) {
        await tx.commentVote.delete({
          where: { userId_commentId: { userId: uid, commentId } },
        });
      }
    } else {
      await tx.commentVote.upsert({
        where: { userId_commentId: { userId: uid, commentId } },
        create: { userId: uid, commentId, value: newVote },
        update: { value: newVote },
      });
    }

    const updated = await tx.comment.findUnique({
      where: { id: commentId },
      select: { voteScore: true },
    });
    return {
      voteScore: updated?.voteScore ?? 0,
      myVote: newVote as -1 | 0 | 1,
    };
  });

  return NextResponse.json(result);
}
