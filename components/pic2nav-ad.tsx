'use client'

import { Button } from '@/components/ui/button'
import { Camera, MapPin, Smartphone, Download, Star, Users, Zap } from 'lucide-react'
import Link from 'next/link'

interface Pic2NavAdProps {
  variant?: 'sidebar' | 'inline' | 'banner' | 'footer'
  className?: string
}

export function Pic2NavAd({ variant = 'sidebar', className = '' }: Pic2NavAdProps) {
  if (variant === 'sidebar') {
    return (
      <div className={`p-5 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 shadow-sm ${className}`}>
        <div className="mb-4">
          <h3 className="font-semibold text-base mb-1 text-stone-900 dark:text-white">Pic2Nav</h3>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Photo location analysis tool
          </p>
        </div>
        <div className="space-y-2 mb-4 text-sm text-stone-700 dark:text-stone-300">
          <div>• Location detection from images</div>
          <div>• Building identification</div>
          <div>• Used by 10,000+ professionals</div>
        </div>
        <Button size="sm" className="w-full" variant="outline" asChild>
          <Link href="/camera">Try Now</Link>
        </Button>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`my-8 p-6 bg-stone-50 dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 ${className}`}>
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 text-stone-900 dark:text-white">Pic2Nav Photo Analysis</h3>
            <p className="text-stone-600 dark:text-stone-400 mb-4">
              Extract location data from photos. Identify buildings and landmarks automatically.
            </p>
            <div className="flex items-center gap-4 mb-4 text-sm text-stone-600 dark:text-stone-400">
              <span>Free tool</span>
              <span>•</span>
              <span>No registration required</span>
            </div>
            <Button variant="default" asChild>
              <Link href="/camera">Start Analysis</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-stone-100 dark:bg-stone-800 p-4 rounded-lg border border-stone-200 dark:border-stone-700 ${className}`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-medium text-stone-900 dark:text-white">Pic2Nav</h4>
            <p className="text-sm text-stone-600 dark:text-stone-400">Photo location analysis</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/camera">Try Tool</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (variant === 'footer') {
    return (
      <div className={`bg-stone-900 text-white p-6 rounded-lg ${className}`}>
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Try Pic2Nav</h3>
          <p className="text-stone-300 mb-4 max-w-sm mx-auto">
            Extract location data from any photo using our analysis tool.
          </p>
          <Button className="bg-white text-stone-900 hover:bg-stone-100" asChild>
            <Link href="/camera">Start Analysis</Link>
          </Button>
        </div>
      </div>
    )
  }

  return null
}