import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ML_API_URL = 'http://34.224.33.158:8000';

async function resendTrainingData() {
  try {
    // Get all pending/failed items from training queue
    const items = await prisma.trainingQueue.findMany({
      where: {
        OR: [
          { status: 'PENDING' },
          { status: 'FAILED' },
          { status: 'READY' }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${items.length} items to resend`);

    let successCount = 0;
    let failCount = 0;

    for (const item of items) {
      try {
        const formData = new FormData();
        formData.append('latitude', item.latitude.toString());
        formData.append('longitude', item.longitude.toString());
        formData.append('address', item.address || 'Unknown');
        formData.append('metadata', JSON.stringify({
          source: 'resend_script',
          queueId: item.id,
          deviceId: item.deviceId
        }));

        const response = await fetch(`${ML_API_URL}/feedback`, {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          await prisma.trainingQueue.update({
            where: { id: item.id },
            data: { status: 'SENT', processedAt: new Date() }
          });
          successCount++;
          console.log(`✅ Sent item ${successCount}/${items.length}`);
        } else {
          failCount++;
          console.log(`❌ Failed item ${item.id}: ${response.status}`);
        }
      } catch (error) {
        failCount++;
        console.log(`❌ Error sending item ${item.id}:`, error.message);
      }
    }

    console.log(`\n✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);

    // Trigger retrain if we sent items
    if (successCount > 0) {
      console.log('\n🔄 Triggering retrain...');
      const retrainResponse = await fetch(`${ML_API_URL}/retrain`, { method: 'POST' });
      const retrainData = await retrainResponse.json();
      console.log('Retrain result:', retrainData);
    }

  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resendTrainingData();
