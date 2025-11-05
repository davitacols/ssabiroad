import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stories = await prisma.story.findMany({
      where: {
        createdAt: { gte: twentyFourHoursAgo },
        isPublic: true,
        ...(userId && { userId: { not: userId } }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, stories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, location, address, image, isPublic } = await request.json();

    if (!userId || !location || !image) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const story = await prisma.story.create({
      data: {
        id: `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        location,
        address: address || '',
        image,
        isPublic: isPublic !== false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, story });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!id || !userId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    await prisma.story.delete({ where: { id, userId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
