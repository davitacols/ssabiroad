import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const promises = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      promises.push(
        prisma.location_recognitions.count({
          where: {
            createdAt: {
              gte: dayStart,
              lte: dayEnd
            }
          }
        }).then(count => ({
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          date: dayStart.toISOString().split('T')[0],
          detections: count
        }))
      );
    }

    const activityData = await Promise.all(promises);
    return NextResponse.json(activityData);
  } catch (error) {
    console.error("Error fetching activity data:", error);
    const fallback = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      fallback.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.toISOString().split('T')[0],
        detections: 0
      });
    }
    return NextResponse.json(fallback, { status: 500 });
  }
}