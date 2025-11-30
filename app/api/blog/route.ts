import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where: { published: true },
        include: {
          author: { select: { name: true, email: true } },
          _count: { select: { comments: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.blogPost.count({ where: { published: true } })
    ])

    return NextResponse.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    })
  } catch (error: any) {
    console.error('Blog fetch error:', error)
    return NextResponse.json({ error: 'Failed', posts: [] }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { title, slug, excerpt, content, coverImage, category, authorId } = await req.json()
    
    let userId = authorId
    if (!userId || userId === 'default-user-id') {
      const user = await prisma.user.findFirst()
      userId = user?.id || 'default-blog-author'
    }
    
    const post = await prisma.blogPost.create({
      data: { title, slug, excerpt, content, coverImage, category, authorId: userId, published: true }
    })
    
    return NextResponse.json(post)
  } catch (error: any) {
    console.error('Blog post error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
