import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

interface JwtPayload {
  id: string;
  email: string;
  username: string;
  role: string;
}

// Verify JWT from cookies
async function verifyToken(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return null;

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT secret is missing");
      return null;
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const recentDetections = await prisma.detection.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    const formattedDetections = recentDetections.map((detection) => ({
      id: detection.id,
      building: detection.buildingName || "Unknown Building",
      time: detection.createdAt.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      confidence: detection.confidence,
      description: detection.description,
      address: detection.address,
      architecture: detection.architecture,
      materials: detection.materials,
      styles: detection.styles,
      imageUrl: detection.imageUrl,
    }));

    return NextResponse.json(formattedDetections);
  } catch (error) {
    console.error("Error fetching recent detections:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent detections" },
      { status: 500 }
    );
  }
}
