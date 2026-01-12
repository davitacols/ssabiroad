import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ML_API_URL = process.env.ML_API_URL || 'http://34.224.33.158:8000';

export async function GET() {
  return NextResponse.json({ message: 'Use POST to trigger training from database' });
}

export async function POST(request: NextRequest) {
  try {
    // Get recognition records with valid coordinates and image URLs
    const recognitions = await prisma.recognition.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
        imageUrl: { not: null },
        method: { not: 'navisense-ml' }, // Exclude ML predictions to avoid circular training
      },
      select: {
        imageUrl: true,
        latitude: true,
        longitude: true,
        businessName: true,
        address: true,
      },
      take: 50, // Increase limit
    });

    console.log(`Found ${recognitions.length} training samples`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const recognition of recognitions) {
      try {
        // Fetch image from URL with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const imageResponse = await fetch(recognition.imageUrl!, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'SSABIRoad-Training/1.0'
          }
        });
        clearTimeout(timeoutId);
        
        if (!imageResponse.ok) {
          errors.push(`Failed to fetch image: ${imageResponse.status}`);
          errorCount++;
          continue;
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        if (imageBuffer.byteLength === 0) {
          errors.push('Empty image buffer');
          errorCount++;
          continue;
        }

        const formData = new FormData();
        formData.append('file', new Blob([imageBuffer], { type: 'image/jpeg' }), 'training.jpg');
        formData.append('latitude', recognition.latitude!.toString());
        formData.append('longitude', recognition.longitude!.toString());
        
        const metadata = {
          businessName: recognition.businessName,
          address: recognition.address,
          source: 'database_training'
        };
        formData.append('metadata', JSON.stringify(metadata));

        // Send to ML server with timeout
        const trainController = new AbortController();
        const trainTimeoutId = setTimeout(() => trainController.abort(), 15000);
        
        const response = await fetch(`${ML_API_URL}/train`, {
          method: 'POST',
          body: formData,
          signal: trainController.signal
        });
        clearTimeout(trainTimeoutId);

        if (response.ok) {
          successCount++;
          console.log(`✅ Trained: ${recognition.address || 'Unknown location'}`);
        } else {
          const errorText = await response.text();
          errors.push(`Training failed: ${errorText}`);
          errorCount++;
        }
      } catch (error: any) {
        errorCount++;
        errors.push(error.message || 'Unknown error');
        console.error('Training error:', error.message);
      }
    }

    // Only trigger retraining if we have enough successful samples
    let retrainResult = null;
    if (successCount >= 10) {
      try {
        console.log('🔄 Triggering model retraining...');
        const retrainResponse = await fetch(`${ML_API_URL}/retrain`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        retrainResult = await retrainResponse.text();
      } catch (error: any) {
        errors.push(`Retrain error: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      totalSamples: recognitions.length,
      successCount,
      errorCount,
      retrainTriggered: successCount >= 10,
      retrainResult,
      errors: errors.slice(0, 5), // Limit error messages
      message: `Training completed. ${successCount} samples added, ${errorCount} errors. ${successCount >= 10 ? 'Retraining triggered.' : 'Need 10+ samples for retraining.'}`
    });

  } catch (error: any) {
    console.error('Training from DB error:', error);
    return NextResponse.json(
      { error: error.message || 'Training failed' },
      { status: 500 }
    );
  }
}