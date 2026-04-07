import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const it = await prisma.itinerary.findUnique({
    where: { id },
    select: { id: true, ownerId: true },
  });

  if (!it) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (it.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.itinerary.delete({ where: { id: it.id } });

  return NextResponse.json({ ok: true });
}
