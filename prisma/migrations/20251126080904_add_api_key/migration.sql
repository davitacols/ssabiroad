/*
  Warnings:

  - You are about to drop the column `address` on the `Bookmark` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Bookmark` table. All the data in the column will be lost.
  - You are about to drop the column `locationId` on the `Bookmark` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Bookmark` table. All the data in the column will be lost.
  - You are about to drop the column `error` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `imageHash` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `progress` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `result` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `airQuality` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `architecturalStyle` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `buildingType` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `confidence` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `crowdDensity` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `culturalSignificance` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `formattedAddress` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `jobId` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `mapUrl` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `materialType` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `noiseLevel` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `photos` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `placeId` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `priceLevel` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `recognitionType` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `safetyScore` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `significantColors` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `timeOfDay` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `urbanDensity` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `vegetationDensity` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `waterProximity` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `weatherConditions` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `yearBuilt` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `coverImage` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `profileImage` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Building` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BuildingImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BuildingSimilarity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Detection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Photo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PhotoTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SavedLocation` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `latitude` on table `Location` required. This step will fail if there are existing NULL values in that column.
  - Made the column `longitude` on table `Location` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Building" DROP CONSTRAINT "Building_userId_fkey";

-- DropForeignKey
ALTER TABLE "BuildingImage" DROP CONSTRAINT "BuildingImage_buildingId_fkey";

-- DropForeignKey
ALTER TABLE "BuildingSimilarity" DROP CONSTRAINT "BuildingSimilarity_buildingId_fkey";

-- DropForeignKey
ALTER TABLE "BuildingSimilarity" DROP CONSTRAINT "BuildingSimilarity_similarToId_fkey";

-- DropForeignKey
ALTER TABLE "Detection" DROP CONSTRAINT "Detection_buildingId_fkey";

-- DropForeignKey
ALTER TABLE "Detection" DROP CONSTRAINT "Detection_userId_fkey";

-- DropForeignKey
ALTER TABLE "Location" DROP CONSTRAINT "Location_jobId_fkey";

-- DropForeignKey
ALTER TABLE "Location" DROP CONSTRAINT "Location_userId_fkey";

-- DropForeignKey
ALTER TABLE "PhotoTag" DROP CONSTRAINT "PhotoTag_photoId_fkey";

-- DropForeignKey
ALTER TABLE "SavedLocation" DROP CONSTRAINT "SavedLocation_userId_fkey";

-- DropIndex
DROP INDEX "Job_status_idx";

-- DropIndex
DROP INDEX "Job_userId_idx";

-- DropIndex
DROP INDEX "Location_jobId_idx";

-- DropIndex
DROP INDEX "Location_latitude_longitude_idx";

-- DropIndex
DROP INDEX "Location_userId_idx";

-- DropIndex
DROP INDEX "User_username_key";

-- AlterTable
ALTER TABLE "Bookmark" DROP COLUMN "address",
DROP COLUMN "category",
DROP COLUMN "locationId",
DROP COLUMN "name",
ADD COLUMN     "title" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ADD COLUMN     "url" TEXT,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "error",
DROP COLUMN "imageHash",
DROP COLUMN "progress",
DROP COLUMN "result",
DROP COLUMN "status",
ADD COLUMN     "company" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "remote" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "salary" TEXT,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "type" TEXT;

-- AlterTable
ALTER TABLE "Location" DROP COLUMN "airQuality",
DROP COLUMN "architecturalStyle",
DROP COLUMN "buildingType",
DROP COLUMN "category",
DROP COLUMN "confidence",
DROP COLUMN "crowdDensity",
DROP COLUMN "culturalSignificance",
DROP COLUMN "formattedAddress",
DROP COLUMN "jobId",
DROP COLUMN "mapUrl",
DROP COLUMN "materialType",
DROP COLUMN "noiseLevel",
DROP COLUMN "phoneNumber",
DROP COLUMN "photos",
DROP COLUMN "placeId",
DROP COLUMN "priceLevel",
DROP COLUMN "rating",
DROP COLUMN "recognitionType",
DROP COLUMN "safetyScore",
DROP COLUMN "significantColors",
DROP COLUMN "timeOfDay",
DROP COLUMN "urbanDensity",
DROP COLUMN "vegetationDensity",
DROP COLUMN "waterProximity",
DROP COLUMN "weatherConditions",
DROP COLUMN "website",
DROP COLUMN "yearBuilt",
ALTER COLUMN "latitude" SET NOT NULL,
ALTER COLUMN "longitude" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "coverImage",
DROP COLUMN "password",
DROP COLUMN "profileImage",
DROP COLUMN "role",
DROP COLUMN "username",
ALTER COLUMN "name" DROP NOT NULL;

-- DropTable
DROP TABLE "Building";

-- DropTable
DROP TABLE "BuildingImage";

-- DropTable
DROP TABLE "BuildingSimilarity";

-- DropTable
DROP TABLE "Detection";

-- DropTable
DROP TABLE "Photo";

-- DropTable
DROP TABLE "PhotoTag";

-- DropTable
DROP TABLE "SavedLocation";

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requests" INTEGER NOT NULL DEFAULT 0,
    "limit" INTEGER NOT NULL DEFAULT 10000,
    "lastUsed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "known_locations" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "phoneNumber" TEXT,
    "visualFeatures" JSONB,
    "franchiseId" TEXT,
    "verificationCount" INTEGER NOT NULL DEFAULT 1,
    "lastVerified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "known_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_cache" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_corrections" (
    "id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "correctAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imageFeatures" TEXT,
    "originalAddress" TEXT NOT NULL,
    "originalConfidence" DOUBLE PRECISION,
    "originalMethod" TEXT,

    CONSTRAINT "location_corrections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_feedback" (
    "id" TEXT NOT NULL,
    "recognitionId" TEXT NOT NULL,
    "wasCorrect" BOOLEAN NOT NULL,
    "correctAddress" TEXT,
    "correctLat" DOUBLE PRECISION,
    "correctLng" DOUBLE PRECISION,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_recognitions" (
    "id" TEXT NOT NULL,
    "businessName" TEXT,
    "detectedAddress" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "imageHash" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_recognitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "region_optimizations" (
    "id" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "searchHints" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "region_optimizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "ApiKey_key_idx" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "ApiKey_userId_idx" ON "ApiKey"("userId");

-- CreateIndex
CREATE INDEX "known_locations_businessName_idx" ON "known_locations"("businessName");

-- CreateIndex
CREATE INDEX "known_locations_franchiseId_idx" ON "known_locations"("franchiseId");

-- CreateIndex
CREATE UNIQUE INDEX "known_locations_businessName_latitude_longitude_key" ON "known_locations"("businessName", "latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "location_cache_query_key" ON "location_cache"("query");

-- CreateIndex
CREATE UNIQUE INDEX "location_feedback_recognitionId_key" ON "location_feedback"("recognitionId");

-- CreateIndex
CREATE INDEX "location_feedback_wasCorrect_idx" ON "location_feedback"("wasCorrect");

-- CreateIndex
CREATE INDEX "location_recognitions_imageHash_idx" ON "location_recognitions"("imageHash");

-- CreateIndex
CREATE INDEX "location_recognitions_method_idx" ON "location_recognitions"("method");

-- CreateIndex
CREATE INDEX "region_optimizations_countryCode_idx" ON "region_optimizations"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "region_optimizations_region_countryCode_key" ON "region_optimizations"("region", "countryCode");

-- CreateIndex
CREATE INDEX "Story_userId_idx" ON "Story"("userId");

-- CreateIndex
CREATE INDEX "Story_createdAt_idx" ON "Story"("createdAt");

-- CreateIndex
CREATE INDEX "Story_isPublic_idx" ON "Story"("isPublic");

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_feedback" ADD CONSTRAINT "location_feedback_recognitionId_fkey" FOREIGN KEY ("recognitionId") REFERENCES "location_recognitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
