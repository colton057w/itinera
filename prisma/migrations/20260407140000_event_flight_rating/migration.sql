-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "ratingStars" INTEGER,
ADD COLUMN     "airline" TEXT,
ADD COLUMN     "departureAirportCode" TEXT,
ADD COLUMN     "arrivalAirportCode" TEXT,
ADD COLUMN     "departureAirportName" TEXT,
ADD COLUMN     "arrivalAirportName" TEXT;
