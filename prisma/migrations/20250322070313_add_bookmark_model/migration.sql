/*
  Warnings:

  - Made the column `name` on table `Location` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address` on table `Location` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "airQuality" TEXT,
ADD COLUMN     "buildingType" TEXT,
ADD COLUMN     "crowdDensity" TEXT,
ADD COLUMN     "formattedAddress" TEXT,
ADD COLUMN     "mapUrl" TEXT,
ADD COLUMN     "noiseLevel" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "placeId" TEXT,
ADD COLUMN     "priceLevel" INTEGER,
ADD COLUMN     "rating" DOUBLE PRECISION,
ADD COLUMN     "safetyScore" DOUBLE PRECISION,
ADD COLUMN     "significantColors" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "timeOfDay" TEXT,
ADD COLUMN     "urbanDensity" TEXT,
ADD COLUMN     "vegetationDensity" TEXT,
ADD COLUMN     "waterProximity" TEXT,
ADD COLUMN     "weatherConditions" TEXT,
ADD COLUMN     "website" TEXT,
ALTER COLUMN "latitude" DROP NOT NULL,
ALTER COLUMN "longitude" DROP NOT NULL,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "recognitionType" SET DEFAULT 'unknown';

-- CreateIndex
CREATE INDEX "Location_userId_idx" ON "Location"("userId");
