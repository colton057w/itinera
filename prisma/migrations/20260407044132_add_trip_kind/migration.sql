-- CreateEnum
CREATE TYPE "TripKind" AS ENUM ('VACATION', 'WEDDING_EVENT');

-- AlterTable
ALTER TABLE "Itinerary" ADD COLUMN     "tripKind" "TripKind" NOT NULL DEFAULT 'VACATION';

-- CreateIndex
CREATE INDEX "Itinerary_visibility_tripKind_hotScore_idx" ON "Itinerary"("visibility", "tripKind", "hotScore" DESC);
