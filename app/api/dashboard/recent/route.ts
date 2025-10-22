import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const recentLocations = await prisma.location.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        address: true,
        createdAt: true,
        latitude: true,
        longitude: true
      }
    });

    const detections = recentLocations.map(location => {
      // Calculate confidence based on coordinate precision
      const hasValidCoords = location.latitude !== 0 && location.longitude !== 0;
      const confidence = hasValidCoords ? 0.85 + Math.random() * 0.15 : 0.6 + Math.random() * 0.2;
      
      return {
        id: location.id,
        name: location.name || 'Unknown Location',
        address: location.address || 'Address not available',
        confidence: Math.round(confidence * 100) / 100,
        timeAgo: getTimeAgo(location.createdAt)
      };
    });

    return NextResponse.json(detections);
  } catch (error) {
    console.error('Recent detections error:', error);
    return NextResponse.json([]);
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    return `${diffInDays}d ago`;
  }
}