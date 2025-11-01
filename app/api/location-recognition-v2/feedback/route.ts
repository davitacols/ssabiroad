import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { LocationMLModel } from '../ml-model';

const prisma = new PrismaClient();
const mlModel = new LocationMLModel();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recognitionId, wasCorrect, correctAddress, correctLat, correctLng, userId } = body;

    if (!recognitionId || typeof wasCorrect !== 'boolean') {
      return NextResponse.json(
        { error: 'recognitionId and wasCorrect are required' },
        { status: 400 }
      );
    }

    const recognition = await prisma.locationRecognition.findUnique({
      where: { id: recognitionId }
    });

    if (!recognition) {
      return NextResponse.json({ error: 'Recognition not found' }, { status: 404 });
    }

    const feedback = await prisma.locationFeedback.create({
      data: { recognitionId, wasCorrect, correctAddress, correctLat, correctLng, userId }
    });

    if (recognition.businessName) {
      await mlModel.trainWithFeedback(
        recognition.businessName,
        {
          formatted_address: wasCorrect ? recognition.detectedAddress : correctAddress,
          geometry: {
            location: {
              lat: wasCorrect ? recognition.latitude : correctLat,
              lng: wasCorrect ? recognition.longitude : correctLng
            }
          }
        },
        wasCorrect
      );
    }

    if (wasCorrect && recognition.businessName) {
      await prisma.knownLocation.upsert({
        where: {
          businessName_latitude_longitude: {
            businessName: recognition.businessName,
            latitude: recognition.latitude,
            longitude: recognition.longitude
          }
        },
        update: { verificationCount: { increment: 1 }, lastVerified: new Date() },
        create: {
          businessName: recognition.businessName,
          address: recognition.detectedAddress || '',
          latitude: recognition.latitude,
          longitude: recognition.longitude,
          verificationCount: 1
        }
      });
    }

    return NextResponse.json({
      success: true,
      feedback,
      message: 'Thank you for your feedback!'
    });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Failed to process feedback' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const method = searchParams.get('method');

    const stats = await prisma.locationFeedback.groupBy({
      by: ['wasCorrect'],
      _count: true,
      where: method ? { recognition: { method } } : undefined
    });

    const total = stats.reduce((sum, s) => sum + s._count, 0);
    const correct = stats.find(s => s.wasCorrect)?._count || 0;

    return NextResponse.json({
      total,
      correct,
      incorrect: total - correct,
      accuracy: total > 0 ? ((correct / total) * 100).toFixed(2) + '%' : '0%',
      method: method || 'all'
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
  }
}
