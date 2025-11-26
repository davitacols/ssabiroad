"use client"

import { MapPin, Globe2 } from 'lucide-react'

interface SimpleMapProps {
  height?: string
  className?: string
}

export function SimpleMap({ height = "400px", className = "" }: SimpleMapProps) {
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 rounded-xl border border-stone-200 dark:border-stone-800 ${className}`} style={{ height }}>
      <div className="text-center p-6">
        <div className="relative mb-6">
          <Globe2 className="h-16 w-16 text-blue-500 mx-auto mb-2" />
          <MapPin className="h-8 w-8 text-red-500 absolute top-2 left-1/2 transform -translate-x-1/2" />
        </div>
        <h3 className="text-xl font-semibold text-stone-700 dark:text-stone-300 mb-2">Interactive Map</h3>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">Discover locations from your photos</p>
        <div className="text-xs text-stone-400 dark:text-stone-500">
          Upload a photo to see location details
        </div>
      </div>
    </div>
  )
}