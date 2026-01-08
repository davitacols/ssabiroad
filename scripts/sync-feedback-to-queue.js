const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncFeedbackToQueue() {
  console.log('🔄 Syncing previous feedback to training queue...\n');

  try {
    // Get all feedback with coordinates that aren't in training queue yet
    const feedbackWithCoords = await prisma.location_feedback.findMany({
      where: {
        AND: [
          { correctLat: { not: null } },
          { correctLng: { not: null } }
        ]
      }
    });

    console.log(`📊 Found ${feedbackWithCoords.length} feedback entries with coordinates\n`);

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
      await prisma.trainingQueue.create({
        data: {
          imageUrl: feedback.recognitionId,
          address: feedback.correctAddress || 'User Feedback',
          latitude: feedback.correctLat,
          longitude: feedback.correctLng,
          deviceId: feedback.userId || 'anonymous',
          status: 'PENDING'
        }
      });

      added++;
      console.log(`✅ Added: ${feedback.correctAddress || 'Unknown'} (${feedback.correctLat}, ${feedback.correctLng})`);
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Added to queue: ${added}`);
    console.log(`   Already in queue: ${skipped}`);
    console.log(`   Total processed: ${feedbackWithCoords.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

syncFeedbackToQueue();
