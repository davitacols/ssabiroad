'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Navigation, Bus, Train, Clock, ArrowRight, Repeat, Leaf, Share2, Star, Radio, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { TransitCache } from '@/lib/transit-cache'

const TransitMap = dynamic(() => import('@/components/transit-map'), { ssr: false })
const LiveTransitTracker = dynamic(() => import('@/components/live-transit-tracker'), { ssr: false })

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
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null)
  const [currency, setCurrency] = useState({ symbol: '$', code: 'USD', rate: 1 })
  const [departureTime, setDepartureTime] = useState('now')
  const [favoriteRoutes, setFavoriteRoutes] = useState<any[]>([])
  const [showMap, setShowMap] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const originRef = useRef<HTMLInputElement>(null)

  const swapLocations = () => {
    const temp = originInput
    setOriginInput(destination)
    setDestination(temp)
  }

  const getCurrency = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`/api/geocode?latlng=${lat},${lng}`)
      const data = await res.json()
      const country = data.results[0]?.address_components?.find((c: any) => c.types.includes('country'))?.short_name
      
      const currencies: Record<string, { symbol: string, code: string, rate: number }> = {
        'NG': { symbol: '₦', code: 'NGN', rate: 1600 },
        'US': { symbol: '$', code: 'USD', rate: 1 },
        'GB': { symbol: '£', code: 'GBP', rate: 0.79 },
        'EU': { symbol: '€', code: 'EUR', rate: 0.92 },
      }
      
      setCurrency(currencies[country || 'US'] || currencies['US'])
    } catch (err) {
      setCurrency({ symbol: '$', code: 'USD', rate: 1 })
    }
  }

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          setOriginInput('Current Location')
          getCurrency(pos.coords.latitude, pos.coords.longitude)
        },
        () => setOriginInput('')
      )
    }
    const saved = localStorage.getItem('favoriteRoutes')
    if (saved) setFavoriteRoutes(JSON.parse(saved))
  }, [])

  const toggleFavorite = (route: any, index: number) => {
    const routeKey = `${originInput}-${destination}-${index}`
    const existing = favoriteRoutes.find(r => r.key === routeKey)
    let updated
    if (existing) {
      updated = favoriteRoutes.filter(r => r.key !== routeKey)
    } else {
      updated = [...favoriteRoutes, { key: routeKey, route, origin: originInput, destination, timestamp: Date.now() }]
    }
    setFavoriteRoutes(updated)
    localStorage.setItem('favoriteRoutes', JSON.stringify(updated))
  }

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
        const originGeocode = await fetch(`/api/geocode?address=${encodeURIComponent(originInput)}`)
        const originData = await originGeocode.json()
        if (originData.location) {
          originCoords = { lat: originData.location.lat, lng: originData.location.lng }
        }
      }

      const geocodeRes = await fetch(`/api/geocode?address=${encodeURIComponent(destination)}`)
      const geocodeData = await geocodeRes.json()
      
      if (geocodeData.location) {
        const destCoords = geocodeData.location
        const cacheKey = `${originCoords.lat},${originCoords.lng}-${destCoords.lat},${destCoords.lng}`
        
        const res = await fetch(
          `/api/transit-directions?originLat=${originCoords.lat}&originLng=${originCoords.lng}&destLat=${destCoords.lat}&destLng=${destCoords.lng}`
        )
        const data = await res.json()
        
        if (data.routes && data.routes.length > 0) {
          setRoutes(data.routes)
          TransitCache.saveRoute(cacheKey, data.routes)
        } else {
          setError(data.error || 'No transit routes found for this journey')
        }
      }
    } catch (err) {
      setError('Failed to find routes')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="sticky top-0 z-50 border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-12 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/camera" className="text-sm text-stone-600 hover:text-stone-900">Camera</Link>
            <Link href="/blog" className="text-sm text-stone-600 hover:text-stone-900">Blog</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-stone-900 mb-2">Plan Your Journey</h1>
          <p className="text-lg text-stone-600">Find the best public transport routes</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 mb-8">
          <div className="space-y-6">
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <label className="text-sm font-medium text-stone-700">From</label>
              </div>
              <input
                ref={originRef}
                type="text"
                value={originInput}
                onChange={(e) => setOriginInput(e.target.value)}
                placeholder="Enter starting location"
                className="w-full px-4 py-4 rounded-lg border-2 border-stone-200 focus:border-blue-500 focus:outline-none text-base"
                onFocus={() => originSuggestions.length > 0 && setShowOriginSuggestions(true)}
              />
              {showOriginSuggestions && originSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-stone-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {originSuggestions.map((suggestion: any) => (
                    <button
                      key={suggestion.place_id}
                      onClick={() => {
                        setOriginInput(suggestion.description)
                        setShowOriginSuggestions(false)
                      }}
                      className="w-full text-left p-3 hover:bg-stone-50 border-b border-stone-100 last:border-0"
                    >
                      <div className="font-medium text-sm">{suggestion.structured_formatting.main_text}</div>
                      <div className="text-xs text-stone-500">{suggestion.structured_formatting.secondary_text}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <button
                onClick={swapLocations}
                className="p-3 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors"
              >
                <Repeat className="h-5 w-5 text-stone-600" />
              </button>
            </div>

            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <label className="text-sm font-medium text-stone-700">To</label>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Enter destination"
                className="w-full px-4 py-4 rounded-lg border-2 border-stone-200 focus:border-blue-500 focus:outline-none text-base"
                onKeyPress={(e) => e.key === 'Enter' && searchDestination()}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-stone-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion: any) => (
                    <button
                      key={suggestion.place_id}
                      onClick={() => {
                        setDestination(suggestion.description)
                        setShowSuggestions(false)
                      }}
                      className="w-full text-left p-3 hover:bg-stone-50 border-b border-stone-100 last:border-0"
                    >
                      <div className="font-medium text-sm">{suggestion.structured_formatting.main_text}</div>
                      <div className="text-xs text-stone-500">{suggestion.structured_formatting.secondary_text}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={searchDestination} 
              disabled={!destination || !originInput || loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-stone-300 text-white rounded-lg font-semibold text-lg transition-colors disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Find Routes'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {routes.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-stone-900">{routes.length} route{routes.length > 1 ? 's' : ''} found</h2>
            </div>

            {routes.map((route, i) => (
              <div 
                key={i} 
                className="bg-white border-2 border-stone-200 hover:border-blue-500 rounded-xl p-6 transition-all cursor-pointer"
                onClick={() => setSelectedRoute(selectedRoute === i ? null : i)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl font-bold text-stone-900">{route.duration}</span>
                      {i === 0 && <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Fastest</span>}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-stone-600">
                      <span className="font-medium">{route.distance}</span>
                      <span>•</span>
                      <span className="font-medium">{currency.symbol}{(parseFloat(route.fare) * currency.rate).toFixed(0)}</span>
                    </div>
                  </div>
                </div>

                    {selectedRoute === i && route.steps.find((s: any) => s.transitDetails) && (
                      <div className="mb-4">
                        <LiveTransitTracker 
                          routeId={route.steps.find((s: any) => s.transitDetails)?.transitDetails?.line || 'Bus 42'}
                          vehicleType={route.steps.find((s: any) => s.transitDetails)?.transitDetails?.vehicle || 'BUS'}
                        />
                      </div>
                    )}

                    <div className="space-y-3">
                      {route.steps.map((step: any, j: number) => (
                        <div key={j} className="flex gap-3">
                          <div className="flex flex-col items-center pt-1">
                            {step.transitDetails ? (
                              step.transitDetails.vehicle === 'BUS' ? 
                                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                  <Bus className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                </div> : 
                                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                  <Train className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                                <ArrowRight className="h-4 w-4 text-stone-400" />
                              </div>
                            )}
                            {j < route.steps.length - 1 && (
                              <div className="w-0.5 h-full bg-stone-200 dark:bg-stone-700 my-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="text-sm font-medium mb-1">{step.instruction}</p>
                            {step.transitDetails && (
                              <div className="text-xs text-stone-600 dark:text-stone-400 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{step.transitDetails.line}</span>
                                  {selectedRoute === i && <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs flex items-center gap-1"><Radio className="h-2.5 w-2.5" />Live</span>}
                                </div>
                                <div>{step.transitDetails.departure} → {step.transitDetails.arrival}</div>
                                <div>{step.transitDetails.numStops} stops • {step.duration}</div>
                              </div>
                            )}
                            {!step.transitDetails && (
                              <div className="text-xs text-stone-500">{step.duration} • {step.distance}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

      </div>
    </div>
  )
}
