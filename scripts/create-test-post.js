const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createTestPost() {
  try {
    // Get first user
    const user = await prisma.user.findFirst()
    if (!user) {
      console.log('No user found. Creating default user...')
      const newUser = await prisma.user.create({
        data: {
          email: 'admin@pic2nav.com',
          name: 'Admin',
          password: 'hashed_password'
        }
      })
      console.log('User created:', newUser.email)
    }
    
    const authorId = user ? user.id : (await prisma.user.findFirst()).id
    
    const post = await prisma.blogPost.create({
      data: {
        title: "Test Post: How Pic2Nav Makes Navigation Easy",
        slug: "test-post-pic2nav-navigation",
        excerpt: "A test post to demonstrate proper formatting with links, headings, and bullet points.",
        content: `<p>Navigation technology is changing how we move through cities. With tools like Pic2Nav, finding locations has never been easier.</p>

<h2>1. Why Visual Navigation Matters</h2>

<p>Traditional addresses don't always work. That's where image-based navigation comes in. Check out <a href="https://pic2nav.com" target="_blank" rel="noopener noreferrer">pic2nav.com</a> to see how it works.</p>

<h2>2. Key Features</h2>

<p>Here are the main benefits:</p>

<ul>
<li>Upload any photo to find a location</li>
<li>No address needed</li>
<li>Works across Africa and beyond</li>
<li>Fast and accurate results</li>
</ul>

<h2>3. Real-World Applications</h2>

<p>Delivery drivers use it daily. Travelers find hidden spots. Security teams locate areas quickly. Visit <a href="https://ssabiroad.vercel.app" target="_blank" rel="noopener noreferrer">ssabiroad.vercel.app</a> for more information.</p>

<p>The future of navigation is visual, and platforms like Pic2Nav are leading the way.</p>`,
        coverImage: "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=800",
        category: "Tutorial",
        authorId: authorId,
        published: true
      }
    })
    
    console.log('✅ Test post created:', post.title)
    console.log('Slug:', post.slug)
    console.log('View at: http://localhost:3000/blog/' + post.slug)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestPost()
