-- CreateTable
CREATE TABLE "Geofence" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radius" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,
    "notifyOnEnter" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnExit" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastStatus" TEXT,
    "lastTriggered" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Geofence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Geofence_userId_idx" ON "Geofence"("userId");
CREATE INDEX "Geofence_active_idx" ON "Geofence"("active");
