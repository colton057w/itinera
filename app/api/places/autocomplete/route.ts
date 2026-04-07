import { NextResponse } from "next/server";
import {
  fetchPlaceAutocomplete,
  isGooglePlacesConfigured,
  sanitizeAutocompleteTypesParam,
} from "@/lib/google-places";
import { auth } from "@/lib/session";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = new URL(req.url).searchParams;
  const input = sp.get("input") ?? "";
  const types = sanitizeAutocompleteTypesParam(sp.get("types"));

  if (!isGooglePlacesConfigured()) {
    return NextResponse.json({ predictions: [], configured: false });
  }

  try {
    const predictions = await fetchPlaceAutocomplete(input, types);
    return NextResponse.json({ predictions, configured: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Autocomplete failed";
    return NextResponse.json(
      { error: msg, predictions: [], configured: true },
      { status: 502 },
    );
  }
}
