import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// Process photo and generate tags
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('photo') as File;
    const userId = formData.get('userId') as string;
    const latitude = formData.get('latitude') as string;
    const longitude = formData.get('longitude') as string;

    if (!file) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
    }

    // Create photo record
    const photo = await prisma.photo.create({
      data: {
        userId: userId || 'anonymous',
        filename: file.name,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        timestamp: new Date(),
      },
    });

    // Convert file to base64 for Vision API
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    // Analyze with Google Vision API
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
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

    // Process labels (building types, architectural features)
    if (annotations.labelAnnotations) {
      for (const label of annotations.labelAnnotations) {
        tags.push({
          photoId: photo.id,
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
          photoId: photo.id,
          tagType: 'landmark',
          tagValue: landmark.description,
          confidence: landmark.score,
          coordinates: landmark.locations?.[0]?.latLng,
        });
      }
    }

    // Process text (signs, addresses)
    if (annotations.textAnnotations) {
      for (const text of annotations.textAnnotations.slice(0, 3)) {
        tags.push({
          photoId: photo.id,
          tagType: 'text',
          tagValue: text.description,
          coordinates: text.boundingPoly,
        });
      }
    }

    // Process objects (architectural elements)
    if (annotations.localizedObjectAnnotations) {
      for (const obj of annotations.localizedObjectAnnotations) {
        tags.push({
          photoId: photo.id,
          tagType: 'object',
          tagValue: obj.name,
          confidence: obj.score,
          coordinates: obj.boundingPoly,
        });
      }
    }

    // Save all tags
    if (tags.length > 0) {
      await prisma.photoTag.createMany({ data: tags });
    }

    // Mark photo as processed
    await prisma.photo.update({
      where: { id: photo.id },
      data: { processed: true },
    });

    return NextResponse.json({
      success: true,
      photo: { id: photo.id, filename: photo.filename },
      tags: tags.length,
      message: 'Photo processed and tagged successfully',
    });

  } catch (error: any) {
    console.error('Photo tagging error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get photo tags
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('photoId');
    const userId = searchParams.get('userId');

    if (photoId) {
      const photo = await prisma.photo.findUnique({
        where: { id: photoId },
        include: { tags: true },
      });
      return NextResponse.json({ photo });
    }

    if (userId) {
      const photos = await prisma.photo.findMany({
        where: { userId },
        include: { tags: true },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ photos });
    }

    return NextResponse.json({ error: 'Missing photoId or userId' }, { status: 400 });

  } catch (error: any) {
    console.error('Get tags error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}