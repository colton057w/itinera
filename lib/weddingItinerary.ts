import { TripKind } from "@prisma/client";

const WEDDING_TAGS = /\b(wedding|bridal|ceremony|rehearsal|elopement|honeymoon|bachelorette|bachelor)\b/i;

export function isWeddingStyleTrip(input: {
  tripKind: TripKind;
  tagNames: string[];
  title?: string;
}): boolean {
  if (input.tripKind === TripKind.WEDDING_EVENT) return true;
  if (input.title && WEDDING_TAGS.test(input.title)) return true;
  return input.tagNames.some((t) => WEDDING_TAGS.test(t));
}
