'use client'

import { Button } from '@/components/ui/button'
import { BookOpen, ArrowRight, Camera, MapPin } from 'lucide-react'
import Link from 'next/link'

export function BlogCTA() {
  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/20 dark:to-indigo-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Blog Promotion */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">LATEST INSIGHTS</span>
            </div>
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              Discover Location Technology Insights
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Explore our blog for tutorials, guides, and insights about navigation technology, 
              photo location analysis, and building recognition.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button size="lg" asChild>
                <Link href="/blog" className="flex items-center gap-2">
                  Read Our Blog
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/blog/pic2nav-photo-location-scanner-professionals">
                  Learn About Pic2Nav
                </Link>
              </Button>
            </div>
          </div>

          {/* Pic2Nav Promotion */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Pic2Nav</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Photo Location Analysis Tool</p>
            </div>
            
            <div className="space-y-2 mb-4 text-sm text-gray-700 dark:text-gray-300">
              <div>• Extract GPS coordinates from photos</div>
              <div>• Identify buildings and landmarks</div>
              <div>• Get weather and location data</div>
            </div>

            <div className="flex items-center justify-between mb-4 text-sm text-gray-600 dark:text-gray-400">
              <span>Free tool</span>
              <span>No signup required</span>
            </div>

            <Button className="w-full" variant="default" asChild>
              <Link href="/camera">
                Try Tool
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}