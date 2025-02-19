-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "type" TEXT NOT NULL,
    "architecture" TEXT[],
    "materials" TEXT[],
    "style" TEXT[],
    "condition" TEXT,
    "dominantColors" TEXT[],
    "brightness" DOUBLE PRECISION,
    "contrast" DOUBLE PRECISION,
    "safetyScore" DOUBLE PRECISION,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Detection" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "buildingName" TEXT,
    "description" TEXT,
    "address" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "architecture" TEXT[],
    "materials" TEXT[],
    "styles" TEXT[],
    "imageUrl" TEXT,
    "rawResult" JSONB,
    "userId" TEXT NOT NULL,
    "buildingId" TEXT,

    CONSTRAINT "Detection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedLocation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "visits" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,

    CONSTRAINT "SavedLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuildingImage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "buildingId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,

    CONSTRAINT "BuildingImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuildingSimilarity" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "similarToId" TEXT NOT NULL,
    "similarity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BuildingSimilarity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Building_latitude_longitude_idx" ON "Building"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Detection_latitude_longitude_idx" ON "Detection"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Detection_userId_idx" ON "Detection"("userId");

-- CreateIndex
CREATE INDEX "Detection_buildingId_idx" ON "Detection"("buildingId");

-- CreateIndex
CREATE INDEX "SavedLocation_latitude_longitude_idx" ON "SavedLocation"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "SavedLocation_userId_idx" ON "SavedLocation"("userId");

-- CreateIndex
CREATE INDEX "BuildingImage_buildingId_idx" ON "BuildingImage"("buildingId");

-- CreateIndex
CREATE INDEX "BuildingSimilarity_buildingId_idx" ON "BuildingSimilarity"("buildingId");

-- CreateIndex
CREATE INDEX "BuildingSimilarity_similarToId_idx" ON "BuildingSimilarity"("similarToId");

-- CreateIndex
CREATE UNIQUE INDEX "BuildingSimilarity_buildingId_similarToId_key" ON "BuildingSimilarity"("buildingId", "similarToId");

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Detection" ADD CONSTRAINT "Detection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Detection" ADD CONSTRAINT "Detection_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedLocation" ADD CONSTRAINT "SavedLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildingImage" ADD CONSTRAINT "BuildingImage_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildingSimilarity" ADD CONSTRAINT "BuildingSimilarity_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildingSimilarity" ADD CONSTRAINT "BuildingSimilarity_similarToId_fkey" FOREIGN KEY ("similarToId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
