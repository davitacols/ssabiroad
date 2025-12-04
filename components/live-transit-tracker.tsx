'use client'

import { useState, useEffect } from 'react'
import { Bus, Train, Clock, Users, Navigation2, TrendingUp } from 'lucide-react'

interface LiveTrackerProps {
  routeId: string
  vehicleType: 'BUS' | 'TRAIN'
}

export default function LiveTransitTracker({ routeId, vehicleType }: LiveTrackerProps) {
  const [liveData, setLiveData] = useState<any>(null)
  const [isLive, setIsLive] = useState(true)

  useEffect(() => {
    if (!isLive) return

    const fetchLive = async () => {
      try {
        const res = await fetch(`/api/transit-live?routeId=${routeId}`)
        const data = await res.json()
        setLiveData(data.vehicles[0])
      } catch (err) {
        console.error('Live tracking failed')
      }
    }

    fetchLive()
    const interval = setInterval(fetchLive, 3000)
    return () => clearInterval(interval)
  }, [routeId, isLive])

  if (!liveData) return null

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800 animate-pulse-slow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            {vehicleType === 'BUS' ? <Bus className="h-5 w-5 text-blue-600" /> : <Train className="h-5 w-5 text-purple-600" />}
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full" />
          </div>
          <span className="font-bold text-sm">LIVE TRACKING</span>
        </div>
        <button 
          onClick={() => setIsLive(!isLive)}
          className={`text-xs px-2 py-1 rounded-full ${isLive ? 'bg-green-500 text-white' : 'bg-gray-300'}`}
        >
          {isLive ? '● LIVE' : 'Paused'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <div>
            <div className="text-xs text-stone-500">Speed</div>
            <div className="font-semibold">{liveData.speed.toFixed(0)} km/h</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-orange-600" />
          <div>
            <div className="text-xs text-stone-500">Occupancy</div>
            <div className="font-semibold">{liveData.occupancy}%</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Navigation2 className="h-4 w-4 text-green-600" />
          <div>
            <div className="text-xs text-stone-500">Next Stop</div>
            <div className="font-semibold truncate">{liveData.nextStop}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-purple-600" />
          <div>
            <div className="text-xs text-stone-500">ETA</div>
            <div className="font-semibold">{liveData.eta}</div>
          </div>
        </div>
      </div>

      {liveData.delay > 0 && (
        <div className="mt-3 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Running {liveData.delay} min behind schedule
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between text-xs text-stone-500">
          <span>Vehicle: {liveData.id}</span>
          <span>Updated: Just now</span>
        </div>
      </div>
    </div>
  )
}
