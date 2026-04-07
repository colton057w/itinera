import { NextResponse } from "next/server";

function placesKey(): string | null {
  const k = process.env.GOOGLE_PLACES_API_KEY?.trim();
  return k || null;
}

export async function GET(req: Request) {
  const key = placesKey();
  if (!key) {
    return NextResponse.json({ error: "Places API key not configured" }, { status: 503 });
  }

  const sp = new URL(req.url).searchParams;
  const ref = sp.get("ref")?.trim();
  if (!ref || ref.length > 512) {
    return NextResponse.json({ error: "Invalid photo ref" }, { status: 400 });
  }

  const maxWidthRaw = Number(sp.get("maxWidth") ?? "");
  const maxWidth =
    Number.isFinite(maxWidthRaw) && maxWidthRaw >= 64 && maxWidthRaw <= 2000
      ? Math.trunc(maxWidthRaw)
      : 1200;

  const photoUrl = new URL("https://maps.googleapis.com/maps/api/place/photo");
  photoUrl.searchParams.set("maxwidth", String(maxWidth));
  photoUrl.searchParams.set("photo_reference", ref);
  photoUrl.searchParams.set("key", key);

  return NextResponse.redirect(photoUrl, {
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
