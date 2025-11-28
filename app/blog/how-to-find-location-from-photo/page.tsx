import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'How to Find Location from Photo: Complete Guide 2025',
  description: 'Learn how to extract GPS coordinates and identify locations from any photo using AI. Step-by-step tutorial with examples.',
  keywords: ['find location from photo', 'gps location from image', 'photo location finder', 'reverse image location search'],
}

export default function BlogPost() {
  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0a0a0a]">
      <nav className="sticky top-0 z-50 border-b border-stone-200/50 dark:border-stone-800/50 bg-white/50 dark:bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-12 sm:h-14 md:h-16 w-auto" />
          </Link>
          <Button variant="ghost" className="rounded-full" asChild>
            <Link href="/blog"><ArrowLeft className="mr-2 h-4 w-4" />Blog</Link>
          </Button>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">How to Find Location from Photo: Complete Guide 2025</h1>
        <div className="text-stone-600 dark:text-stone-400 mb-8">January 2025 • 5 min read</div>

        <div className="prose dark:prose-invert max-w-none space-y-6 text-stone-700 dark:text-stone-300">
          <p className="text-lg">
            Ever wondered where a photo was taken? Whether you're trying to identify a landmark, find a building, or extract GPS coordinates from an image, AI-powered tools make it easier than ever.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Method 1: Extract GPS Data from Photo Metadata</h2>
          <p>Most photos taken with smartphones contain EXIF metadata, including GPS coordinates. Here's how to extract them:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Upload your photo to Pic2Nav</li>
            <li>Our AI automatically reads EXIF data</li>
            <li>GPS coordinates are displayed instantly</li>
            <li>View the exact location on an interactive map</li>
          </ol>

          <h2 className="text-2xl font-bold mt-8 mb-4">Method 2: AI Visual Recognition</h2>
          <p>For photos without GPS data, AI can identify locations by analyzing visual features:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Landmark recognition (Eiffel Tower, Statue of Liberty, etc.)</li>
            <li>Building identification using architectural patterns</li>
            <li>Street view matching</li>
            <li>Text recognition from signs and storefronts</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Best Practices</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Use high-resolution photos for better accuracy</li>
            <li>Include distinctive landmarks or buildings</li>
            <li>Ensure good lighting and clear visibility</li>
            <li>Multiple angles improve identification</li>
          </ul>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl mt-8">
            <h3 className="text-xl font-bold mb-3">Try It Now</h3>
            <p className="mb-4">Upload any photo and discover its location in seconds using Pic2Nav's AI technology.</p>
            <Button className="rounded-full" asChild>
              <Link href="/camera">Start Finding Locations →</Link>
            </Button>
          </div>
        </div>
      </article>
    </div>
  )
}
