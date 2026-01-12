import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const recognitions = await prisma.location_recognitions.findMany({
      include: {
        location_feedback: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const verified = recognitions.filter(r => 
      r.location_feedback && r.location_feedback.wasCorrect === true
    );

    const totalRecognitions = recognitions.length;
    const totalFeedback = await prisma.location_feedback.count();
    const verifiedCount = verified.length;
    const withImages = verified.filter(r => r.image_url).length;

    return NextResponse.json({
      success: true,
      stats: {
        total_recognitions: totalRecognitions,
        total_feedback: totalFeedback,
        verified_recognitions: verifiedCount,
        with_images: withImages,
        ready_for_training: withImages
      },
      verified_data: verified.map(r => ({
        id: r.id,
        latitude: r.latitude,
        longitude: r.longitude,
        address: r.address,
        business_name: r.business_name,
        method: r.method,
        image_url: r.image_url,
        feedback_count: 1,
        created_at: r.createdAt
      }))
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
