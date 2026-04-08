import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";

const TITLE_MAX = 200;
const BODY_MAX = 16_000;

export async function GET() {
  try {
    const posts = await prisma.forumPost.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        title: true,
        createdAt: true,
        author: { select: { name: true, image: true } },
        _count: { select: { replies: true } },
      },
    });
    return NextResponse.json({ posts });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load posts";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { title?: string; body?: string };
    const title = body.title?.trim() ?? "";
    const text = body.body?.trim() ?? "";
    if (!title || title.length > TITLE_MAX) {
      return NextResponse.json({ error: "Title required (max 200 characters)" }, { status: 400 });
    }
    if (!text || text.length > BODY_MAX) {
      return NextResponse.json({ error: "Post body required" }, { status: 400 });
    }

    const post = await prisma.forumPost.create({
      data: {
        authorId: session.user.id,
        title,
        body: text,
      },
      select: { id: true },
    });
    return NextResponse.json({ id: post.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Create failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
