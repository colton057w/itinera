import type { CommentNode } from "@/types/comment";

type Row = {
  id: string;
  body: string;
  createdAt: Date;
  parentId: string | null;
  author: { id: string; name: string | null; image: string | null };
};

export function buildCommentTree(rows: Row[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  for (const r of rows) {
    map.set(r.id, {
      id: r.id,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      parentId: r.parentId,
      author: r.author,
      replies: [],
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
