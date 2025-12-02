'use client'

import { useState, useEffect, useRef } from 'react'
import { LoadingButton } from '@/components/ui/loading-button'
import { MapPin, Navigation, Bus, Train, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function TransitPage() {
  const [originInput, setOriginInput] = useState('')
  const [origin, setOrigin] = useState({ lat: 0, lng: 0 })
  const [destination, setDestination] = useState('')
  const [routes, setRoutes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [originSuggestions, setOriginSuggestions] = useState<any[]>([])
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const originRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          setOriginInput('Current Location')
        },
        () => setOriginInput('')
      )
    }
  }, [])

  useEffect(() => {
    if (originInput.length > 2 && originInput !== 'Current Location') {
      const timer = setTimeout(() => {
        fetch(`/api/places-autocomplete?input=${encodeURIComponent(originInput)}`)
          .then(res => res.json())
          .then(data => {
            setOriginSuggestions(data.predictions || [])
            setShowOriginSuggestions(true)
          })
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setOriginSuggestions([])
      setShowOriginSuggestions(false)
    }
  }, [originInput])

  useEffect(() => {
    if (destination.length > 2) {
      const timer = setTimeout(() => {
        fetch(`/api/places-autocomplete?input=${encodeURIComponent(destination)}`)
          .then(res => res.json())
          .then(data => {
            setSuggestions(data.predictions || [])
            setShowSuggestions(true)
          })
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [destination])

  const searchDestination = async () => {
    if (!destination || !originInput) return
    
    setLoading(true)
    setError('')

    try {
      let originCoords = origin
      
      if (originInput !== 'Current Location') {
        const originGeocode = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(originInput)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        )
        const originData = await originGeocode.json()
        if (originData.results[0]) {
          originCoords = originData.results[0].geometry.location
        }
      }

      const geocodeRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destination)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      )
      const geocodeData = await geocodeRes.json()
      
      if (geocodeData.results[0]) {
        const destCoords = geocodeData.results[0].geometry.location
        
        const res = await fetch(
          `/api/transit-directions?originLat=${originCoords.lat}&originLng=${originCoords.lng}&destLat=${destCoords.lat}&destLng=${destCoords.lng}`
        )
        const data = await res.json()
        
        if (data.routes) {
          setRoutes(data.routes)
        } else {
          setError('No transit routes found')
        }
      }
    } catch (err) {
      setError('Failed to find routes')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#0a0a0a] p-6">
      <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Public Transit Directions</h1>
          <LoadingButton href="/">Back to Home</LoadingButton>
        </div>

        <div className="bg-stone-50 dark:bg-stone-900 rounded-xl p-6 mb-6">
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium mb-2">From</label>
              <input
                ref={originRef}
                type="text"
                value={originInput}
                onChange={(e) => setOriginInput(e.target.value)}
                placeholder="Enter starting location or use current"
                className="w-full p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800"
                onFocus={() => originSuggestions.length > 0 && setShowOriginSuggestions(true)}
              />
              {showOriginSuggestions && originSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {originSuggestions.map((suggestion: any) => (
                    <button
                      key={suggestion.place_id}
                      onClick={() => {
                        setOriginInput(suggestion.description)
                        setShowOriginSuggestions(false)
                      }}
                      className="w-full text-left p-3 hover:bg-stone-50 dark:hover:bg-stone-700 border-b border-stone-100 dark:border-stone-700 last:border-0"
                    >
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-stone-400 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{suggestion.structured_formatting.main_text}</div>
                          <div className="text-xs text-stone-500 truncate">{suggestion.structured_formatting.secondary_text}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium mb-2">To (Destination)</label>
              <input
                ref={inputRef}
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Enter destination address or place name"
                className="w-full p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800"
                onKeyPress={(e) => e.key === 'Enter' && searchDestination()}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion: any) => (
                    <button
                      key={suggestion.place_id}
                      onClick={() => {
                        setDestination(suggestion.description)
                        setShowSuggestions(false)
                      }}
                      className="w-full text-left p-3 hover:bg-stone-50 dark:hover:bg-stone-700 border-b border-stone-100 dark:border-stone-700 last:border-0"
                    >
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-stone-400 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{suggestion.structured_formatting.main_text}</div>
                          <div className="text-xs text-stone-500 truncate">{suggestion.structured_formatting.secondary_text}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <LoadingButton 
              onClick={searchDestination} 
              disabled={!destination || !originInput || loading}
              className="w-full"
            >
              <Navigation className="mr-2 h-4 w-4" />
              Find Routes
            </LoadingButton>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {routes.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Available Routes</h2>
            {routes.map((route, i) => (
              <div key={i} className="border border-stone-200 dark:border-stone-800 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold">{route.duration}</span>
                    </div>
                    <div className="text-sm text-stone-600">{route.distance}</div>
                  </div>
                  <span className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full">
                    Route {i + 1}
                  </span>
                </div>

                <div className="space-y-3">
                  {route.steps.map((step: any, j: number) => (
                    <div key={j} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        {step.transitDetails ? (
                          step.transitDetails.vehicle === 'BUS' ? 
                            <Bus className="h-5 w-5 text-orange-600" /> : 
                            <Train className="h-5 w-5 text-purple-600" />
                        ) : (
                          <ArrowRight className="h-5 w-5 text-stone-400" />
                        )}
                        {j < route.steps.length - 1 && (
                          <div className="w-0.5 h-8 bg-stone-200 dark:bg-stone-700 my-1" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{step.instruction}</p>
                        {step.transitDetails && (
                          <div className="mt-1 text-xs text-stone-600 dark:text-stone-400">
                            <span className="font-semibold">{step.transitDetails.line}</span>
                            {' • '}
                            {step.transitDetails.departure} → {step.transitDetails.arrival}
                            {' • '}
                            {step.transitDetails.numStops} stops
                          </div>
                        )}
                        <div className="text-xs text-stone-500 mt-1">
                          {step.duration} • {step.distance}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {routes.length === 0 && !loading && (
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-3">How to Use</h3>
            <ul className="space-y-2 text-sm">
              <li>✓ Current location auto-detected</li>
              <li>✓ Enter destination with autocomplete</li>
              <li>✓ Get multiple route options</li>
            </ul>
          </div>
        )}
      </div>

      <aside className="space-y-6">
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <h3 className="text-xl font-bold mb-3">Save Time & Money</h3>
          <p className="text-sm mb-4">Find fastest public transit routes</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><Bus className="h-4 w-4" />Real-time schedules</div>
            <div className="flex items-center gap-2"><Train className="h-4 w-4" />Train connections</div>
            <div className="flex items-center gap-2"><Clock className="h-4 w-4" />Accurate times</div>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-xl p-6 border border-stone-200 dark:border-stone-800">
          <h3 className="font-bold mb-3">Quick Destinations</h3>
          <div className="space-y-2">
            {['City Center', 'Airport', 'Train Station', 'Mall'].map((place) => (
              <button key={place} onClick={() => setDestination(place)} className="w-full text-left p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 text-sm">
                <MapPin className="h-4 w-4 inline mr-2 text-blue-600" />{place}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6">
          <h3 className="font-bold mb-2">💡 Pro Tip</h3>
          <p className="text-sm">Compare routes for fastest option!</p>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-xl p-6 border border-stone-200 dark:border-stone-800">
          <h3 className="font-bold mb-3">More Features</h3>
          <Link href="/camera" className="block p-3 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 mb-2">
            <div className="font-medium text-sm">📸 Photo Location</div>
            <div className="text-xs text-stone-500">Find from photos</div>
          </Link>
          <Link href="/report-crime" className="block p-3 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800">
            <div className="font-medium text-sm">🚨 Report Crime</div>
            <div className="text-xs text-stone-500">Nigerian Police</div>
          </Link>
        </div>
      </aside>
      </div>
      </div>
    </div>
  )
}
