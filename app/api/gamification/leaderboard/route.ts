import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    // Get total verified images
    const totalImages = await prisma.landmarkImages.count({ where: { verified: true } });

    // Get top 10 contributors
    const contributions = await prisma.landmarkImages.groupBy({
      by: ['contributorId'],
      where: { verified: true },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });

    const leaderboard = contributions.map((c, index) => ({
      rank: index + 1,
      contributorId: c.contributorId.substring(0, 8) + '***',
      contributions: c._count.id,
      points: c._count.id * 10,
      badge: getBadge(c._count.id)
    }));

    // Get user stats if deviceId provided
    let userStats = null;
    if (deviceId) {
      const userCount = await prisma.landmarkImages.count({
        where: { contributorId: deviceId, verified: true }
      });
      userStats = {
        contributions: userCount,
        points: userCount * 10,
        badge: getBadge(userCount)
      };
    }

    return NextResponse.json({
      success: true,
      leaderboard,
      userStats,
      globalStats: {
        totalImages,
        target: 50000,
        progress: (totalImages / 50000) * 100
      }
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}

function getBadge(contributions: number): { name: string; icon: string; color: string } {
  if (contributions >= 500) return { name: 'Platinum Explorer', icon: '💎', color: '#E5E4E2' };
  if (contributions >= 100) return { name: 'Gold Traveler', icon: '🏆', color: '#FFD700' };
  if (contributions >= 50) return { name: 'Silver Navigator', icon: '🥈', color: '#C0C0C0' };
  if (contributions >= 10) return { name: 'Bronze Scout', icon: '🥉', color: '#CD7F32' };
  return { name: 'Beginner', icon: '🌟', color: '#94A3B8' };
}
