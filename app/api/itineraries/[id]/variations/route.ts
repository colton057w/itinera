import { Visibility } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";

/**
 * Public itineraries that were cloned/forked from this one (`forkedFromId` lineage).
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const parent = await prisma.itinerary.findUnique({
    where: { id },
    select: { id: true, visibility: true, ownerId: true },
  });

  if (!parent) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await auth();
  const canSeeParent =
    parent.visibility === Visibility.PUBLIC ||
    (session?.user?.id && session.user.id === parent.ownerId);

  if (!canSeeParent) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const variations = await prisma.itinerary.findMany({
    where: { forkedFromId: id, visibility: Visibility.PUBLIC },
    select: {
      id: true,
      slug: true,
      title: true,
      createdAt: true,
      owner: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 36,
  });

  return NextResponse.json({
    variations: variations.map((v) => ({
      id: v.id,
      slug: v.slug,
      title: v.title,
      ownerName: v.owner.name,
      createdAt: v.createdAt.toISOString(),
    })),
  });
}
