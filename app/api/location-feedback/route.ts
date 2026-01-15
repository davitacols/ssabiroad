import { NextRequest, NextResponse } from 'next/server';
import { saveFeedback, trainModelWithFeedback, getFeedbackStats } from './training';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recognitionId, correctLocation, correctAddress, feedback, userId, imageData } = body;

    if (!recognitionId) {
      return NextResponse.json({ error: 'Missing recognitionId' }, { status: 400 });
    }

    // If user clicked "Yes" (correct), fetch original recognition data
    let location = correctLocation;
    let address = correctAddress;
    let imageBuffer: Buffer | undefined;
    
    if (feedback === 'correct' && !location) {
      try {
        const recognition = await prisma.location_recognitions.findUnique({
          where: { id: recognitionId }
        });
        if (recognition) {
          location = { latitude: recognition.latitude, longitude: recognition.longitude };
          address = recognition.detectedAddress || undefined;
          console.log('✅ Using original recognition data for positive feedback');
        }
      } catch (err) {
        console.error('Failed to fetch recognition:', err);
      }
    }
    
    // Convert base64 image to buffer if provided
    if (imageData) {
      try {
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        imageBuffer = Buffer.from(base64Data, 'base64');
      } catch (err) {
        console.error('Failed to decode image:', err);
      }
    }

    // Save feedback
    const feedbackRecord = await saveFeedback(
      recognitionId,
      location,
      address,
      feedback,
      userId,
      imageBuffer
    );

    // Train model if location and image provided
    if (location && imageBuffer) {
      await trainModelWithFeedback(location, address, undefined, imageBuffer);
    }

    return NextResponse.json({ 
      success: true, 
      feedbackId: feedbackRecord?.id,
      message: 'Feedback recorded and model training initiated'
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json({ error: 'Failed to process feedback' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const stats = searchParams.get('stats') === 'true';

    if (stats) {
      const statsData = await getFeedbackStats(userId || undefined);
      return NextResponse.json(statsData);
    }

    return NextResponse.json({ message: 'Use ?stats=true for feedback statistics' });
  } catch (error) {
    console.error('Feedback retrieval error:', error);
    return NextResponse.json({ error: 'Failed to retrieve feedback' }, { status: 500 });
  }
}
