import { NextResponse } from "next/server";
import { fetchPlaceAutocomplete, isGooglePlacesConfigured } from "@/lib/google-places";
import { auth } from "@/lib/session";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const input = new URL(req.url).searchParams.get("input") ?? "";

  if (!isGooglePlacesConfigured()) {
    return NextResponse.json({ predictions: [], configured: false });
  }

  try {
    const predictions = await fetchPlaceAutocomplete(input);
    return NextResponse.json({ predictions, configured: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Autocomplete failed";
    return NextResponse.json(
      { error: msg, predictions: [], configured: true },
      { status: 502 },
    );
  }
}
