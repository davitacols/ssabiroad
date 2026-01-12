import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      imageUrl, 
      latitude, 
      longitude, 
      address, 
      businessName, 
      wasCorrect, 
      userId 
    } = body;

    // Validate required fields
    if (!imageUrl || !latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate image hash to prevent duplicates
    const imageHash = crypto
      .createHash('sha256')
      .update(imageUrl)
      .digest('hex');

    // Check if already exists
    const existing = await prisma.navisenseTraining.findUnique({
      where: { imageHash }
    });

    if (existing) {
      // Update if user corrected
      if (!wasCorrect) {
        await prisma.navisenseTraining.update({
          where: { imageHash },
          data: {
            latitude,
            longitude,
            address,
            businessName,
            userCorrected: true,
            verified: true,
          }
        });
      } else {
        // Just mark as verified
        await prisma.navisenseTraining.update({
          where: { imageHash },
          data: { verified: true }
        });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Training data updated' 
      });
    }

    // Create new training entry
    await prisma.navisenseTraining.create({
      data: {
        imageUrl,
        imageHash,
        latitude,
        longitude,
        address,
        businessName,
        verified: true,
        userCorrected: !wasCorrect,
        userId,
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Training data saved' 
    });

  } catch (error: any) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save feedback' },
      { status: 500 }
    );
  }
}

// Get training stats
export async function GET() {
  try {
    const [total, verified, corrected, untrained] = await Promise.all([
      prisma.navisenseTraining.count(),
      prisma.navisenseTraining.count({ where: { verified: true } }),
      prisma.navisenseTraining.count({ where: { userCorrected: true } }),
      prisma.navisenseTraining.count({ where: { trainedAt: null } }),
    ]);

    return NextResponse.json({
      total,
      verified,
      corrected,
      untrained,
      readyForTraining: verified && untrained >= 100,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
