import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

    const [
      totalLocations,
      totalUsers,
      totalBookmarks,
      todayLocations,
      yesterdayLocations,
      weekLocations,
      monthLocations,
      yearLocations,
      validLocations,
      locationsWithAddress,
      geofences,
      activeGeofences
    ] = await Promise.all([
      prisma.location.count(),
      prisma.user.count(),
      prisma.bookmark.count(),
      prisma.location.count({ where: { createdAt: { gte: today } } }),
      prisma.location.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
      prisma.location.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.location.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.location.count({ where: { createdAt: { gte: yearAgo } } }),
      prisma.location.count({
        where: {
          AND: [
            { latitude: { not: 0 } },
            { longitude: { not: 0 } },
            { latitude: { gte: -90, lte: 90 } },
            { longitude: { gte: -180, lte: 180 } }
          ]
        }
      }),
      prisma.location.count({
        where: {
          address: { not: '' }
        }
      }),
      prisma.geofence.count(),
      prisma.geofence.count({ where: { active: true } })
    ]);

    let totalPhotos = 0;
    let processedPhotos = 0;
    try {
      totalPhotos = await prisma.photo.count();
      processedPhotos = await prisma.photo.count({ where: { processed: true } });
    } catch (e) {
      console.log('Photo model not available');
    }

    const dailyGrowth = yesterdayLocations > 0
      ? ((todayLocations - yesterdayLocations) / yesterdayLocations) * 100
      : todayLocations > 0 ? 100 : 0;

    const weeklyGrowth = weekLocations > 0 ? (weekLocations / 7) : 0;
    const monthlyGrowth = monthLocations > 0 ? (monthLocations / 30) : 0;

    const successRate = totalLocations > 0 ? (validLocations / totalLocations) * 100 : 0;
    const addressCompleteness = totalLocations > 0 ? (locationsWithAddress / totalLocations) * 100 : 0;
    const photoProcessingRate = totalPhotos > 0 ? (processedPhotos / totalPhotos) * 100 : 0;

    const topLocations = await prisma.location.groupBy({
      by: ['name'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
      where: {
        name: { not: '' }
      }
    });

    let topUsers = [];
    try {
      const userActivity = await prisma.location.groupBy({
        by: ['userId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
        where: {
          userId: { not: null }
        }
      });

      const userDetails = await prisma.user.findMany({
        where: {
          id: { in: userActivity.map(u => u.userId) }
        },
        select: {
          id: true,
          name: true,
          email: true
        }
      });

      topUsers = userActivity.map(activity => {
        const user = userDetails.find(u => u.id === activity.userId);
        return {
          userId: activity.userId,
          userName: user?.name || user?.email || 'Unknown',
          locationCount: activity._count.id
        };
      });
    } catch (e) {
      console.log('User activity grouping failed:', e.message);
    }

    const analytics = {
      overview: {
        totalLocations,
        totalUsers,
        totalBookmarks,
        totalPhotos,
        processedPhotos,
        validLocations,
        geofences,
        activeGeofences
      },
      timeRanges: {
        today: todayLocations,
        yesterday: yesterdayLocations,
        week: weekLocations,
        month: monthLocations,
        year: yearLocations
      },
      growth: {
        daily: Math.round(dailyGrowth * 100) / 100,
        weeklyAverage: Math.round(weeklyGrowth * 100) / 100,
        monthlyAverage: Math.round(monthlyGrowth * 100) / 100
      },
      quality: {
        successRate: Math.round(successRate * 100) / 100,
        addressCompleteness: Math.round(addressCompleteness * 100) / 100,
        photoProcessingRate: Math.round(photoProcessingRate * 100) / 100
      },
      topLocations: topLocations.map(loc => ({
        name: loc.name,
        count: loc._count.id
      })),
      topUsers
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Analytics overview error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
