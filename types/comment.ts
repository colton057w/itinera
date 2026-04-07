export type CommentAuthor = {
  id: string;
  name: string | null;
  image: string | null;
};

export type CommentNode = {
  id: string;
  body: string;
  createdAt: string;
  parentId: string | null;
  author: CommentAuthor;
  replies: CommentNode[];
  /** Itinerary day indices (0-based), e.g. Day 3 → 2 */
  mentionedDayIndices: number[];
  voteScore: number;
  myVote: -1 | 0 | 1;
};
