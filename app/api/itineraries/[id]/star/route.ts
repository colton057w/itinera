import { Visibility } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";

async function loadViewableItinerary(id: string, userId: string) {
  const it = await prisma.itinerary.findUnique({
    where: { id },
    select: { id: true, visibility: true, ownerId: true },
  });
  if (!it) return null;
  if (it.visibility === Visibility.PRIVATE && it.ownerId !== userId) {
    return "forbidden" as const;
  }
  return it;
}

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: itineraryId } = await context.params;
  const it = await loadViewableItinerary(itineraryId, session.user.id);
  if (it === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (it === "forbidden") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.itineraryStar.upsert({
    where: {
      userId_itineraryId: {
        userId: session.user.id,
        itineraryId,
      },
    },
    create: { userId: session.user.id, itineraryId },
    update: {},
  });

  return NextResponse.json({ starred: true });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: itineraryId } = await context.params;

  await prisma.itineraryStar.deleteMany({
    where: { userId: session.user.id, itineraryId },
  });

  return NextResponse.json({ starred: false });
}
