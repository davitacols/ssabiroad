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
    const payload = await verifyToken(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = payload.id;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const detections = await prisma.detection.findMany({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        createdAt: true,
      },
    });

    // Group detections by day and count occurrences
    const stats = detections.reduce((acc, detection) => {
      const day = detection.createdAt.toLocaleDateString("en-US", { weekday: "short" });
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    // Convert the stats object into an array of { day, detections }
    const statsArray = Object.entries(stats).map(([day, detections]) => ({ day, detections }));

    return NextResponse.json(statsArray);
  } catch (error) {
    console.error("Error fetching usage stats:", error);
    return NextResponse.json({ error: "Failed to fetch usage stats" }, { status: 500 });
  }
}
