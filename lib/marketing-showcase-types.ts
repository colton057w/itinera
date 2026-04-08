/** Serializable payload for the home-page feature tabs (server → client). */
export type MarketingShowcaseData = {
  isLoggedIn: boolean;
  collaboration: {
    trips: {
      title: string;
      slug: string;
      updatedAt: string;
      forkCount: number;
    }[];
    guestComments: {
      itineraryTitle: string;
      authorName: string | null;
      excerpt: string;
      createdAt: string;
    }[];
  };
  reservations: {
    items: {
      kind: "flight" | "hotel";
      title: string;
      tripTitle: string;
      tripSlug: string;
      whenLabel: string | null;
      detail: string;
    }[];
  };
  flights: {
    items: {
      title: string;
      route: string;
      whenLabel: string | null;
      tripSlug: string;
      flightIata: string | null;
      live: {
        statusText: string;
        gate?: string;
        terminal?: string;
        delay?: boolean;
      } | null;
    }[];
  };
  mapRoutes: {
    tripTitle: string;
    tripSlug: string;
    legs: { from: string; to: string; label: string }[];
    stopCount: number;
  } | null;
  deals: {
    headline: string;
    subline: string | null;
    tag: string | null;
    priceHint: string | null;
    source: string;
  }[];
};
