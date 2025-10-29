import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');
    
    const recentLocations = await prisma.location.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        address: true,
        createdAt: true,
        latitude: true,
        longitude: true,
        walkScore: true,
        bikeScore: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    const detections = recentLocations.map(location => {
      const hasValidCoords = 
        location.latitude !== 0 && 
        location.longitude !== 0 &&
        location.latitude >= -90 && 
        location.latitude <= 90 &&
        location.longitude >= -180 && 
        location.longitude <= 180;
      
      const hasAddress = location.address && location.address.length > 0;
      const hasScores = location.walkScore || location.bikeScore;
      
      let confidence = 0.5;
      if (hasValidCoords) confidence += 0.3;
      if (hasAddress) confidence += 0.15;
      if (hasScores) confidence += 0.05;
      
      return {
        id: location.id,
        name: location.name || 'Unknown Location',
        address: location.address || 'Address not available',
        confidence: Math.min(confidence, 0.99),
        timeAgo: getTimeAgo(location.createdAt),
        coordinates: hasValidCoords ? {
          latitude: location.latitude,
          longitude: location.longitude
        } : null,
        userName: location.user?.name || 'Anonymous'
      };
    });

    return NextResponse.json(detections);
  } catch (error) {
    console.error('Recent detections error:', error);
    return NextResponse.json([], { status: 500 });
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - new Date(date).getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return new Date(date).toLocaleDateString();
}