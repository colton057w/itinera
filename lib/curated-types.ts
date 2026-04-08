import type { StoryKind } from "@/components/itinerary/storybook/types";

export type CuratedExperience = {
  /** React key + queue id (DB cuid or synthetic `citySlug/key`) */
  id: string;
  experienceKey: string;
  title: string;
  subtitle: string;
  image: string;
  locationLabel: string;
  storyKind: StoryKind;
};

export type CuratedCity = {
  slug: string;
  name: string;
  country: string;
  tagline: string;
  heroImage: string;
  experiences: CuratedExperience[];
};

export type CuratedAttraction = {
  id: string;
  title: string;
  city: string;
  citySlug: string;
  image: string;
};
