import type { CommentNode } from "@/types/comment";

function time(a: CommentNode) {
  return new Date(a.createdAt).getTime();
}

/**
 * Top: sort by score (all levels), then older first.
 * Newest: root threads newest-first; replies under a thread oldest-first.
 */
export function sortCommentTree(
  roots: CommentNode[],
  mode: "top" | "newest",
  depth = 0,
): CommentNode[] {
  const sorted = [...roots].sort((a, b) => {
    if (mode === "top") {
      const ds = b.voteScore - a.voteScore;
      if (ds !== 0) return ds;
      return time(a) - time(b);
    }
    if (depth === 0) return time(b) - time(a);
    return time(a) - time(b);
  });
  return sorted.map((n) => ({
    ...n,
    replies: sortCommentTree(n.replies, mode, depth + 1),
  }));
}
