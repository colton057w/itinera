import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";

function isAllowedAvatarUrl(url: string, userId: string): boolean {
  const u = url.trim();
  if (!u) return false;
  if (/^\/uploads\/[a-f0-9]{32}\.(jpg|jpeg|png|webp|gif)$/i.test(u)) return true;
  try {
    const parsed = new URL(u);
    if (parsed.protocol !== "https:") return false;
    if (parsed.hostname.endsWith(".public.blob.vercel-storage.com")) {
      return parsed.pathname.includes(`/itinera/${userId}/`);
    }
    return false;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { url?: string };
  const url = body.url?.trim();
  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }
  if (!isAllowedAvatarUrl(url, session.user.id)) {
    return NextResponse.json(
      { error: "Invalid image URL — upload a new file from this account." },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: url },
  });

  return NextResponse.json({ ok: true, image: url });
}
