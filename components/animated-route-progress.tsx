'use client'

import { useState, useEffect } from 'react'
import { MapPin, Circle } from 'lucide-react'

interface RouteProgressProps {
  steps: any[]
  currentStepIndex?: number
}

export default function AnimatedRouteProgress({ steps, currentStepIndex = 0 }: RouteProgressProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 0 : prev + 1))
    }, 200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative py-4">
      <div className="flex items-center justify-between mb-2">
        {steps.map((step, idx) => (
          <div key={idx} className="flex flex-col items-center relative z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              idx <= currentStepIndex 
                ? 'bg-blue-600 text-white scale-110' 
                : 'bg-stone-200 dark:bg-stone-700 text-stone-400'
            }`}>
              {idx === currentStepIndex ? (
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              ) : (
                <Circle className="h-4 w-4" fill={idx < currentStepIndex ? 'white' : 'none'} />
              )}
            </div>
            <div className="text-xs mt-2 text-center max-w-[80px] truncate">
              {step.transitDetails?.departure || step.instruction.slice(0, 20)}
            </div>
          </div>
        ))}
      </div>
      
      <div className="absolute top-8 left-0 right-0 h-1 bg-stone-200 dark:bg-stone-700">
        <div 
          className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300"
          style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  )
}
