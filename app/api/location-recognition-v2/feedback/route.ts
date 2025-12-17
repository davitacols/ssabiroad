import { NextRequest, NextResponse } from 'next/server';

const ML_API_URL = process.env.ML_API_URL || 'http://52.91.173.191:8000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const latitude = formData.get('latitude') as string;
    const longitude = formData.get('longitude') as string;
    const address = formData.get('address') as string;
    const userId = formData.get('userId') as string;
    
    if (!file || !latitude || !longitude) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const mlFormData = new FormData();
    mlFormData.append('file', file);
    mlFormData.append('latitude', latitude);
    mlFormData.append('longitude', longitude);
    mlFormData.append('metadata', JSON.stringify({ 
      method: 'user-correction',
      address,
      userId,
      timestamp: new Date().toISOString()
    }));

    const mlResponse = await fetch(`${ML_API_URL}/train`, {
      method: 'POST',
      body: mlFormData,
    });

    const mlResult = await mlResponse.json();
    console.log('✅ Navisense training response:', mlResult);

    return NextResponse.json({ success: true, message: 'Training data submitted', mlResponse: mlResult });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
