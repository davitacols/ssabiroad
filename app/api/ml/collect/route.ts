import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ML_API_URL = process.env.ML_API_URL || 'http://52.91.173.191:8000';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, latitude, longitude, buildingType, landmark } = await request.json();

    // Save to database
    await prisma.trainingData.create({
      data: {
        imageUrl,
        latitude,
        longitude,
        buildingType,
        landmark,
        source: 'user_upload',
      },
    });

    // Send to ML API
    const formData = new FormData();
    const imageRes = await fetch(imageUrl);
    const imageBlob = await imageRes.blob();
    formData.append('file', imageBlob);
    formData.append('metadata', JSON.stringify({ latitude, longitude, buildingType, landmark }));

    await fetch(`${ML_API_URL}/add_to_index`, {
      method: 'POST',
      body: formData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Collection failed' }, { status: 500 });
  }
}
