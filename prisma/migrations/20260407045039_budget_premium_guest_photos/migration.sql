-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "currency" TEXT DEFAULT 'USD',
ADD COLUMN     "estimatedCostMinor" INTEGER;

-- AlterTable
ALTER TABLE "Itinerary" ADD COLUMN     "premiumCloneCurrency" TEXT DEFAULT 'USD',
ADD COLUMN     "premiumCloneEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "premiumClonePriceCents" INTEGER;

-- CreateTable
CREATE TABLE "GuestEventPhoto" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "authorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestEventPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GuestEventPhoto_eventId_createdAt_idx" ON "GuestEventPhoto"("eventId", "createdAt");

-- AddForeignKey
ALTER TABLE "GuestEventPhoto" ADD CONSTRAINT "GuestEventPhoto_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
