import { NextResponse } from "next/server";
import { queryFeed } from "@/lib/feed";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vibe = searchParams.get("vibe");
  const location = searchParams.get("location");
  const durMin = searchParams.get("durationMin");
  const durMax = searchParams.get("durationMax");

  const { items, databaseAvailable } = await queryFeed({
    vibe,
    location,
    durationMin: durMin ? Number.parseInt(durMin, 10) : null,
    durationMax: durMax ? Number.parseInt(durMax, 10) : null,
  });

  return NextResponse.json({ items, databaseAvailable });
}
