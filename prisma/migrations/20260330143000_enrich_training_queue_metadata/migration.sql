ALTER TABLE "TrainingQueue"
ADD COLUMN "imageHash" TEXT,
ADD COLUMN "recognitionId" TEXT,
ADD COLUMN "businessName" TEXT,
ADD COLUMN "source" TEXT,
ADD COLUMN "labelQuality" TEXT,
ADD COLUMN "confidence" DOUBLE PRECISION,
ADD COLUMN "metadata" JSONB;

CREATE INDEX "TrainingQueue_imageHash_idx" ON "TrainingQueue"("imageHash");
CREATE INDEX "TrainingQueue_recognitionId_idx" ON "TrainingQueue"("recognitionId");
CREATE INDEX "TrainingQueue_source_idx" ON "TrainingQueue"("source");
CREATE INDEX "TrainingQueue_labelQuality_idx" ON "TrainingQueue"("labelQuality");
