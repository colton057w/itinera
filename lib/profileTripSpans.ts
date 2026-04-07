/** YYYY-MM-DD in UTC from a Date (calendar day from stored value). */
export function dateToYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export type ProfileCalendarTrip = {
  id: string;
  title: string;
  slug: string;
  startDate: string | null;
  endDate: string | null;
};

export function buildProfileCalendarTrips(
  rows: {
    id: string;
    title: string;
    slug: string;
    days: { date: Date | null }[];
  }[],
): ProfileCalendarTrip[] {
  return rows.map((it) => {
    const dates = it.days.map((d) => d.date).filter((d): d is Date => d != null);
    if (dates.length === 0) {
      return {
        id: it.id,
        title: it.title,
        slug: it.slug,
        startDate: null,
        endDate: null,
      };
    }
    const t = dates.map((d) => d.getTime());
    const min = new Date(Math.min(...t));
    const max = new Date(Math.max(...t));
    return {
      id: it.id,
      title: it.title,
      slug: it.slug,
      startDate: dateToYmd(min),
      endDate: dateToYmd(max),
    };
  });
}

/** True if ymd (YYYY-MM-DD) is on or between start and end (inclusive). */
export function ymdInRange(ymd: string, start: string, end: string): boolean {
  return ymd >= start && ymd <= end;
}
