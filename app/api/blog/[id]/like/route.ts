import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await req.json()
    const { id: postId } = await params

    const existing = await prisma.blogLike.findUnique({
      where: { userId_postId: { userId, postId } }
    })

    if (existing) {
      await prisma.blogLike.delete({ where: { id: existing.id } })
      await prisma.blogPost.update({
        where: { id: postId },
        data: { likes: { decrement: 1 } }
      })
      return NextResponse.json({ liked: false })
    } else {
      await prisma.blogLike.create({ data: { userId, postId } })
      await prisma.blogPost.update({
        where: { id: postId },
        data: { likes: { increment: 1 } }
      })
      return NextResponse.json({ liked: true })
    }
  } catch (error: any) {
    console.error('Like error:', error)
    return NextResponse.json({ error: error.message || 'Failed to toggle like' }, { status: 500 })
  }
}
