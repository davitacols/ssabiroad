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
    const { content, authorId, postId } = await req.json()
    
    const comment = await prisma.blogComment.create({
      data: { content, authorId, postId },
      include: { author: { select: { name: true, email: true } } }
    })
    
    return NextResponse.json(comment)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
