import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = parseFloat(searchParams.get('latitude') || '0');
    const longitude = parseFloat(searchParams.get('longitude') || '0');
    const radius = parseFloat(searchParams.get('radius') || '5');

    if (!latitude || !longitude) {
      return NextResponse.json({ buildings: [] });
    }

    const buildings = await prisma.location.findMany({
      where: {
        latitude: {
          gte: latitude - radius / 111,
          lte: latitude + radius / 111,
        },
        longitude: {
          gte: longitude - radius / (111 * Math.cos(latitude * Math.PI / 180)),
          lte: longitude + radius / (111 * Math.cos(latitude * Math.PI / 180)),
        },
      },
      take: 50,
    });

    const buildingsWithDistance = buildings.map(building => ({
      ...building,
      distance: calculateDistance(latitude, longitude, building.latitude, building.longitude),
    })).filter(b => b.distance <= radius);

    return NextResponse.json({ buildings: buildingsWithDistance });
  } catch (error) {
    console.error('Nearby buildings error:', error);
    return NextResponse.json({ buildings: [], error: 'Failed to fetch nearby buildings' });
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
