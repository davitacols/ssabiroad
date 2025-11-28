const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function getSiteName(url) {
  const siteNames = {
    'pic2nav.com': 'Pic2Nav',
    'ssabiroad.vercel.app': 'SSABIRoad',
    'github.com': 'GitHub',
    'medium.com': 'Medium',
    'twitter.com': 'Twitter',
    'linkedin.com': 'LinkedIn'
  }
  const domain = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
  return siteNames[domain] || domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)
}

function formatContent(content) {
  if (!content) return content
  
  if (/<h[1-6]>/.test(content)) {
    return content.replace(/(?<!href="|">)(https?:\/\/[^\s<>"()]+)(?!<\/a>)/g, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${getSiteName(url)}</a>`
    })
  }
  
  const lines = content.split('\n\n')
  
  return lines.map(line => {
    const trimmed = line.replace(/<\/?p>/g, '').trim()
    if (!trimmed) return ''
    
    if (/^\d+\.\s+[A-Z]/.test(trimmed) && trimmed.length < 100) {
      const withLinks = trimmed.replace(/(https?:\/\/[^\s)]+)/g, (url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${getSiteName(url)}</a>`
      })
      return `<h2>${withLinks}</h2>`
    }
    
    if (trimmed.length < 100 && /^[A-Z][^.!?]*$/.test(trimmed) && !/^(The|A|An)\s/.test(trimmed)) {
      const withLinks = trimmed.replace(/(https?:\/\/[^\s)]+)/g, (url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${getSiteName(url)}</a>`
      })
      return `<h2>${withLinks}</h2>`
    }
    
    const withLinks = trimmed.replace(/(https?:\/\/[^\s)]+)/g, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${getSiteName(url)}</a>`
    })
    return `<p>${withLinks}</p>`
  }).filter(Boolean).join('')
}

async function formatAllPosts() {
  try {
    const posts = await prisma.blogPost.findMany()
    
    console.log(`Found ${posts.length} posts to format`)
    
    for (const post of posts) {
      const formattedContent = formatContent(post.content)
      
      await prisma.blogPost.update({
        where: { id: post.id },
        data: { content: formattedContent }
      })
      
      console.log(`✓ Formatted: ${post.title}`)
    }
    
    console.log('\n✅ All posts formatted successfully!')
  } catch (error) {
    console.error('Error formatting posts:', error)
  } finally {
    await prisma.$disconnect()
  }
}

formatAllPosts()
