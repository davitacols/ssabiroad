import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      include: {
        author: { select: { name: true, email: true } },
        _count: { select: { comments: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(posts)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, slug, excerpt, content, coverImage, category, authorId } = await req.json()
    
    let userId = authorId
    if (!userId || userId === 'default-user-id') {
      let user = await prisma.user.findFirst()
      if (!user) {
        user = await prisma.user.create({
          data: {
            id: 'default-blog-author',
            email: 'blog@pic2nav.com',
            name: 'Pic2Nav Team',
          }
        })
      }
      userId = user.id
    }
    
    const post = await prisma.blogPost.create({
      data: { title, slug, excerpt, content, coverImage, category, authorId: userId, published: true }
    })
    
    return NextResponse.json(post)
  } catch (error: any) {
    console.error('Blog post error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create post' }, { status: 500 })
  }
}
