import { NextResponse } from "next/server";
import { fetchPlaceDetails, isGooglePlacesConfigured } from "@/lib/google-places";
import { auth } from "@/lib/session";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const placeId = new URL(req.url).searchParams.get("placeId");
  if (!placeId?.trim()) {
    return NextResponse.json({ error: "Missing placeId" }, { status: 400 });
  }

  if (!isGooglePlacesConfigured()) {
    return NextResponse.json({ error: "Places API key not configured" }, { status: 503 });
  }

  try {
    const details = await fetchPlaceDetails(placeId.trim());
    return NextResponse.json(details);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Place details failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
