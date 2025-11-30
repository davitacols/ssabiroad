'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LoadingButton } from '@/components/ui/loading-button'
import { MapPin, Calendar, TrendingUp } from 'lucide-react'

export default function DetectionHistory() {
  const [detections, setDetections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = document.cookie.split('; ').find(row => row.startsWith('token='))
    const userId = token ? JSON.parse(atob(token.split('.')[1])).userId : null
    
    fetch(`/api/detections${userId ? `?userId=${userId}` : ''}`)
      .then(res => res.json())
      .then(data => {
        setDetections(data.detections || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Detection History</h1>
          <LoadingButton href="/">Back to Home</LoadingButton>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : detections.length === 0 ? (
          <div className="text-center py-12 text-stone-600">No detections yet</div>
        ) : (
          <div className="grid gap-4">
            {detections.map((detection) => (
              <div key={detection.id} className="border border-stone-200 dark:border-stone-800 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{detection.businessName || 'Unknown Location'}</h3>
                    <p className="text-stone-600 dark:text-stone-400 mb-3">{detection.detectedAddress}</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{detection.latitude.toFixed(4)}, {detection.longitude.toFixed(4)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(detection.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>{(detection.confidence * 100).toFixed(0)}% confidence</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-stone-100 dark:bg-stone-800 rounded-full text-xs">
                    {detection.method}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
