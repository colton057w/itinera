import { NextResponse } from "next/server";
import { isUserAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";

const REPLY_MAX = 8000;

type Params = { params: Promise<{ replyId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id || !(await isUserAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { replyId } = await params;
  const row = await prisma.forumReply.findUnique({ where: { id: replyId }, select: { id: true } });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = (await req.json()) as { body?: string };
    const text = body.body?.trim() ?? "";
    if (!text || text.length > REPLY_MAX) {
      return NextResponse.json({ error: "Reply body required" }, { status: 400 });
    }
    await prisma.forumReply.update({
      where: { id: replyId },
      data: { body: text },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id || !(await isUserAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { replyId } = await params;
  try {
    await prisma.forumReply.delete({ where: { id: replyId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
