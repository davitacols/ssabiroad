import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading-button'
import { ArrowLeft, Shield, TrendingUp, Volume2, Users, History } from 'lucide-react'

export const metadata = {
  title: 'New Features 2025: Enhanced Location Intelligence | SSABIRoad',
  description: 'Discover the latest features including urban density analysis, safety scores, noise level estimation, and detection history tracking.',
  keywords: ['location intelligence', 'urban density', 'safety score', 'noise levels', 'building analysis'],
}

export default function NewFeatures2025() {
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
        <h1 className="text-4xl md:text-5xl font-bold mb-6">New Features 2025: Enhanced Location Intelligence</h1>
        <div className="text-stone-600 dark:text-stone-400 mb-8">January 2025 • 8 min read</div>

        <div className="prose dark:prose-invert max-w-none space-y-6 text-stone-700 dark:text-stone-300">
          <p className="text-lg">
            We're excited to announce major updates to SSABIRoad that bring comprehensive location intelligence to your fingertips. These new features help you make informed decisions about any location.
          </p>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl my-8">
            <h3 className="text-xl font-bold mb-3">What's New</h3>
            <ul className="space-y-2">
              <li>🏙️ Urban Density Analysis</li>
              <li>🔒 Safety Score System</li>
              <li>🔊 Noise Level Estimation</li>
              <li>📚 Building Collections</li>
              <li>📜 Detection History</li>
              <li>⚡ Rate Limiting Protection</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Urban Density Analysis
          </h2>
          <p>
            Understand the population density of any area with our new urban density API. Using Census data, we calculate:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Population per square kilometer</li>
            <li>Housing unit density</li>
            <li>Classification (High/Medium/Low density)</li>
            <li>Density score (0-100)</li>
          </ul>
          <p>
            Perfect for real estate analysis, urban planning, or understanding neighborhood characteristics.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Safety Score System
          </h2>
          <p>
            Make informed decisions with our comprehensive safety scoring system. We analyze:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Recent crime reports within 5km radius</li>
            <li>Incident frequency over the past 90 days</li>
            <li>Safety classification from "Very Safe" to "Caution Advised"</li>
            <li>Real-time updates as new reports are filed</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2">
            <Volume2 className="h-6 w-6" />
            Noise Level Estimation
          </h2>
          <p>
            Estimate environmental noise levels based on:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Nearby roads and traffic patterns</li>
            <li>Commercial activity density</li>
            <li>Estimated decibel levels</li>
            <li>Classification (High/Moderate/Low)</li>
          </ul>
          <p>
            Ideal for finding quiet neighborhoods or assessing commercial viability.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2">
            <Users className="h-6 w-6" />
            Building Collections
          </h2>
          <p>
            Organize your saved locations into custom collections:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Create categories (Architecture, Favorites, Work, etc.)</li>
            <li>Quick access to grouped locations</li>
            <li>Visual folder interface</li>
            <li>Share collections with others</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2">
            <History className="h-6 w-6" />
            Detection History
          </h2>
          <p>
            Track all your location recognitions in one place:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>View past detections with confidence scores</li>
            <li>See detection methods used (GPS, AI, Visual)</li>
            <li>Filter by date and location</li>
            <li>Export your history</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Enhanced Energy Ratings</h2>
          <p>
            Our building analysis now includes improved energy efficiency calculations based on:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Solar panel detection</li>
            <li>Window and glass coverage</li>
            <li>Building age and materials</li>
            <li>Modern construction features</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">API Rate Limiting</h2>
          <p>
            To ensure fair usage and optimal performance, we've implemented intelligent rate limiting:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>100 requests per minute for standard users</li>
            <li>Rate limit headers in all responses</li>
            <li>Automatic throttling protection</li>
            <li>Enterprise plans available for higher limits</li>
          </ul>

          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl mt-8">
            <h3 className="text-xl font-bold mb-3">Try These Features Now</h3>
            <p className="mb-4">All new features are available immediately. Start exploring enhanced location intelligence today.</p>
            <div className="flex flex-wrap gap-3">
              <LoadingButton className="rounded-full" href="/history">
                View History →
              </LoadingButton>
              <LoadingButton variant="outline" className="rounded-full" href="/collections">
                My Collections →
              </LoadingButton>
            </div>
          </div>

          <h2 className="text-2xl font-bold mt-8 mb-4">What's Next?</h2>
          <p>
            We're continuously improving SSABIRoad. Coming soon:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>3D building visualizations</li>
            <li>Advanced structural analysis</li>
            <li>Cultural significance scoring</li>
            <li>Real-time environmental monitoring</li>
            <li>Mobile app enhancements</li>
          </ul>

          <div className="border-t border-stone-200 dark:border-stone-800 pt-8 mt-12">
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Have feedback or feature requests? <Link href="/profile" className="text-blue-600 hover:underline">Contact us</Link>
            </p>
          </div>
        </div>
      </article>
    </div>
  )
}
