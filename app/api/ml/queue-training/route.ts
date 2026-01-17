import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function POST() {
  try {
    const verified = await prisma.location_recognitions.findMany({
      where: {
        location_feedback: { wasCorrect: true },
        imageUrl: { not: null }
      },
      include: { location_feedback: true }
    });

    const existing = await prisma.navisenseTraining.findMany({
      select: { imageUrl: true }
    });
    const existingUrls = new Set(existing.map(t => t.imageUrl));

    const toAdd = verified.filter(v => v.imageUrl && !existingUrls.has(v.imageUrl));
    
    const added = await Promise.all(
      toAdd.map(location => {
        const hash = crypto.createHash('sha256').update(location.imageUrl!).digest('hex');
        return prisma.navisenseTraining.create({
          data: {
            imageUrl: location.imageUrl!,
            imageHash: hash,
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.detectedAddress,
            businessName: location.businessName,
            verified: true,
            userCorrected: true
          }
        });
      })
    );

    return NextResponse.json({
      success: true,
      added: added.length,
      total_verified: verified.length,
      already_added: verified.length - added.length
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}