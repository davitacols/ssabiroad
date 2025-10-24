import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Test database connection
    const photoCount = await prisma.photo.count();
    
    return NextResponse.json({
      success: true,
      message: 'Photo tagging API is working',
      photoCount,
      hasVisionKey: !!process.env.GOOGLE_VISION_API_KEY,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      details: 'Database or environment issue',
    }, { status: 500 });
  }
}