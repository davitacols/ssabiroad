import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import Anthropic from '@anthropic-ai/sdk'

const prisma = new PrismaClient()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findFirst()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 500 })
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Write a blog post about latest navigation tech, AI, or smart cities news. Include title, excerpt, HTML content with <h2>, <p>, <ul>, <li> tags. Only mention Pic2Nav (https://pic2nav.com) if highly relevant (30% chance). Return JSON: {"title":"...","excerpt":"...","content":"...","category":"News"}`
      }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    const postData = JSON.parse(responseText)

    const slug = postData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 60) + `-${Date.now()}`

    const post = await prisma.blogPost.create({
      data: {
        title: postData.title,
        slug,
        excerpt: postData.excerpt,
        content: postData.content,
        category: postData.category || 'News',
        coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
        authorId: user.id,
        published: true,
      },
    })

    return NextResponse.json({ success: true, post: { id: post.id, title: post.title } })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
