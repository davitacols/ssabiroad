import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Blog - Photo Location Tips & Crime Reporting Guide',
  description: 'Learn how to find locations from photos, identify buildings, extract GPS data, and report crimes in Nigeria. Expert tips and guides.',
}

const blogPosts = [
  {
    slug: 'how-to-find-location-from-photo',
    title: 'How to Find Location from Photo: Complete Guide 2025',
    excerpt: 'Learn how to extract GPS coordinates and identify locations from any photo using AI technology. Step-by-step tutorial.',
    date: 'January 2025',
    category: 'Tutorial',
  },
  {
    slug: 'identify-building-from-picture',
    title: 'How to Identify Buildings from Pictures Using AI',
    excerpt: 'Discover how AI can recognize buildings, landmarks, and architectural styles from photos. Complete guide with examples.',
    date: 'January 2025',
    category: 'Guide',
  },
  {
    slug: 'report-crime-online-nigeria',
    title: 'How to Report Crime Online in Nigeria: Official Guide',
    excerpt: 'Step-by-step guide to reporting crimes to Nigerian Police Force online. Anonymous reporting, emergency contacts, and tips.',
    date: 'January 2025',
    category: 'Safety',
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0a0a0a]">
      <nav className="sticky top-0 z-50 border-b border-stone-200/50 dark:border-stone-800/50 bg-white/50 dark:bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-12 sm:h-14 md:h-16 w-auto" />
          </Link>
          <Button variant="ghost" className="rounded-full" asChild>
            <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link>
          </Button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
        <p className="text-lg text-stone-600 dark:text-stone-400 mb-12">
          Tips, guides, and tutorials for photo location finding and crime reporting
        </p>

        <div className="space-y-8">
          {blogPosts.map((post) => (
            <article key={post.slug} className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
              <div className="text-sm text-stone-500 mb-2">{post.category} • {post.date}</div>
              <h2 className="text-2xl font-bold mb-3">{post.title}</h2>
              <p className="text-stone-600 dark:text-stone-400 mb-4">{post.excerpt}</p>
              <Button variant="ghost" className="rounded-full" asChild>
                <Link href={`/blog/${post.slug}`}>Read More →</Link>
              </Button>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
