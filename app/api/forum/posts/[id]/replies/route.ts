import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";

const REPLY_MAX = 8000;

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;

  try {
    const exists = await prisma.forumPost.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!exists) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const body = (await req.json()) as { body?: string };
    const text = body.body?.trim() ?? "";
    if (!text || text.length > REPLY_MAX) {
      return NextResponse.json({ error: "Reply required" }, { status: 400 });
    }

    const reply = await prisma.forumReply.create({
      data: {
        postId,
        authorId: session.user.id,
        body: text,
      },
      select: { id: true },
    });
    return NextResponse.json({ id: reply.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Reply failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
