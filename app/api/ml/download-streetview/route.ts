import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ML_API_URL = process.env.ML_API_URL || 'http://34.224.33.158:8000';
const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;

async function downloadStreetView(lat: number, lng: number): Promise<Buffer | null> {
  if (!GOOGLE_MAPS_KEY) return null;
  
  try {
    const url = `https://maps.googleapis.com/maps/api/streetview?size=640x640&location=${lat},${lng}&key=${GOOGLE_MAPS_KEY}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
  } catch (error) {
    console.error('Street View download failed:', error);
  }
  return null;
}

export async function POST() {
  try {
    const ready = await prisma.trainingQueue.findMany({
      where: { status: 'READY' },
      take: 10,
      orderBy: { createdAt: 'asc' }
    });

    console.log(`📤 Sending ${ready.length} images with coordinates to ML API...`);

    let sent = 0;
    let failed = 0;

    for (const item of ready) {
      try {
        if (!item.error) {
          throw new Error('No image data');
        }

        const base64Data = item.error;
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
        const file = new File([blob], `${item.imageUrl}.jpg`, { type: 'image/jpeg' });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('latitude', item.latitude.toString());
        formData.append('longitude', item.longitude.toString());
        formData.append('address', item.address);
        formData.append('metadata', JSON.stringify({
          source: 'user_upload',
          queueId: item.id
        }));

        const response = await fetch(`${ML_API_URL}/train`, {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(30000)
        });

        if (response.ok) {
          await prisma.trainingQueue.update({
            where: { id: item.id },
            data: { status: 'SENT', processedAt: new Date(), error: null }
          });
          sent++;
          console.log(`✅ Sent: ${item.address}`);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error: any) {
        await prisma.trainingQueue.update({
          where: { id: item.id },
          data: { status: 'FAILED' }
        });
        failed++;
        console.log(`❌ Failed: ${item.address}`);
      }
    }

    return NextResponse.json({
      success: true,
      processed: ready.length,
      sent,
      failed,
      message: `Sent ${sent} user images to ML API`
    });

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
