import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ML_API_URL = process.env.ML_API_URL || 'http://34.224.33.158:8000';

export async function POST() {
  try {
    const pending = await prisma.trainingQueue.findMany({
      where: { status: 'PENDING' },
      take: 20,
      orderBy: { createdAt: 'asc' }
    });

    console.log(`📤 Processing ${pending.length} pending items...`);

    let sent = 0;
    let failed = 0;

    for (const item of pending) {
      try {
        const formData = new FormData();
        formData.append('latitude', item.latitude.toString());
        formData.append('longitude', item.longitude.toString());
        formData.append('address', item.address || 'Unknown');
        formData.append('metadata', JSON.stringify({
          source: 'database_queue',
          deviceId: item.deviceId,
          queueId: item.id
        }));

        const response = await fetch(`${ML_API_URL}/feedback`, {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(10000)
        });

        if (response.ok) {
          await prisma.trainingQueue.update({
            where: { id: item.id },
            data: { status: 'SENT', processedAt: new Date() }
          });
          sent++;
          console.log(`✅ Sent: ${item.address}`);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error: any) {
        await prisma.trainingQueue.update({
          where: { id: item.id },
          data: { status: 'FAILED', error: error.message }
        });
        failed++;
        console.log(`❌ Failed: ${item.address} - ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      processed: pending.length,
      sent,
      failed,
      message: `Processed ${pending.length} items: ${sent} sent, ${failed} failed`
    });

  } catch (error: any) {
    console.error('Process queue error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
