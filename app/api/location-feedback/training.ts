import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();
const ML_API_URL = process.env.NAVISENSE_ML_URL || process.env.NEXT_PUBLIC_ML_API_URL || 'https://ssabiroad.onrender.com';

export async function trainModelWithFeedback(
  location: { latitude: number; longitude: number },
  address?: string,
  businessName?: string,
  imageBuffer?: Buffer
): Promise<void> {
  try {
    if (!imageBuffer) {
      console.log('⚠️ No image provided, skipping ML training');
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('file', blob, 'image.jpg');
    formData.append('latitude', location.latitude.toString());
    formData.append('longitude', location.longitude.toString());
    if (address) formData.append('address', address);
    if (businessName) formData.append('businessName', businessName);

    const response = await fetch(`${ML_API_URL}/train`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Navisense training successful:', result);
      console.log('📊 Total vectors in Pinecone:', result.total_vectors);
    } else {
      const errorText = await response.text();
      console.log('❌ Navisense training failed:', response.status, errorText);
    }
  } catch (error: any) {
    console.log('❌ Navisense training failed:', error.message);
  }
}

async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
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

export async function saveFeedback(
  recognitionId: string,
  correctLocation?: { latitude: number; longitude: number },
  correctAddress?: string,
  feedback?: string,
  userId?: string,
  imageBuffer?: Buffer
) {
  try {
    // If address provided but no coordinates, geocode it
    let location = correctLocation;
    if (!location && correctAddress) {
      console.log('🗺️ Geocoding address:', correctAddress);
      location = await geocodeAddress(correctAddress);
      if (location) {
        console.log('✅ Geocoded to:', location);
      }
    }

    // Check if recognition exists, if not skip foreign key
    const recognitionExists = await prisma.location_recognitions.findUnique({
      where: { id: recognitionId }
    }).catch(() => null);

    const feedbackRecord = await prisma.location_feedback.upsert({
      where: { recognitionId },
      update: {
        correctLat: location?.latitude || null,
        correctLng: location?.longitude || null,
        correctAddress: correctAddress || null,
        wasCorrect: feedback === 'correct',
        userId: userId || null
      },
      create: {
        id: randomUUID(),
        recognitionId: recognitionExists ? recognitionId : `feedback-${randomUUID()}`,
        correctLat: location?.latitude || null,
        correctLng: location?.longitude || null,
        correctAddress: correctAddress || null,
        wasCorrect: feedback === 'correct',
        userId: userId || null
      }
    });

    // Add to training queue for ML dashboard
    if (location && imageBuffer) {
      // Save image to ML server
      const imagePath = `${recognitionId}_${Date.now()}.jpg`;
      
      // Add to TrainingQueue (existing)
      const queueItem = await prisma.trainingQueue.create({
        data: {
          imageUrl: imagePath,
          address: correctAddress || 'User Correction',
          latitude: location.latitude,
          longitude: location.longitude,
          deviceId: userId || 'anonymous',
          status: 'PENDING'
        }
      }).catch(err => {
        console.error('Failed to add to training queue:', err);
        return null;
      });
      
      // Add to NavisenseTraining (new - for Phase 2 ML)
      const crypto = require('crypto');
      const imageHash = crypto.createHash('sha256').update(imagePath).digest('hex');
      
      await prisma.navisenseTraining.upsert({
        where: { imageHash },
        update: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: correctAddress || null,
          verified: true,
          userCorrected: feedback !== 'correct',
        },
        create: {
          imageUrl: imagePath,
          imageHash,
          latitude: location.latitude,
          longitude: location.longitude,
          address: correctAddress || null,
          verified: true,
          userCorrected: feedback !== 'correct',
          userId: userId || null,
        }
      }).catch(err => {
        console.error('Failed to add to NavisenseTraining:', err);
      });
      
      if (queueItem) {
        console.log('✅ Added to training queue & NavisenseTraining');
        
        // Send to Navisense ML API for immediate training
        await trainModelWithFeedback(location, correctAddress, undefined, imageBuffer);
      }
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
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    for (const item of pendingFeedback) {
      if (item.correctLat && item.correctLng) {
        await trainModelWithFeedback(
          { latitude: item.correctLat, longitude: item.correctLng },
          item.correctAddress || undefined
        );
      }
    }

    console.log(`✅ Batch trained ${pendingFeedback.length} feedback items`);
  } catch (error) {
    console.error('Batch training error:', error);
  }
}
