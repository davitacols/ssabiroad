import { NextRequest, NextResponse } from 'next/server';

const ML_API_URL = process.env.ML_API_URL || 'http://34.224.33.158:8000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const topK = parseInt(formData.get('top_k') as string) || 5;
    const minConfidence = parseFloat(formData.get('min_confidence') as string) || 0.1;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const mlFormData = new FormData();
    mlFormData.append('file', file);

    const response = await fetch(`${ML_API_URL}/predict?top_k=${topK}&min_confidence=${minConfidence}`, {
      method: 'POST',
      body: mlFormData,
    });

    if (!response.ok) {
      throw new Error(`ML service error: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      predictions: data.predictions,
      processing_time_ms: data.processing_time_ms,
      model_version: data.model_version,
    });

  } catch (error) {
    console.error('Global geolocation error:', error);
    return NextResponse.json(
      { error: 'Failed to predict location', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const feedback = await request.json();

    const response = await fetch(`${ML_API_URL}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback),
    });

    if (!response.ok) {
      throw new Error(`ML service error: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: data.message,
      buffer_size: data.buffer_size,
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
