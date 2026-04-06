/** Ensure outbound links are absolute https for user-supplied or Places URLs */
export function withHttps(url: string): string {
  const u = url.trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

/**
 * Best Maps link for an event: prefer Google's own `url` from Place Details,
 * then lat/lng pin, then search with both `query` and `query_place_id` (required by Maps URL API).
 */
export function mapsHrefForPlace(opts: {
  googleMapsUrl?: string | null;
  googlePlaceId?: string | null;
  title?: string | null;
  location?: string | null;
  lat?: number | null;
  lng?: number | null;
}): string | null {
  const direct = opts.googleMapsUrl?.trim();
  if (direct) {
    return withHttps(direct);
  }

  const pid = opts.googlePlaceId?.trim();
  const lat = opts.lat;
  const lng = opts.lng;

  if (
    pid &&
    lat != null &&
    lng != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}&query_place_id=${encodeURIComponent(pid)}`;
  }

  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&z=17`;
  }

  if (pid) {
    const q =
      opts.title?.trim() ||
      opts.location?.trim() ||
      "place";
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}&query_place_id=${encodeURIComponent(pid)}`;
  }

  return null;
}

/** @deprecated use mapsHrefForPlace */
export function googleMapsPlaceUrl(placeId: string): string {
  return `https://www.google.com/maps/search/?api=1&query=place&query_place_id=${encodeURIComponent(placeId)}`;
}
