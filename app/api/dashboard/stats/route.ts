import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalLocations, totalBookmarks, totalUsers] = await Promise.all([
      prisma.location.count(),
      prisma.bookmark.count(),
      prisma.user.count()
    ]);

    let totalPhotos = 0;
    let processedPhotos = 0;
    try {
      totalPhotos = await prisma.photo.count();
      processedPhotos = await prisma.photo.count({ where: { processed: true } });
    } catch (e) {
      console.log('Photo model not available');
    }

    const recentDetections = await prisma.location.count({
      where: { createdAt: { gte: today } }
    });

    const [thisWeekCount, lastWeekCount] = await Promise.all([
      prisma.location.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.location.count({ where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } } })
    ]);

    const weeklyGrowth = lastWeekCount > 0 
      ? Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100)
      : thisWeekCount > 0 ? 100 : 0;

    const validLocations = await prisma.location.count({
      where: {
        AND: [
          { latitude: { not: 0 } },
          { longitude: { not: 0 } },
          { latitude: { gte: -90, lte: 90 } },
          { longitude: { gte: -180, lte: 180 } }
        ]
      }
    });

    const successRate = totalLocations > 0 
      ? Math.round((validLocations / totalLocations) * 100)
      : 0;

    const monthlyDetections = await prisma.location.count({
      where: { createdAt: { gte: monthAgo } }
    });



    const stats = {
      totalDetections: totalLocations,
      totalLocations,
      totalBookmarks,
      totalUsers,
      totalPhotos,
      processedPhotos,
      recentDetections,
      successRate,
      weeklyGrowth: Math.max(weeklyGrowth, 0),
      monthlyDetections,
      validLocations
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({
      totalDetections: 0,
      totalLocations: 0,
      totalBookmarks: 0,
      totalUsers: 0,
      totalPhotos: 0,
      processedPhotos: 0,
      recentDetections: 0,
      successRate: 0,
      weeklyGrowth: 0,
      monthlyDetections: 0,
      validLocations: 0
    }, { status: 500 });
  }
}

