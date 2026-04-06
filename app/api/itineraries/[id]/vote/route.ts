import { NextResponse } from "next/server";
import { computeHotScore } from "@/lib/hotScore";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: itineraryId } = await context.params;
  const body = (await req.json()) as { value?: number };
  const value = body.value;

  if (value !== 1 && value !== -1 && value !== 0) {
    return NextResponse.json({ error: "value must be 1, -1, or 0" }, { status: 400 });
  }

  const itinerary = await prisma.itinerary.findUnique({
    where: { id: itineraryId },
    select: { id: true, createdAt: true, visibility: true },
  });

  if (!itinerary) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = session.user.id;

  await prisma.$transaction(async (tx) => {
    if (value === 0) {
      await tx.vote.deleteMany({ where: { userId, itineraryId } });
    } else {
      await tx.vote.upsert({
        where: {
          userId_itineraryId: { userId, itineraryId },
        },
        create: { userId, itineraryId, value },
        update: { value },
      });
    }

    const [up, down] = await Promise.all([
      tx.vote.count({ where: { itineraryId, value: 1 } }),
      tx.vote.count({ where: { itineraryId, value: -1 } }),
    ]);

    const voteScore = up - down;
    const hotScore = computeHotScore(voteScore, itinerary.createdAt);

    await tx.itinerary.update({
      where: { id: itineraryId },
      data: { voteScore, hotScore },
    });
  });

  const refreshed = await prisma.itinerary.findUniqueOrThrow({
    where: { id: itineraryId },
    select: { voteScore: true },
  });

  const myVote = await prisma.vote.findUnique({
    where: { userId_itineraryId: { userId, itineraryId } },
    select: { value: true },
  });

  return NextResponse.json({
    voteScore: refreshed.voteScore,
    myVote: myVote?.value ?? 0,
  });
}
