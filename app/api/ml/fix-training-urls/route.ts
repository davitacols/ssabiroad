import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Delete all NavisenseTraining records (they have invalid URLs)
    const deleted = await prisma.navisenseTraining.deleteMany({});
    
    // Get location_recognitions with valid imageUrl (starts with https and contains blog/)
    const validRecognitions = await prisma.location_recognitions.findMany({
      where: {
        location_feedback: { wasCorrect: true },
        imageUrl: { 
          not: null,
          contains: 'blog/'
        }
      },
      include: { location_feedback: true },
      take: 20
    });

    return NextResponse.json({
      success: true,
      deleted: deleted.count,
      valid_found: validRecognitions.length,
      sample_urls: validRecognitions.slice(0, 3).map(r => r.imageUrl)
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
