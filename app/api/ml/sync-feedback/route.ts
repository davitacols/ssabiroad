import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createTrainingQueueRecord } from '@/lib/training-queue';

const prisma = new PrismaClient();

export async function POST() {
  try {
    console.log('🔄 Starting feedback sync to training queue...');

    // Get all feedback with coordinates
    const feedbackWithCoords = await prisma.location_feedback.findMany({
      where: {
        AND: [
          { correctLat: { not: null } },
          { correctLng: { not: null } }
        ]
      }
    });

    console.log(`📊 Found ${feedbackWithCoords.length} feedback entries with coordinates`);

    let added = 0;
    let skipped = 0;

    for (const feedback of feedbackWithCoords) {
      // Check if already in queue
      const existing = await prisma.trainingQueue.findFirst({
        where: {
          imageUrl: feedback.recognitionId,
          latitude: feedback.correctLat,
          longitude: feedback.correctLng
        }
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Add to training queue
      await createTrainingQueueRecord(
        prisma.trainingQueue,
        {
          imageUrl: feedback.recognitionId,
          address: feedback.correctAddress || 'User Feedback',
          latitude: feedback.correctLat,
          longitude: feedback.correctLng,
          deviceId: feedback.userId || 'anonymous',
          status: 'PENDING'
        },
        'ml/sync-feedback',
      );

      added++;
    }

    return NextResponse.json({
      success: true,
      added,
      skipped,
      total: feedbackWithCoords.length,
      message: `Synced ${added} feedback entries to training queue`
    });

  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
