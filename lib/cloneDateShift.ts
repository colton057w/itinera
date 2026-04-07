/** UTC midnight for the calendar day of `d`. */
export function utcDayStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function parseIsoDateOnly(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const da = Number(m[3]);
  if (mo < 0 || mo > 11 || da < 1 || da > 31) return null;
  const d = new Date(Date.UTC(y, mo, da));
  if (d.getUTCFullYear() !== y || d.getUTCMonth() !== mo || d.getUTCDate() !== da) return null;
  return d;
}

export function diffCalendarDaysUtc(a: Date, b: Date): number {
  const ua = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const ub = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.round((ub - ua) / 86400000);
}

export function addCalendarDaysUtc(d: Date, days: number): Date {
  const x = new Date(d.getTime());
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

type Ev = { startsAt: Date | null; endsAt: Date | null };
type DayLike = { dayIndex: number; date: Date | null; events: Ev[] };

/**
 * Best-effort "trip start" on the source: day 0 date, else first time on day 0, else first day date, else earliest event day.
 */
export function resolveTripStartOldUtc(days: DayLike[]): Date | null {
  const byIdx = [...days].sort((a, b) => a.dayIndex - b.dayIndex);
  const d0 = byIdx.find((d) => d.dayIndex === 0);
  if (d0?.date) return utcDayStart(d0.date);
  for (const ev of d0?.events ?? []) {
    if (ev.startsAt) return utcDayStart(ev.startsAt);
    if (ev.endsAt) return utcDayStart(ev.endsAt);
  }
  for (const day of byIdx) {
    if (day.date) return utcDayStart(day.date);
  }
  let min: Date | null = null;
  for (const day of byIdx) {
    for (const ev of day.events) {
      for (const t of [ev.startsAt, ev.endsAt]) {
        if (!t) continue;
        const u = utcDayStart(t);
        if (!min || u.getTime() < min.getTime()) min = u;
      }
    }
  }
  return min;
}

export type ShiftedDay = {
  dayIndex: number;
  date: Date | null;
  events: { startsAt: Date | null; endsAt: Date | null }[];
};

/**
 * Maps source days/events onto `newTripStart` (UTC date-only). Preserves relative spacing when anchor exists.
 */
export function shiftItineraryDatesForClone(days: DayLike[], newTripStart: Date): ShiftedDay[] {
  const byIdx = [...days].sort((a, b) => a.dayIndex - b.dayIndex);
  const anchor = resolveTripStartOldUtc(byIdx);
  const start = utcDayStart(newTripStart);

  if (anchor) {
    const delta = diffCalendarDaysUtc(anchor, start);
    return byIdx.map((day) => ({
      dayIndex: day.dayIndex,
      date: day.date
        ? addCalendarDaysUtc(day.date, delta)
        : addCalendarDaysUtc(start, day.dayIndex),
      events: day.events.map((ev) => ({
        startsAt: ev.startsAt ? addCalendarDaysUtc(ev.startsAt, delta) : null,
        endsAt: ev.endsAt ? addCalendarDaysUtc(ev.endsAt, delta) : null,
      })),
    }));
  }

  return byIdx.map((day) => ({
    dayIndex: day.dayIndex,
    date: addCalendarDaysUtc(start, day.dayIndex),
    events: day.events.map((ev) => ({
      startsAt: ev.startsAt,
      endsAt: ev.endsAt,
    })),
  }));
}
