import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { buildingIds } = await request.json();

    if (!buildingIds || buildingIds.length < 2) {
      return NextResponse.json({ error: 'At least 2 building IDs required' }, { status: 400 });
    }

    const buildings = await prisma.location.findMany({
      where: { id: { in: buildingIds } },
    });

    const comparison = {
      buildings: buildings.map(b => ({
        id: b.id,
        name: b.name,
        address: b.address,
        latitude: b.latitude,
        longitude: b.longitude,
      })),
      metrics: {
        averageDistance: calculateAverageDistance(buildings),
        similarities: calculateSimilarities(buildings),
      },
    };

    return NextResponse.json(comparison);
  } catch (error) {
    console.error('Building comparison error:', error);
    return NextResponse.json({ error: 'Failed to compare buildings' }, { status: 500 });
  }
}

function calculateAverageDistance(buildings: any[]): number {
  let totalDistance = 0;
  let count = 0;

  for (let i = 0; i < buildings.length; i++) {
    for (let j = i + 1; j < buildings.length; j++) {
      totalDistance += calculateDistance(
        buildings[i].latitude,
        buildings[i].longitude,
        buildings[j].latitude,
        buildings[j].longitude
      );
      count++;
    }
  }

  return count > 0 ? totalDistance / count : 0;
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

function calculateSimilarities(buildings: any[]): any[] {
  return buildings.map((b, i) => ({
    buildingId: b.id,
    similarTo: buildings.filter((_, j) => i !== j).map(other => other.id),
  }));
}
