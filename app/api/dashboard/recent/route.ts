import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');
    
    const recentRecognitions = await prisma.location_recognitions.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        businessName: true,
        detectedAddress: true,
        createdAt: true,
        latitude: true,
        longitude: true,
        confidence: true,
        method: true,
        userId: true
      }
    });

    const detections = recentRecognitions.map(recognition => ({
      id: recognition.id,
      name: recognition.businessName || 'Unknown Location',
      address: recognition.detectedAddress || 'Address not available',
      confidence: recognition.confidence,
      timeAgo: getTimeAgo(recognition.createdAt),
      method: recognition.method
    }));

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