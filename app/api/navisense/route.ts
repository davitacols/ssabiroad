import { NextRequest, NextResponse } from 'next/server';

const ML_API_URL = process.env.ML_API_URL || 'http://52.91.173.191:8000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const mlFormData = new FormData();
    mlFormData.append('file', file);

    const response = await fetch(`${ML_API_URL}/predict_location`, {
      method: 'POST',
      body: mlFormData,
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Prediction failed' },
      { status: 500 }
    );
  }
}
