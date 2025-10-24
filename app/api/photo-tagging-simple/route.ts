import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
    }

    // Convert file to base64 for Vision API
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    // Use API key from Maps API (same project)
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Google API key not configured' }, { status: 500 });
    }

    // Analyze with Google Vision API
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: base64 },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 10 },
              { type: 'LANDMARK_DETECTION', maxResults: 5 },
              { type: 'TEXT_DETECTION', maxResults: 5 },
              { type: 'OBJECT_LOCALIZATION', maxResults: 10 }
            ]
          }]
        })
      }
    );

    const visionData = await visionResponse.json();
    const annotations = visionData.responses[0];

    const tags = [];

    // Process labels
    if (annotations.labelAnnotations) {
      for (const label of annotations.labelAnnotations) {
        tags.push({
          tagType: 'label',
          tagValue: label.description,
          confidence: label.score,
        });
      }
    }

    // Process landmarks
    if (annotations.landmarkAnnotations) {
      for (const landmark of annotations.landmarkAnnotations) {
        tags.push({
          tagType: 'landmark',
          tagValue: landmark.description,
          confidence: landmark.score,
        });
      }
    }

    // Process text
    if (annotations.textAnnotations) {
      for (const text of annotations.textAnnotations.slice(0, 3)) {
        tags.push({
          tagType: 'text',
          tagValue: text.description,
        });
      }
    }

    // Process objects
    if (annotations.localizedObjectAnnotations) {
      for (const obj of annotations.localizedObjectAnnotations) {
        tags.push({
          tagType: 'object',
          tagValue: obj.name,
          confidence: obj.score,
        });
      }
    }

    return NextResponse.json({
      success: true,
      tags,
      message: 'Photo processed successfully',
    });

  } catch (error: any) {
    console.error('Photo tagging error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}