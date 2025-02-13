// app/api/stats/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Example statistics data
    const statsData = {
      totalDetections: 123,
      savedBuildings: 45,
      detectionAccuracy: 87.5,
      detectionHistory: 150,
    };
    return NextResponse.json(statsData);
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json({ message: "Failed to fetch stats" }, { status: 500 });
  }
}
