import { createQuickEvent, type EventDraft, type StoryKind } from "@/components/itinerary/storybook/types";

export const EXPERIENCE_QUEUE_KEY = "itinera_queued_experiences";

export type QueuedExperience = {
  title: string;
  description: string;
  location: string;
  coverImageUrl?: string;
  storyKind?: StoryKind;
  /** Used to suggest a trip title when starting from /itineraries/new */
  cityName?: string;
};

export function replaceExperienceQueue(items: QueuedExperience[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(EXPERIENCE_QUEUE_KEY, JSON.stringify(items));
}

export function appendExperienceQueue(item: QueuedExperience) {
  if (typeof window === "undefined") return;
  let existing: QueuedExperience[] = [];
  try {
    const raw = sessionStorage.getItem(EXPERIENCE_QUEUE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as unknown;
      if (Array.isArray(p)) existing = p as QueuedExperience[];
    }
  } catch {
    /* ignore */
  }
  existing.push(item);
  sessionStorage.setItem(EXPERIENCE_QUEUE_KEY, JSON.stringify(existing));
}

/** Read queued experiences and remove them from storage (single consumer). */
export function readAndClearExperienceQueue(): QueuedExperience[] {
  if (typeof window === "undefined") return [];
  const raw = sessionStorage.getItem(EXPERIENCE_QUEUE_KEY);
  if (!raw) return [];
  sessionStorage.removeItem(EXPERIENCE_QUEUE_KEY);
  try {
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    return p.filter(
      (x): x is QueuedExperience =>
        x &&
        typeof x === "object" &&
        typeof (x as QueuedExperience).title === "string" &&
        typeof (x as QueuedExperience).location === "string",
    );
  } catch {
    return [];
  }
}

export function queuedToEventDraft(q: QueuedExperience): EventDraft {
  const kind: StoryKind =
    q.storyKind === "meal" ? "meal" : q.storyKind === "stay" ? "stay" : "activity";
  const ev = createQuickEvent(kind);
  return {
    ...ev,
    title: q.title,
    description: q.description ?? "",
    location: q.location,
    ...(q.coverImageUrl ? { coverImageUrl: q.coverImageUrl } : {}),
  };
}
