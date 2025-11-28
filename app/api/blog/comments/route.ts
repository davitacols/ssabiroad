import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get('postId')
  
  if (!postId) {
    return NextResponse.json({ error: 'postId required' }, { status: 400 })
  }

  try {
    const comments = await prisma.blogComment.findMany({
      where: { postId },
      include: { author: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(comments)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { content, authorId, postId, parentId } = await req.json()
    
    const comment = await prisma.blogComment.create({
      data: { content, authorId, postId, parentId: parentId || null },
      include: { author: { select: { name: true, email: true } } }
    })
    
    return NextResponse.json(comment)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { commentId, userId } = await req.json()
    
    const comment = await prisma.blogComment.findUnique({ where: { id: commentId } })
    if (!comment || comment.authorId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    await prisma.blogComment.delete({ where: { id: commentId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { commentId, userId, content } = await req.json()
    
    const comment = await prisma.blogComment.findUnique({ where: { id: commentId } })
    if (!comment || comment.authorId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    const updated = await prisma.blogComment.update({
      where: { id: commentId },
      data: { content },
      include: { author: { select: { name: true, email: true } } }
    })
    
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
  }
}
