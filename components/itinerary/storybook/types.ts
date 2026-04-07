export type StoryKind = "stay" | "meal" | "transit" | "activity";

export type EventDraft = {
  clientId: string;
  type: "FLIGHT" | "HOTEL" | "ACTIVITY" | "MEAL" | "CUSTOM";
  /** Quick-add flavor — drives hero image for true "Activity" only */
  storyKind?: StoryKind;
  title: string;
  description: string;
  location: string;
  coverImageUrl?: string;
  googlePlaceId?: string;
  googleMapsUrl?: string;
  websiteUrl?: string;
  lat?: number;
  lng?: number;
  ratingStars: number | null;
  airline: string;
  departureAirportCode: string;
  departureAirportName: string;
  arrivalAirportCode: string;
  arrivalAirportName: string;
  departureAt: string;
  arrivalAt: string;
};

export type DayDraft = {
  clientId: string;
  label: string;
  date: string;
  events: EventDraft[];
};

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const emptyEventBase = (): Omit<EventDraft, "clientId" | "type" | "title" | "storyKind"> => ({
  description: "",
  location: "",
  ratingStars: null,
  airline: "",
  departureAirportCode: "",
  departureAirportName: "",
  arrivalAirportCode: "",
  arrivalAirportName: "",
  departureAt: "",
  arrivalAt: "",
});

export function createQuickEvent(kind: StoryKind): EventDraft {
  const clientId = newId();
  const base = emptyEventBase();
  switch (kind) {
    case "stay":
      return {
        clientId,
        type: "HOTEL",
        storyKind: "stay",
        title: "",
        ...base,
      };
    case "meal":
      return {
        clientId,
        type: "MEAL",
        storyKind: "meal",
        title: "",
        ...base,
      };
    case "transit":
      return {
        clientId,
        type: "ACTIVITY",
        storyKind: "transit",
        title: "Transit",
        ...base,
      };
    case "activity":
      return {
        clientId,
        type: "ACTIVITY",
        storyKind: "activity",
        title: "",
        ...base,
      };
  }
}

export function useHeroImage(ev: EventDraft): boolean {
  return ev.type === "ACTIVITY" && ev.storyKind === "activity";
}
