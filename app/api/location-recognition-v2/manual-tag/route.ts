import { NextRequest, NextResponse } from 'next/server';

const ML_API_URL = process.env.ML_API_URL || 'http://34.224.33.158:8000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const latitude = parseFloat(formData.get('latitude') as string);
    const longitude = parseFloat(formData.get('longitude') as string);
    const name = formData.get('name') as string;
    const address = formData.get('address') as string;
    
    if (!image || !latitude || !longitude) {
      return NextResponse.json(
        { error: 'Image and coordinates required' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    const mlFormData = new FormData();
    mlFormData.append('file', blob, 'image.jpg');
    mlFormData.append('latitude', latitude.toString());
    mlFormData.append('longitude', longitude.toString());
    mlFormData.append('metadata', JSON.stringify({
      method: 'manual-tag',
      name,
      address,
      timestamp: new Date().toISOString()
    }));

    const response = await fetch(`${ML_API_URL}/train`, {
      method: 'POST',
      body: mlFormData,
    });

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Image tagged and added to training data',
        location: { latitude, longitude }
      });
    } else {
      throw new Error('Training submission failed');
    }
  } catch (error) {
    console.error('Manual tagging error:', error);
    return NextResponse.json(
      { error: 'Failed to tag image', details: error.message },
      { status: 500 }
    );
  }
}
