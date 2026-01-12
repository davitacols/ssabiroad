import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function migrateExistingFeedback() {
  try {
    console.log('🔄 Migrating existing feedback to NavisenseTraining...');

    // Get all location_feedback with valid coordinates
    const feedbacks = await prisma.location_feedback.findMany({
      where: {
        correctLat: { not: null },
        correctLng: { not: null },
      },
      include: {
        location_recognitions: true
      }
    });

    console.log(`Found ${feedbacks.length} feedback items to migrate`);

    let successCount = 0;
    let skipCount = 0;

    for (const feedback of feedbacks) {
      try {
        // Generate hash from recognition ID + coordinates
        const hashInput = `${feedback.recognitionId}_${feedback.correctLat}_${feedback.correctLng}`;
        const imageHash = crypto.createHash('sha256').update(hashInput).digest('hex');

        // Check if already exists
        const existing = await prisma.navisenseTraining.findUnique({
          where: { imageHash }
        });

        if (existing) {
          skipCount++;
          continue;
        }

        // Create NavisenseTraining entry
        await prisma.navisenseTraining.create({
          data: {
            imageUrl: feedback.recognitionId, // Use recognition ID as reference
            imageHash,
            latitude: feedback.correctLat!,
            longitude: feedback.correctLng!,
            address: feedback.correctAddress || null,
            verified: true,
            userCorrected: !feedback.wasCorrect,
            userId: feedback.userId || null,
          }
        });

        successCount++;
        console.log(`✅ Migrated: ${feedback.correctAddress || 'Unknown'}`);

      } catch (error: any) {
        console.error(`❌ Failed to migrate feedback ${feedback.id}:`, error.message);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   Total: ${feedbacks.length}`);
    console.log(`   Migrated: ${successCount}`);
    console.log(`   Skipped: ${skipCount}`);
    console.log('\n✅ Migration complete!');

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateExistingFeedback();
