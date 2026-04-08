-- CreateEnum
CREATE TYPE "CuratedExperienceKind" AS ENUM ('ACTIVITY', 'MEAL', 'STAY', 'TRANSIT');

-- CreateTable
CREATE TABLE "CuratedCity" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "heroImageUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CuratedCity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuratedExperience" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "experienceKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "locationLabel" TEXT NOT NULL,
    "storyKind" "CuratedExperienceKind" NOT NULL DEFAULT 'ACTIVITY',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CuratedExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuratedAttraction" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CuratedAttraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketFlightDeal" (
    "id" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "subline" TEXT,
    "originCode" TEXT,
    "destCode" TEXT,
    "priceHint" TEXT,
    "tag" TEXT,
    "source" TEXT NOT NULL DEFAULT 'seed',
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MarketFlightDeal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CuratedCity_slug_key" ON "CuratedCity"("slug");

-- CreateIndex
CREATE INDEX "CuratedExperience_cityId_sortOrder_idx" ON "CuratedExperience"("cityId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CuratedExperience_cityId_experienceKey_key" ON "CuratedExperience"("cityId", "experienceKey");

-- CreateIndex
CREATE INDEX "CuratedAttraction_cityId_sortOrder_idx" ON "CuratedAttraction"("cityId", "sortOrder");

-- CreateIndex
CREATE INDEX "MarketFlightDeal_sortOrder_idx" ON "MarketFlightDeal"("sortOrder");

-- AddForeignKey
ALTER TABLE "CuratedExperience" ADD CONSTRAINT "CuratedExperience_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "CuratedCity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuratedAttraction" ADD CONSTRAINT "CuratedAttraction_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "CuratedCity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
