import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(req: NextRequest) {
  try {
    const { userId, name, bio, avatar } = await req.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }
    
    const updateData: any = { updatedAt: new Date() }
    if (name !== undefined) updateData.name = name
    if (bio !== undefined) updateData.bio = bio
    if (avatar !== undefined) updateData.avatar = avatar
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData
    })
    
    return NextResponse.json(user)
  } catch (error: any) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }
    
    const [user, locations, bookmarks, blogPosts] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, bio: true, avatar: true, createdAt: true }
      }),
      prisma.location.count({ where: { userId } }),
      prisma.bookmark.count({ where: { userId } }),
      prisma.blogPost.count({ where: { authorId: userId } })
    ])
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      ...user,
      stats: {
        locations,
        bookmarks,
        scans: blogPosts
      }
    })
  } catch (error: any) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch profile' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
