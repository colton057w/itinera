import { NextResponse } from "next/server";
import { isUserAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";

const TITLE_MAX = 200;
const BODY_MAX = 16_000;

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const post = await prisma.forumPost.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        body: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, name: true, image: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            body: true,
            createdAt: true,
            author: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });
    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ post });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load post";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id || !(await isUserAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const exists = await prisma.forumPost.findUnique({ where: { id }, select: { id: true } });
  if (!exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = (await req.json()) as { title?: string; body?: string };
    const title = body.title?.trim() ?? "";
    const text = body.body?.trim() ?? "";
    if (!title || title.length > TITLE_MAX) {
      return NextResponse.json({ error: "Title required (max 200 characters)" }, { status: 400 });
    }
    if (!text || text.length > BODY_MAX) {
      return NextResponse.json({ error: "Body required" }, { status: 400 });
    }
    await prisma.forumPost.update({
      where: { id },
      data: { title, body: text },
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

  const { id } = await params;
  try {
    await prisma.forumPost.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
