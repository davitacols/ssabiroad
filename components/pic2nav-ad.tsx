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
      <div className={`p-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-xl border border-blue-200 dark:border-blue-800 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <Camera className="h-5 w-5 text-blue-600" />
          <span className="font-bold text-blue-900 dark:text-blue-100">Pic2Nav Web App</span>
        </div>
        <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Find Any Location from Photos</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          AI-powered photo location analysis with instant location discovery and building recognition.
        </p>
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <MapPin className="h-3 w-3" />
            <span>Instant Location Discovery</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Zap className="h-3 w-3" />
            <span>Building Recognition</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Users className="h-3 w-3" />
            <span>10,000+ Active Users</span>
          </div>
        </div>
        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700" asChild>
          <Link href="/camera">Try Pic2Nav Now</Link>
        </Button>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`my-8 p-6 bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/50 rounded-xl border border-green-200 dark:border-green-800 ${className}`}>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">FEATURED TOOL</span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Pic2Nav: AI Photo Location Scanner</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Turn any photo into precise location data. Perfect for photographers, real estate professionals, and location scouts.
            </p>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="text-sm font-medium">4.8</span>
              </div>
              <span className="text-sm text-gray-500">Free to Use</span>
            </div>
            <Button className="bg-green-600 hover:bg-green-700" asChild>
              <Link href="/camera">Try Now</Link>
            </Button>
          </div>
          <div className="flex-shrink-0">
            <img src="/images/app-screenshot-1.jpg" alt="Pic2Nav App" className="w-32 h-56 object-cover rounded-lg shadow-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg ${className}`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Camera className="h-6 w-6" />
            <div>
              <h4 className="font-bold">Pic2Nav Web App</h4>
              <p className="text-sm opacity-90">AI-powered photo location analysis</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" asChild>
            <Link href="/camera">Try Free</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (variant === 'footer') {
    return (
      <div className={`bg-gray-900 text-white p-8 rounded-xl ${className}`}>
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Download className="h-6 w-6" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-2">Ready to Find Locations from Photos?</h3>
          <p className="text-gray-300 mb-6 max-w-md mx-auto">
            Join thousands of professionals using Pic2Nav for AI-powered photo location analysis and building recognition.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700" asChild>
              <Link href="/camera">Try Now</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800" asChild>
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}