import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [totalDetections, totalBookmarks] = await Promise.all([
      prisma.location_recognitions.count(),
      prisma.bookmark.count()
    ]);

    const recentDetections = await prisma.location_recognitions.count({
      where: { createdAt: { gte: today } }
    });

    const [thisWeekCount, lastWeekCount] = await Promise.all([
      prisma.location_recognitions.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.location_recognitions.count({ where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } } })
    ]);

    const weeklyGrowth = lastWeekCount > 0 
      ? Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100)
      : thisWeekCount > 0 ? 100 : 0;

    const validLocations = await prisma.location_recognitions.count({
      where: {
        AND: [
          { latitude: { not: 0 } },
          { longitude: { not: 0 } },
          { latitude: { gte: -90, lte: 90 } },
          { longitude: { gte: -180, lte: 180 } }
        ]
      }
    });

    const successRate = totalDetections > 0 
      ? Math.round((validLocations / totalDetections) * 100)
      : 0;

    const stats = {
      totalDetections,
      totalLocations: validLocations,
      totalBookmarks,
      recentDetections,
      successRate,
      weeklyGrowth: Math.max(weeklyGrowth, 0)
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({
      totalDetections: 0,
      totalLocations: 0,
      totalBookmarks: 0,
      recentDetections: 0,
      successRate: 0,
      weeklyGrowth: 0
    }, { status: 500 });
  }
}

