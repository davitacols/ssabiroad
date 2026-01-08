import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();
const ML_API_URL = process.env.ML_API_URL || 'http://34.224.33.158:8000';

export async function trainModelWithFeedback(
  location: { latitude: number; longitude: number },
  address?: string,
  businessName?: string
): Promise<void> {
  try {
    const formData = new FormData();
    formData.append('latitude', location.latitude.toString());
    formData.append('longitude', location.longitude.toString());
    if (address) formData.append('address', address);
    if (businessName) formData.append('businessName', businessName);

    const response = await fetch(`${ML_API_URL}/feedback`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Model training with feedback initiated:', result);
      console.log('📊 Queue size:', result.queue_size);
      
      if (result.queue_size >= 5) {
        console.log('🔄 Queue size >= 5, triggering model update...');
        fetch(`${ML_API_URL}/retrain`, { method: 'POST' })
          .then(res => res.json())
          .then(data => console.log('✅ Retrain triggered:', data))
          .catch(err => console.log('❌ Retrain failed:', err.message));
      }
    } else {
      console.log('❌ Training failed with status:', response.status);
    }
  } catch (error) {
    console.log('Model training error:', error.message);
  }
}

async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!GOOGLE_MAPS_KEY) return null;

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_KEY}`,
      { signal: AbortSignal.timeout(5000) }
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
  userId?: string
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
    if (location) {
      const queueItem = await prisma.trainingQueue.create({
        data: {
          imageUrl: recognitionId,
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
      
      if (queueItem) {
        console.log('✅ Added to training queue');
        
        // Send to ML API immediately
        const formData = new FormData();
        formData.append('latitude', location.latitude.toString());
        formData.append('longitude', location.longitude.toString());
        formData.append('address', correctAddress || 'Unknown');
        formData.append('metadata', JSON.stringify({
          source: 'user_feedback',
          deviceId: userId || 'anonymous',
          queueId: queueItem.id
        }));

        fetch(`${ML_API_URL}/feedback`, {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(10000)
        })
          .then(res => res.json())
          .then(() => {
            prisma.trainingQueue.update({
              where: { id: queueItem.id },
              data: { status: 'SENT', processedAt: new Date() }
            }).catch(err => console.error('DB update error:', err));
            console.log('✅ Sent to ML API');
          })
          .catch(err => {
            console.error('❌ ML API error:', err.message);
            prisma.trainingQueue.update({
              where: { id: queueItem.id },
              data: { status: 'FAILED', error: err.message }
            }).catch(e => console.error('DB update error:', e));
          });
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
