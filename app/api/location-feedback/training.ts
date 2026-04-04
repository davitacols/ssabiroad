import { PrismaClient } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import { buildNavisenseTrainingMetadata } from '@/lib/navisense-training-metadata';
import { createTrainingQueueRecord } from '@/lib/training-queue';

const prisma = new PrismaClient();
const ML_API_URL =
  process.env.NAVISENSE_ML_URL ||
  process.env.NEXT_PUBLIC_ML_API_URL ||
  'https://ssabiroad.onrender.com';

export async function trainModelWithFeedback(
  location: { latitude: number; longitude: number },
  address?: string,
  businessName?: string,
  imageBuffer?: Buffer,
  trainingMetadata: Record<string, unknown> = {}
): Promise<void> {
  if (!imageBuffer) {
    console.log('No image provided, skipping ML training');
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(imageBuffer)], { type: 'image/jpeg' });
    const metadata = buildNavisenseTrainingMetadata({
      ...trainingMetadata,
      address: address || (trainingMetadata.address as string | undefined),
      businessName: businessName || (trainingMetadata.businessName as string | undefined),
      latitude: location.latitude,
      longitude: location.longitude,
      trainingPipeline: (trainingMetadata.trainingPipeline as string | undefined) || 'location-feedback',
    });

    formData.append('file', blob, 'image.jpg');
    formData.append('latitude', location.latitude.toString());
    formData.append('longitude', location.longitude.toString());
    if (metadata.address) formData.append('address', metadata.address);
    if (metadata.businessName) formData.append('businessName', metadata.businessName);
    formData.append('metadata', JSON.stringify(metadata));

    const response = await fetch(`${ML_API_URL}/train`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Navisense training successful:', result);
      console.log('Total vectors in Pinecone:', result.total_vectors);
    } else {
      const errorText = await response.text();
      console.log('Navisense training failed:', response.status, errorText);
    }
  } catch (error: any) {
    console.log('Navisense training failed:', error.message);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function geocodeAddress(
  address: string
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!GOOGLE_MAPS_KEY) return null;

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_KEY}`
    );
    const data = await response.json();

    if (data.results?.[0]?.geometry?.location) {
      return {
        latitude: data.results[0].geometry.location.lat,
        longitude: data.results[0].geometry.location.lng
      };
    }
  } catch (error) {
    console.error('Geocoding failed:', error);
  }

  return null;
}

async function ensureRecognitionExists(
  recognitionId: string,
  location: { latitude: number; longitude: number } | undefined,
  correctAddress?: string,
  userId?: string,
  imageBuffer?: Buffer
) {
  const existingRecognition = await prisma.location_recognitions
    .findUnique({
      where: { id: recognitionId }
    })
    .catch(() => null);

  if (existingRecognition) {
    return existingRecognition;
  }

  if (!location) {
    throw new Error('Cannot save feedback without an existing recognition or corrected coordinates');
  }

  let imageUrl: string | null = null;
  let imageHash: string | null = null;

  if (imageBuffer) {
    const { uploadImageWithGoogleFallback } = await import('../../../lib/image-upload');
    imageUrl = await uploadImageWithGoogleFallback(
      imageBuffer,
      recognitionId,
      'location-feedback/training',
    );
    imageHash = createHash('md5').update(imageBuffer).digest('hex');
  }

  return prisma.location_recognitions.create({
    data: {
      id: recognitionId,
      businessName: null,
      detectedAddress: correctAddress || null,
      latitude: location.latitude,
      longitude: location.longitude,
      confidence: 1,
      method: 'feedback-bootstrap',
      imageHash,
      imageUrl,
      userId: userId || null
    }
  });
}

export async function saveFeedback(
  recognitionId: string,
  correctLocation?: { latitude: number; longitude: number },
  correctAddress?: string,
  feedback?: string,
  userId?: string,
  imageBuffer?: Buffer
) {
  try {
    let location = correctLocation || undefined;
    if (!location && correctAddress) {
      console.log('Geocoding address:', correctAddress);
      location = (await geocodeAddress(correctAddress)) || undefined;
      if (location) {
        console.log('Geocoded to:', location);
      }
    }

    const recognition = await ensureRecognitionExists(
      recognitionId,
      location,
      correctAddress,
      userId,
      imageBuffer
    );

    const feedbackRecord = await prisma.location_feedback.upsert({
      where: { recognitionId: recognition.id },
      update: {
        correctLat: location?.latitude || null,
        correctLng: location?.longitude || null,
        correctAddress: correctAddress || null,
        wasCorrect: feedback === 'correct',
        userId: userId || null
      },
      create: {
        id: randomUUID(),
        recognitionId: recognition.id,
        correctLat: location?.latitude || null,
        correctLng: location?.longitude || null,
        correctAddress: correctAddress || null,
        wasCorrect: feedback === 'correct',
        userId: userId || null
      }
    });

    if (location && imageBuffer) {
      const imagePath = `${recognitionId}_${Date.now()}.jpg`;
      const queueMetadata = buildNavisenseTrainingMetadata({
        source: feedback === 'correct' ? 'feedback-confirmation' : 'user-correction',
        method: feedback === 'correct' ? 'feedback-confirmation' : 'user-correction',
        businessName: recognition.businessName || undefined,
        address: correctAddress || recognition.detectedAddress || undefined,
        confidence: recognition.confidence,
        recognitionId: recognition.id,
        userId: userId || undefined,
        imageHash: recognition.imageHash || undefined,
        imageUrl: recognition.imageUrl || undefined,
        userCorrected: feedback !== 'correct',
        latitude: location.latitude,
        longitude: location.longitude,
        trainingPipeline: 'location-feedback',
      });

      const queueItem = await createTrainingQueueRecord<{ id: string }>(
          prisma.trainingQueue,
          {
            imageUrl: recognition.imageUrl || imagePath,
            imageHash: recognition.imageHash || null,
            recognitionId: recognition.id,
            address: correctAddress || recognition.detectedAddress || 'User Correction',
            businessName: recognition.businessName || null,
            latitude: location.latitude,
            longitude: location.longitude,
            deviceId: userId || 'anonymous',
            source: queueMetadata.source || 'feedback-confirmation',
            labelQuality: queueMetadata.labelQuality || 'gold',
            confidence: recognition.confidence,
            metadata: queueMetadata,
            status: 'PENDING'
          },
          'location-feedback/saveFeedback',
        )
        .catch(err => {
          console.error('Failed to add to training queue:', err);
          return null;
        });

      if (queueItem) {
        console.log('Added feedback image to training queue');
      }

      // The ML service now owns canonical image storage and NavisenseTraining upserts.
      await trainModelWithFeedback(
        location,
        correctAddress || recognition.detectedAddress || undefined,
        recognition.businessName || undefined,
        imageBuffer,
        queueMetadata
      );
    }

    return feedbackRecord;
  } catch (error) {
    console.error('Failed to save feedback:', error);
    return null;
  }
}

export async function getFeedbackStats(userId?: string) {
  try {
    const where = userId ? { userId } : {};

    const totalFeedback = await prisma.location_feedback.count({ where });
    const recentFeedback = await prisma.location_feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const correctionCount = await prisma.location_feedback.count({
      where: { ...where, wasCorrect: true }
    });

    return {
      totalFeedback,
      correctionRate: totalFeedback > 0 ? (correctionCount / totalFeedback * 100).toFixed(2) : 0,
      recentFeedback
    };
  } catch (error) {
    console.error('Failed to get feedback stats:', error);
    return null;
  }
}

export async function batchTrainModel(limit: number = 50): Promise<void> {
  try {
    const pendingFeedback = await prisma.location_feedback.findMany({
      where: {
        correctLat: { not: null },
        correctLng: { not: null }
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    if (!pendingFeedback.length) {
      console.log('No feedback items eligible for batch retraining');
      return;
    }

    const response = await fetch(`${ML_API_URL}/retrain`, {
      method: 'POST'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Retrain failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('Batch retrain successful:', result);
  } catch (error) {
    console.error('Batch training error:', error);
  }
}
