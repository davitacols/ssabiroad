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
    const user = await verifyToken(request);
    
    // Get current date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Get total counts
    const [totalLocations, totalBookmarks] = await Promise.all([
      prisma.location.count(),
      prisma.bookmark.count()
    ]);

    // Get recent activity (last 24 hours)
    const recentDetections = await prisma.location.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    });

    // Calculate weekly growth
    const [thisWeekCount, lastWeekCount] = await Promise.all([
      prisma.location.count({
        where: {
          createdAt: {
            gte: weekAgo
          }
        }
      }),
      prisma.location.count({
        where: {
          createdAt: {
            gte: twoWeeksAgo,
            lt: weekAgo
          }
        }
      })
    ]);

    const weeklyGrowth = lastWeekCount > 0 
      ? Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100)
      : thisWeekCount > 0 ? 100 : 0;

    // Calculate success rate (locations with valid coordinates)
    const validLocations = await prisma.location.count({
      where: {
        AND: [
          { latitude: { not: 0 } },
          { longitude: { not: 0 } }
        ]
      }
    });

    const successRate = totalLocations > 0 
      ? Math.round((validLocations / totalLocations) * 100)
      : 0;

    const stats = {
      totalDetections: totalLocations,
      totalLocations: totalLocations,
      totalBookmarks,
      recentDetections,
      successRate,
      weeklyGrowth: Math.max(weeklyGrowth, 0)
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    // Return fallback data on error
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

