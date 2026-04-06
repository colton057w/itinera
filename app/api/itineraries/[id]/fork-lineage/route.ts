import { Visibility } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const it = await prisma.itinerary.findUnique({
    where: { id },
    select: {
      id: true,
      visibility: true,
      ownerId: true,
      forkedFromId: true,
      forkedAt: true,
    },
  });

  if (!it) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await auth();
  const canSee =
    it.visibility === Visibility.PUBLIC ||
    (session?.user?.id && session.user.id === it.ownerId);

  if (!canSee) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!it.forkedFromId) {
    return NextResponse.json({ forkedFrom: null, chain: [] });
  }

  const chain: {
    id: string;
    title: string;
    slug: string;
    owner: { id: string; name: string | null; image: string | null };
  }[] = [];

  const seen = new Set<string>([it.id]);
  let cursor: string | null = it.forkedFromId;

  for (let depth = 0; depth < 30; depth += 1) {
    if (cursor === null || seen.has(cursor)) break;
    const id: string = cursor;
    seen.add(id);
    const row = await prisma.itinerary.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        forkedFromId: true,
        owner: { select: { id: true, name: true, image: true } },
      },
    });
    if (!row) break;
    chain.push({
      id: row.id,
      title: row.title,
      slug: row.slug,
      owner: row.owner,
    });
    cursor = row.forkedFromId;
  }

  const direct = chain[0] ?? null;
  return NextResponse.json({ forkedFrom: direct, chain });
}
