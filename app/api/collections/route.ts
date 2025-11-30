import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { checkRateLimit } from '@/lib/rate-limit'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  if (!checkRateLimit(request)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }

  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    const collections = bookmarks.reduce((acc: any, bookmark) => {
      const category = (bookmark as any).category || 'Uncategorized'
      if (!acc[category]) acc[category] = []
      acc[category].push(bookmark)
      return acc
    }, {})

    return NextResponse.json({ collections })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!checkRateLimit(request)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  try {
    const { userId, locationId, name, category } = await request.json()

    if (!userId || !locationId) {
      return NextResponse.json({ error: 'User ID and location ID required' }, { status: 400 })
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        id: `bm_${Date.now()}`,
        userId,
        title: name,
        url: `/location/${locationId}`,
        createdAt: new Date()
      }
    })

    return NextResponse.json({ bookmark })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create collection item' }, { status: 500 })
  }
}
