import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [totalLocations, todayCount, weekCount, validLocations] = await Promise.all([
      prisma.location.count(),
      prisma.location.count({ where: { createdAt: { gte: today } } }),
      prisma.location.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.location.count({
        where: {
          AND: [
            { latitude: { not: 0 } },
            { longitude: { not: 0 } },
            { latitude: { gte: -90, lte: 90 } },
            { longitude: { gte: -180, lte: 180 } }
          ]
        }
      })
    ]);

    let totalPhotos = 0;
    let processedPhotos = 0;
    try {
      totalPhotos = await prisma.photo.count();
      processedPhotos = await prisma.photo.count({ where: { processed: true } });
    } catch (e) {
      console.log('Photo model not available');
    }

    const avgConfidence = totalLocations > 0 ? validLocations / totalLocations : 0;

    let avgWalkScore = 0;
    let avgBikeScore = 0;
    try {
      const locationsWithScores = await prisma.location.findMany({
        where: {
          OR: [
            { walkScore: { not: null } },
            { bikeScore: { not: null } }
          ]
        },
        select: {
          walkScore: true,
          bikeScore: true
        }
      });

      if (locationsWithScores.length > 0) {
        avgWalkScore = locationsWithScores.reduce((sum, loc) => sum + (loc.walkScore || 0), 0) / locationsWithScores.length;
        avgBikeScore = locationsWithScores.reduce((sum, loc) => sum + (loc.bikeScore || 0), 0) / locationsWithScores.length;
      }
    } catch (e) {
      console.log('Score columns not available');
    }

    const response = {
      totalLocations,
      v1Count: 0,
      v2Count: totalLocations,
      avgConfidence,
      todayCount,
      weekCount,
      validLocations,
      totalPhotos,
      processedPhotos,
      avgWalkScore: Math.round(avgWalkScore),
      avgBikeScore: Math.round(avgBikeScore),
      methods: [
        { method: 'gps-enhanced', count: validLocations },
        { method: 'ai-detection', count: totalLocations - validLocations }
      ],
      topDevices: []
    };
    
    return NextResponse.json(response, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}