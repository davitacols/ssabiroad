import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: Request) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Get past 7 days
    const now = new Date();
    const lastWeekStart = new Date();
    lastWeekStart.setDate(now.getDate() - 6); // Start from 6 days ago

    // Fetch daily detection counts
    const detections = await prisma.detection.groupBy({
      by: ['createdAt'],
      where: {
        userId: user.id,
        createdAt: { gte: lastWeekStart }
      },
      _count: {
        _all: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Format data to match weekdays
    const usageData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const day = date.toLocaleDateString('en-US', { weekday: 'short' });

      // Find matching detection count for this day
      const detection = detections.find(d =>
        new Date(d.createdAt).toDateString() === date.toDateString()
      );

      return {
        day,
        detections: detection?._count._all || 0
      };
    }).reverse(); // Reverse to show earliest dates first

    return NextResponse.json(usageData);
  } catch (error) {
    console.error('Error fetching usage data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
