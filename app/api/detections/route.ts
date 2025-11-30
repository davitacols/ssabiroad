import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  if (!checkRateLimit(request, 100, 60000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    const detections = await prisma.location_recognitions.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: "desc" },
      take: 100
    });

    return NextResponse.json(
      { detections },
      { headers: getRateLimitHeaders(request, 100) }
    );
  } catch (error) {
    console.error("Error fetching detections:", error);
    return NextResponse.json(
      { error: "Failed to fetch detections" },
      { status: 500 }
    );
  }
}