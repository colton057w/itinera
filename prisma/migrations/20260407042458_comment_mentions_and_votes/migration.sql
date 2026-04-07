-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "mentionedDayIndices" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "voteScore" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CommentVote" (
    "userId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentVote_pkey" PRIMARY KEY ("userId","commentId")
);

-- CreateIndex
CREATE INDEX "CommentVote_commentId_idx" ON "CommentVote"("commentId");

-- CreateIndex
CREATE INDEX "Comment_itineraryId_voteScore_idx" ON "Comment"("itineraryId", "voteScore");

-- AddForeignKey
ALTER TABLE "CommentVote" ADD CONSTRAINT "CommentVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentVote" ADD CONSTRAINT "CommentVote_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
