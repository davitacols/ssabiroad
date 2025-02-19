import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export async function GET(req: NextRequest) {
  console.log("=== Fetching Recent Detections ===");

  try {
    // ✅ 1. Validate JWT secret
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET not found in environment variables");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // ✅ 2. Get token from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Authorization header missing or malformed");
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      console.log("No token provided");
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // ✅ 3. Verify and decode the token
    let decodedToken: JwtPayload;
    try {
      decodedToken = jwt.verify(token, jwtSecret) as JwtPayload;
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // ✅ 4. Fetch detections for the authenticated user
    console.log(`Fetching detections for user: ${decodedToken.userId}`);
    const recentDetections = await prisma.detection.findMany({
      where: { userId: decodedToken.userId },
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    // ✅ 5. Handle empty result case
    if (!recentDetections || recentDetections.length === 0) {
      console.log("No detections found for this user.");
      return NextResponse.json({ detections: [] }, { status: 200 });
    }

    // ✅ 6. Format detections properly before sending response
    const formattedDetections = recentDetections.map((detection) => ({
      id: detection.id,
      buildingName: detection.buildingName || "Unknown Building",
      address: detection.address || "No address available",
      confidence: detection.confidence || 0,
      timestamp: detection.createdAt.toISOString(),
      features: detection.features || [],
      coordinates: detection.lat && detection.lng ? { lat: detection.lat, lng: detection.lng } : null,
      imageUrl: detection.imageUrl || null,
    }));

    return NextResponse.json({ detections: formattedDetections }, { status: 200 });
  } catch (error) {
    console.error("Error fetching recent detections:", error);

    return NextResponse.json(
      { error: "Failed to fetch recent detections" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
