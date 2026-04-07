export type AutocompletePrediction = {
  placeId: string;
  mainText: string;
  secondaryText: string;
};

export type PlaceDetailsResult = {
  name: string;
  formattedAddress: string;
  website: string | null;
  googleMapsUrl: string | null;
  lat: number | null;
  lng: number | null;
  coverPhotoUrl: string | null;
};

function placesKey(): string | null {
  const k = process.env.GOOGLE_PLACES_API_KEY?.trim();
  return k || null;
}

export function isGooglePlacesConfigured(): boolean {
  return Boolean(placesKey());
}

/** Single Place Autocomplete `types` filter (Google allows at most one). Omit for all POIs. */
const AUTOCOMPLETE_TYPES_ALLOWLIST = new Set([
  "lodging",
  "restaurant",
  "cafe",
  "bar",
  "establishment",
  "tourist_attraction",
  "museum",
  "park",
  "geocode",
]);

export function sanitizeAutocompleteTypesParam(raw: string | null): string | undefined {
  if (!raw || raw.length > 40) return undefined;
  const t = raw.trim().toLowerCase();
  return AUTOCOMPLETE_TYPES_ALLOWLIST.has(t) ? t : undefined;
}

export async function fetchPlaceAutocomplete(
  input: string,
  types?: string | null,
): Promise<AutocompletePrediction[]> {
  const key = placesKey();
  const trimmed = input.trim();
  if (!key || trimmed.length < 2) return [];

  const u = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
  u.searchParams.set("input", trimmed);
  const filtered = types ? sanitizeAutocompleteTypesParam(types) : undefined;
  if (filtered) u.searchParams.set("types", filtered);
  u.searchParams.set("key", key);

  const res = await fetch(u.toString());
  const data = (await res.json()) as {
    status: string;
    predictions?: Array<{
      place_id: string;
      description?: string;
      structured_formatting?: { main_text?: string; secondary_text?: string };
    }>;
    error_message?: string;
  };

  if (data.status === "ZERO_RESULTS") return [];
  if (data.status !== "OK") {
    console.error("[places] autocomplete", data.status, data.error_message);
    throw new Error(data.error_message || `Places: ${data.status}`);
  }

  return (data.predictions ?? []).map((p) => ({
    placeId: p.place_id,
    mainText: p.structured_formatting?.main_text || p.description || "",
    secondaryText: p.structured_formatting?.secondary_text || "",
  }));
}

export async function fetchPlaceDetails(
  placeId: string,
): Promise<PlaceDetailsResult> {
  const key = placesKey();
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY is not set");

  const u = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  u.searchParams.set("place_id", placeId);
  u.searchParams.set("fields", "name,formatted_address,geometry,website,url,photos");
  u.searchParams.set("key", key);

  const res = await fetch(u.toString());
  const data = (await res.json()) as {
    status: string;
    result?: {
      name?: string;
      formatted_address?: string;
      website?: string;
      url?: string;
      photos?: Array<{ photo_reference?: string }>;
      geometry?: { location?: { lat: number; lng: number } };
    };
    error_message?: string;
  };

  if (data.status !== "OK" || !data.result) {
    console.error("[places] details", data.status, data.error_message);
    throw new Error(data.error_message || `Places details: ${data.status}`);
  }

  const r = data.result;
  const loc = r.geometry?.location;
  const photoRef = r.photos?.[0]?.photo_reference?.trim() || null;
  return {
    name: r.name ?? "",
    formattedAddress: r.formatted_address ?? "",
    website: r.website ?? null,
    googleMapsUrl: r.url ?? null,
    lat: loc?.lat ?? null,
    lng: loc?.lng ?? null,
    coverPhotoUrl: photoRef ? `/api/places/photo?ref=${encodeURIComponent(photoRef)}` : null,
  };
}
