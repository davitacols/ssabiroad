import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const days = parseInt(request.nextUrl.searchParams.get('days') || '30');
    const trends = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      trends.push({
        date: dayStart,
        dayStart,
        dayEnd
      });
    }

    const results = await Promise.all(
      trends.map(async ({ date, dayStart, dayEnd }) => {
        const [locations, users, bookmarks] = await Promise.all([
          prisma.location.count({
            where: { createdAt: { gte: dayStart, lte: dayEnd } }
          }),
          prisma.user.count({
            where: { createdAt: { gte: dayStart, lte: dayEnd } }
          }),
          prisma.bookmark.count({
            where: { createdAt: { gte: dayStart, lte: dayEnd } }
          })
        ]);

        let photos = 0;
        try {
          photos = await prisma.photo.count({
            where: { createdAt: { gte: dayStart, lte: dayEnd } }
          });
        } catch (e) {
          // Photo model not available
        }

        return {
          date: date.toISOString().split('T')[0],
          locations,
          users,
          bookmarks,
          photos,
          total: locations + users + bookmarks + photos
        };
      })
    );

    return NextResponse.json({
      period: `${days} days`,
      data: results
    });
  } catch (error) {
    console.error('Analytics trends error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trends', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
