import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Mock recent detections data
    const mockDetections = [
      {
        id: "1",
        name: "Empire State Building",
        address: "350 5th Ave, New York, NY",
        confidence: 0.95,
        timeAgo: "2m ago"
      },
      {
        id: "2",
        name: "Golden Gate Bridge",
        address: "Golden Gate Bridge, San Francisco, CA",
        confidence: 0.92,
        timeAgo: "5m ago"
      },
      {
        id: "3",
        name: "Statue of Liberty",
        address: "Liberty Island, New York, NY",
        confidence: 0.88,
        timeAgo: "12m ago"
      },
      {
        id: "4",
        name: "Times Square",
        address: "Times Square, New York, NY",
        confidence: 0.91,
        timeAgo: "18m ago"
      },
      {
        id: "5",
        name: "Central Park",
        address: "Central Park, New York, NY",
        confidence: 0.85,
        timeAgo: "25m ago"
      }
    ];

    return NextResponse.json(mockDetections);
  } catch (error) {
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