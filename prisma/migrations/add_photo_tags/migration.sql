-- CreateTable
CREATE TABLE "PhotoTag" (
    "id" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "tagType" TEXT NOT NULL,
    "tagValue" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "coordinates" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhotoTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3),
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhotoTag_photoId_idx" ON "PhotoTag"("photoId");
CREATE INDEX "PhotoTag_tagType_idx" ON "PhotoTag"("tagType");
CREATE INDEX "Photo_userId_idx" ON "Photo"("userId");
CREATE INDEX "Photo_processed_idx" ON "Photo"("processed");

-- AddForeignKey
ALTER TABLE "PhotoTag" ADD CONSTRAINT "PhotoTag_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;