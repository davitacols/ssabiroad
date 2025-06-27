import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL
    }
  }
});

interface JwtPayload {
  id: string;
  email: string;
  username: string;
  role: string;
}

async function verifyToken(request: NextRequest): Promise<JwtPayload | null> {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return null;

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return null;

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Use mock data for now due to database connection issues
    const stats = {
      totalDetections: 1247,
      totalLocations: 892,
      totalBookmarks: 156,
      recentDetections: 23,
      successRate: 87,
      weeklyGrowth: 12
    };

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({
      totalDetections: 0,
      totalLocations: 0,
      totalBookmarks: 0,
      recentDetections: 0,
      successRate: 0,
      weeklyGrowth: 0
    });
  }
}

