const Anthropic = require('@anthropic-ai/sdk')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function generatePost() {
  try {
    const user = await prisma.user.findFirst()
    if (!user) throw new Error('No user found')

    console.log('Generating blog post...')

    const message = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `Write a blog post (1200 words) about emerging AI and navigation technologies in 2025. Use HTML tags. Return ONLY this JSON format with NO markdown:
{"title":"Title","excerpt":"Summary","content":"<h2>Title</h2><p>Content</p>","category":"Technology"}`
      }],
    })

    let responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    console.log('Response length:', responseText.length)
    let postData
    try {
      postData = JSON.parse(responseText)
    } catch (e) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) postData = JSON.parse(jsonMatch[0])
      else throw e
    }

    const slug = postData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 60) + `-${Date.now()}`

    const post = await prisma.blogPost.create({
      data: {
        title: postData.title,
        slug,
        excerpt: postData.excerpt,
        content: postData.content,
        category: postData.category || 'Technology',
        coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
        authorId: user.id,
        published: true,
      },
    })

    console.log('✅ Post created successfully!')
    console.log('Title:', post.title)
    console.log('Slug:', post.slug)
    console.log('URL: https://ssabiroad.vercel.app/blog/' + post.slug)
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

generatePost()
