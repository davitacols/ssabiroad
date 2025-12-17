-- CreateTable
CREATE TABLE IF NOT EXISTS "TrainingData" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "buildingType" TEXT,
    "landmark" TEXT,
    "source" TEXT NOT NULL DEFAULT 'user_upload',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingData_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TrainingData_source_idx" ON "TrainingData"("source");
CREATE INDEX IF NOT EXISTS "TrainingData_verified_idx" ON "TrainingData"("verified");
