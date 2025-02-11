import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Import auth options
import prisma from '@/lib/db';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Get current and previous month dates
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Fetch counts for current and previous month
    const [currentMonthDetections, previousMonthDetections] = await Promise.all([
      prisma.detection.count({
        where: { userId: user.id, createdAt: { gte: currentMonthStart } }
      }),
      prisma.detection.count({
        where: { userId: user.id, createdAt: { gte: previousMonthStart, lt: currentMonthStart } }
      })
    ]);

    // Fetch saved locations count
    const [currentMonthSaved, previousMonthSaved] = await Promise.all([
      prisma.savedLocation.count({
        where: { userId: user.id, createdAt: { gte: currentMonthStart } }
      }),
      prisma.savedLocation.count({
        where: { userId: user.id, createdAt: { gte: previousMonthStart, lt: currentMonthStart } }
      })
    ]);

    // Fetch confidence averages
    const [currentMonthAccuracy, previousMonthAccuracy] = await Promise.all([
      prisma.detection.aggregate({
        where: { userId: user.id, createdAt: { gte: currentMonthStart } },
        _avg: { confidence: true }
      }),
      prisma.detection.aggregate({
        where: { userId: user.id, createdAt: { gte: previousMonthStart, lt: currentMonthStart } },
        _avg: { confidence: true }
      })
    ]);

    // Ensure accuracy values are valid
    const currentConfidence = currentMonthAccuracy._avg?.confidence ?? 0;
    const previousConfidence = previousMonthAccuracy._avg?.confidence ?? 0;

    // Calculate percentage changes
    const detectionChange = previousMonthDetections === 0 ? 0 : 
      ((currentMonthDetections - previousMonthDetections) / previousMonthDetections) * 100;

    const savedChange = previousMonthSaved === 0 ? 0 : 
      ((currentMonthSaved - previousMonthSaved) / previousMonthSaved) * 100;

    const accuracyChange = previousConfidence === 0 ? 0 : 
      ((currentConfidence - previousConfidence) / previousConfidence) * 100;

    const stats = {
      totalDetections: currentMonthDetections,
      detectionChange: Number(detectionChange.toFixed(1)),
      savedBuildings: currentMonthSaved,
      savedBuildingsChange: Number(savedChange.toFixed(1)),
      accuracy: Number((currentConfidence * 100).toFixed(1)),
      accuracyChange: Number(accuracyChange.toFixed(1)),
      recentDetections: currentMonthDetections,
      historyChange: detectionChange
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
