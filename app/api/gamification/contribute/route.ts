import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ML_API_URL = process.env.ML_API_URL || 'http://34.224.33.158:8000';

const POINTS = {
  PHOTO_UPLOAD: 10,
  LOCATION_VERIFY: 5,
  CORRECTION: 15,
  DAILY_STREAK: 20,
  FIRST_CONTRIBUTION: 50
};

const BADGES = {
  EXPLORER: { name: 'Explorer', requirement: 10, icon: '🗺️' },
  CONTRIBUTOR: { name: 'Contributor', requirement: 50, icon: '⭐' },
  CHAMPION: { name: 'Champion', requirement: 100, icon: '🏆' },
  LEGEND: { name: 'Legend', requirement: 500, icon: '👑' },
  MASTER: { name: 'Master', requirement: 1000, icon: '💎' }
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const latitude = formData.get('latitude') as string;
    const longitude = formData.get('longitude') as string;
    const address = formData.get('address') as string;
    const deviceId = formData.get('deviceId') as string;
    
    if (!file || !latitude || !longitude || !deviceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('Upload request:', { latitude, longitude, address, deviceId });

    // Fetch OSM data
    const osmRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      { headers: { 'User-Agent': 'Pic2Nav-Research/1.0' } }
    );
    const osmData = await osmRes.json();

    // Convert file to base64 for database storage
    console.log('Converting file to base64...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const imageUrl = `data:${file.type};base64,${base64}`;
    console.log('File converted, size:', base64.length);

    // Queue for ML training with OSM metadata
    console.log('Creating queue entry...');
    const queueEntry = await prisma.trainingQueue.create({
      data: {
        imageUrl,
        address: osmData.display_name || address || 'Unknown',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        deviceId,
        status: 'PENDING',
        metadata: {
          osm: {
            place_id: osmData.place_id,
            osm_type: osmData.osm_type,
            osm_id: osmData.osm_id,
            category: osmData.category,
            type: osmData.type,
            addresstype: osmData.addresstype,
            name: osmData.name,
            address: osmData.address
          }
        }
      }
    });
    console.log('Queue entry created:', queueEntry.id);

    // Send to ML API asynchronously (don't await)
    const mlFormData = new FormData();
    mlFormData.append('file', file);
    mlFormData.append('latitude', latitude);
    mlFormData.append('longitude', longitude);
    mlFormData.append('metadata', JSON.stringify({
      address: address || 'User contribution',
      deviceId,
      source: 'gamification',
      timestamp: new Date().toISOString()
    }));

    fetch(`${ML_API_URL}/train`, {
      method: 'POST',
      body: mlFormData
    }).then(async (res) => {
      if (res.ok) {
        await prisma.trainingQueue.update({
          where: { id: queueEntry.id },
          data: { status: 'PROCESSED', processedAt: new Date() }
        });
      } else {
        await prisma.trainingQueue.update({
          where: { id: queueEntry.id },
          data: { status: 'FAILED', error: await res.text() }
        });
      }
    }).catch(async (err) => {
      await prisma.trainingQueue.update({
        where: { id: queueEntry.id },
        data: { status: 'FAILED', error: err.message }
      });
    });

    // Award points using deviceId
    console.log('Finding contributor...');
    let contributor = await prisma.user.findFirst({
      where: { email: deviceId },
      select: {
        id: true,
        gamificationPoints: true,
        contributionCount: true,
        lastContributionDate: true,
        badges: true,
        streak: true
      }
    });
    console.log('Contributor found:', !!contributor);

    if (!contributor) {
      contributor = await prisma.user.create({
        data: {
          id: deviceId,
          email: deviceId,
          name: `Contributor ${deviceId.slice(-6)}`,
          gamificationPoints: 0,
          contributionCount: 0,
          badges: [],
          streak: 0,
          updatedAt: new Date()
        },
        select: {
          id: true,
          gamificationPoints: true,
          contributionCount: true,
          lastContributionDate: true,
          badges: true,
          streak: true
        }
      });
    }

    const today = new Date().toDateString();
    const lastContribution = contributor.lastContributionDate ? new Date(contributor.lastContributionDate).toDateString() : null;
    
    let pointsEarned = POINTS.PHOTO_UPLOAD;
    let newBadges: string[] = [];
    let streakBonus = 0;

    if (contributor.contributionCount === 0) {
      pointsEarned += POINTS.FIRST_CONTRIBUTION;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    let newStreak = contributor.streak || 0;
    if (lastContribution === yesterdayStr) {
      newStreak++;
      streakBonus = POINTS.DAILY_STREAK;
      pointsEarned += streakBonus;
    } else if (lastContribution !== today) {
      newStreak = 1;
    }

    const newPoints = (contributor.gamificationPoints || 0) + pointsEarned;
    const newCount = (contributor.contributionCount || 0) + 1;

    const currentBadges = contributor.badges || [];
    Object.entries(BADGES).forEach(([key, badge]) => {
      if (newCount >= badge.requirement && !currentBadges.includes(key)) {
        newBadges.push(key);
      }
    });

    await prisma.user.update({
      where: { id: deviceId },
      data: {
        gamificationPoints: newPoints,
        contributionCount: newCount,
        lastContributionDate: new Date(),
        badges: [...currentBadges, ...newBadges],
        streak: newStreak
      }
    });

    const higherRanked = await prisma.user.count({
      where: { gamificationPoints: { gt: newPoints } }
    });

    return NextResponse.json({
      success: true,
      points: {
        earned: pointsEarned,
        total: newPoints
      },
      badges: {
        new: newBadges.map(key => BADGES[key as keyof typeof BADGES]),
        total: [...currentBadges, ...newBadges]
      },
      streak: newStreak,
      rank: higherRanked + 1
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('deviceId');

  if (deviceId) {
    let contributor = await prisma.user.findFirst({
      where: { email: deviceId },
      select: {
        gamificationPoints: true,
        contributionCount: true,
        badges: true,
        streak: true
      }
    });

    if (!contributor) {
      return NextResponse.json({
        points: 0,
        contributions: 0,
        badges: [],
        streak: 0,
        rank: 0
      });
    }

    const higherRanked = await prisma.user.count({
      where: { gamificationPoints: { gt: contributor.gamificationPoints || 0 } }
    });

    return NextResponse.json({
      points: contributor.gamificationPoints || 0,
      contributions: contributor.contributionCount || 0,
      badges: contributor.badges || [],
      streak: contributor.streak || 0,
      rank: higherRanked + 1
    });
  }

  const topUsers = await prisma.user.findMany({
    orderBy: { gamificationPoints: 'desc' },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      gamificationPoints: true,
      contributionCount: true,
      badges: true
    }
  });

  return NextResponse.json({
    leaderboard: topUsers.map((user, index) => ({
      rank: index + 1,
      name: user.name || user.email?.split('@')[0] || 'Anonymous',
      points: user.gamificationPoints || 0,
      contributions: user.contributionCount || 0,
      badges: user.badges || []
    }))
  });
}
