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
};
