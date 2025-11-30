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
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Write a comprehensive, detailed blog post (1500-2000 words) about navigation technology, AI in mapping, smart cities, location services, or building recognition. 

Requirements:
- Create engaging, in-depth content with multiple sections
- Use proper HTML formatting: <h2> for sections, <h3> for subsections, <p> for paragraphs, <ul>/<li> for lists, <strong> for emphasis
- Include practical examples, use cases, or tips
- Write in a professional yet accessible tone
- Only mention Pic2Nav (https://pic2nav.com) if naturally relevant (20% chance)
- Make it valuable and informative for readers

Return ONLY valid JSON in this exact format:
{"title":"Engaging Title Here","excerpt":"Compelling 2-3 sentence summary","content":"<h2>Section Title</h2><p>Detailed content...</p>...","category":"Tutorial or Guide or News or Technology"}`
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
