export type LiveFlightSummary = {
  statusText: string;
  gate?: string;
  terminal?: string;
  delay?: boolean;
};

/**
 * Optional live flight lookup (free tier: https://aviationstack.com/documentation).
 * Set AVIATIONSTACK_API_KEY in the environment.
 */
export async function fetchAviationStackFlight(
  flightIata: string,
): Promise<LiveFlightSummary | null> {
  const key = process.env.AVIATIONSTACK_API_KEY?.trim();
  if (!key) return null;

  const iata = flightIata.trim().toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z]{2}\d{1,4}$/.test(iata)) return null;

  try {
    const url = new URL("http://api.aviationstack.com/v1/flights");
    url.searchParams.set("access_key", key);
    url.searchParams.set("flight_iata", iata);

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4500);
    const res = await fetch(url.toString(), { signal: ctrl.signal });
    clearTimeout(t);

    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: Array<{
        flight_status?: string;
        departure?: { gate?: string; terminal?: string; delay?: number | null };
      }>;
    };
    const row = json.data?.[0];
    if (!row) return null;

    const raw = (row.flight_status ?? "unknown").toLowerCase();
    const statusText =
      raw === "scheduled"
        ? "Scheduled"
        : raw === "active"
          ? "In flight / active"
          : raw === "landed"
            ? "Landed"
            : raw === "cancelled"
              ? "Cancelled"
              : raw === "incident"
                ? "Incident reported"
                : raw === "diverted"
                  ? "Diverted"
                  : row.flight_status ?? "Unknown";

    const dep = row.departure;
    const delay = typeof dep?.delay === "number" && dep.delay > 0;

    return {
      statusText: delay ? `${statusText} · delayed` : statusText,
      gate: dep?.gate ?? undefined,
      terminal: dep?.terminal ?? undefined,
      delay: delay || undefined,
    };
  } catch {
    return null;
  }
}
