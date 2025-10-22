import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Format data for chart - last 7 days
    const activityData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayCount = await prisma.location.count({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      });

      activityData.push({
        day: dayName,
        detections: dayCount
      });
    }

    return NextResponse.json(activityData);
  } catch (error) {
    console.error("Error fetching activity data:", error);
    // Return fallback data on error
    return NextResponse.json([
      { day: 'Mon', detections: 0 },
      { day: 'Tue', detections: 0 },
      { day: 'Wed', detections: 0 },
      { day: 'Thu', detections: 0 },
      { day: 'Fri', detections: 0 },
      { day: 'Sat', detections: 0 },
      { day: 'Sun', detections: 0 }
    ]);
  }
}