import type { CommentNode } from "@/types/comment";

export type CommentRow = {
  id: string;
  body: string;
  createdAt: Date;
  parentId: string | null;
  mentionedDayIndices: number[];
  voteScore: number;
  author: { id: string; name: string | null; image: string | null };
  votes?: { value: number }[];
};

function myVoteFromRow(r: CommentRow): -1 | 0 | 1 {
  const v = r.votes?.[0]?.value;
  if (v === 1 || v === -1) return v;
  return 0;
}

export function buildCommentTree(rows: CommentRow[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  for (const r of rows) {
    map.set(r.id, {
      id: r.id,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      parentId: r.parentId,
      author: r.author,
      replies: [],
      mentionedDayIndices: [...r.mentionedDayIndices],
      voteScore: r.voteScore,
      myVote: myVoteFromRow(r),
    });
  }
  const roots: CommentNode[] = [];
  for (const r of rows) {
    const node = map.get(r.id)!;
    if (r.parentId) {
      map.get(r.parentId)?.replies.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}
