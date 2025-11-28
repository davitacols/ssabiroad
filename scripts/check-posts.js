const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkPosts() {
  const posts = await prisma.blogPost.findMany()
  posts.forEach(post => {
    console.log('\n=== POST:', post.title)
    console.log('Content preview:', post.content.substring(0, 500))
  })
  await prisma.$disconnect()
}

checkPosts()
