-- CreateTable
CREATE TABLE "ItineraryStar" (
    "userId" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItineraryStar_pkey" PRIMARY KEY ("userId","itineraryId")
);

-- CreateIndex
CREATE INDEX "ItineraryStar_userId_idx" ON "ItineraryStar"("userId");

-- CreateIndex
CREATE INDEX "ItineraryStar_itineraryId_idx" ON "ItineraryStar"("itineraryId");

-- AddForeignKey
ALTER TABLE "ItineraryStar" ADD CONSTRAINT "ItineraryStar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryStar" ADD CONSTRAINT "ItineraryStar_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
