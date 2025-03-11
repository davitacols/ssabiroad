-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "name" TEXT,
    "address" TEXT,
    "confidence" DOUBLE PRECISION,
    "userId" TEXT,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Location_latitude_longitude_idx" ON "Location"("latitude", "longitude");

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
