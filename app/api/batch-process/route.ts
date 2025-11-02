import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const images = formData.getAll('images') as File[];
    const userId = formData.get('userId') as string;
    
    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }
    
    if (images.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 images per batch' }, { status: 400 });
    }
    
    const results = [];
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const buffer = Buffer.from(await image.arrayBuffer());
      
      try {
        const recognitionFormData = new FormData();
        recognitionFormData.append('image', new Blob([buffer]));
        recognitionFormData.append('analyzeLandmarks', 'true');
        if (userId) recognitionFormData.append('userId', userId);
        
        const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/location-recognition-v2`, {
          method: 'POST',
          body: recognitionFormData
        });
        
        const result = await response.json();
        results.push({
          index: i,
          filename: image.name,
          success: result.success,
          location: result.location,
          name: result.name,
          confidence: result.confidence
        });
      } catch (error) {
        results.push({
          index: i,
          filename: image.name,
          success: false,
          error: error.message
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      total: images.length,
      processed: results.length,
      results
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
