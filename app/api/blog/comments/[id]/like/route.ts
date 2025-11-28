import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await req.json()
    const { id: commentId } = await params

    const existing = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } }
    })

    if (existing) {
      await prisma.commentLike.delete({ where: { id: existing.id } })
      await prisma.blogComment.update({
        where: { id: commentId },
        data: { likes: { decrement: 1 } }
      })
      return NextResponse.json({ liked: false })
    } else {
      await prisma.commentLike.create({ data: { userId, commentId } })
      await prisma.blogComment.update({
        where: { id: commentId },
        data: { likes: { increment: 1 } }
      })
      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
  }
}
