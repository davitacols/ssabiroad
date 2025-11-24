import { Metadata } from 'next'
import Link from 'next/link'
import { generatePageMetadata } from '@/lib/seo-config'

export const metadata: Metadata = {
  ...generatePageMetadata('blog', 'Photo Location Discovery Blog | Pic2Nav', 'Learn about AI photo analysis, GPS extraction, and location discovery techniques. Tips and guides for finding photo locations.'),
}

const blogPosts = [
  {
    id: 1,
    title: "How AI Identifies Locations from Photos: The Complete Guide",
    excerpt: "Discover the technology behind photo location detection, from GPS metadata extraction to visual landmark recognition.",
    date: "2024-01-15",
    readTime: "5 min read",
    category: "Technology",
    slug: "ai-photo-location-detection-guide"
  },
  {
    id: 2,
    title: "10 Tips for Better Photo Location Results",
    excerpt: "Maximize accuracy when finding photo locations with these expert tips and best practices.",
    date: "2024-01-10", 
    readTime: "3 min read",
    category: "Tips",
    slug: "photo-location-tips"
  },
  {
    id: 3,
    title: "Privacy and Security in Photo Analysis",
    excerpt: "Learn how Pic2Nav protects your privacy while analyzing photos for location data.",
    date: "2024-01-05",
    readTime: "4 min read", 
    category: "Privacy",
    slug: "photo-analysis-privacy"
  }
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-stone-950">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-stone-900 dark:text-white mb-4">
            Photo Location Discovery Blog
          </h1>
          <p className="text-xl text-stone-600 dark:text-stone-400">
            Expert insights on AI photo analysis and location discovery
          </p>
        </header>

        <div className="grid gap-8">
          {blogPosts.map((post) => (
            <article key={post.id} className="border border-stone-200 dark:border-stone-800 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                  {post.category}
                </span>
                <time className="text-stone-500 text-sm">{post.date}</time>
                <span className="text-stone-500 text-sm">{post.readTime}</span>
              </div>
              
              <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-3 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <Link href={`/blog/${post.slug}`}>
                  {post.title}
                </Link>
              </h2>
              
              <p className="text-stone-600 dark:text-stone-400 mb-4 leading-relaxed">
                {post.excerpt}
              </p>
              
              <Link 
                href={`/blog/${post.slug}`}
                className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                Read more →
              </Link>
            </article>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-stone-600 dark:text-stone-400">
            More articles coming soon. Follow us for updates on photo location technology.
          </p>
        </div>
      </div>
    </div>
  )
}