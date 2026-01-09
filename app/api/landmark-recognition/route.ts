import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const ML_API_URL = process.env.ML_API_URL || 'http://34.224.33.158:8000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const mlFormData = new FormData();
    mlFormData.append('image', new Blob([buffer]), image.name);

    const response = await axios.post(
      `${ML_API_URL}/recognize-landmark`,
      mlFormData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      }
    );

    const result = response.data;

    return NextResponse.json({
      success: true,
      landmarks: result.landmarks || [],
      topMatch: result.top_match || null,
      confidence: result.top_match?.confidence || 0,
      method: 'google_landmarks_v2',
      metadata: {
        category: result.top_match?.category,
        type: result.top_match?.type,
        hierarchicalLabel: result.top_match?.hierarchical_label,
      }
    });

  } catch (error: any) {
    console.error('Landmark recognition error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Landmark recognition failed',
        landmarks: [],
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Landmark Recognition API',
    version: '2.1',
    dataset: 'Google Landmarks Dataset v2',
    endpoints: {
      recognize: 'POST /api/landmark-recognition',
    }
  });
}
