import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const detections = await prisma.detection.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        building: true
      }
    });

    const formattedDetections = detections.map((detection) => ({
      id: detection.id,
      buildingName: detection.buildingName || "Unknown Building",
      address: detection.address || "Unknown Address",
      confidence: detection.confidence,
      timestamp: detection.createdAt.toISOString(),
      features: [
        ...(detection.architecture || []),
        ...(detection.materials || []),
        ...(detection.styles || [])
      ],
      coordinates: {
        lat: detection.latitude,
        lng: detection.longitude
      }
    }));

    return NextResponse.json({ detections: formattedDetections });
  } catch (error) {
    console.error("Error fetching detections:", error);
    return NextResponse.json(
      { error: "Failed to fetch detections" },
      { status: 500 }
    );
  }
}