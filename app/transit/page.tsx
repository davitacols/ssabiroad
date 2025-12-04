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
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`)
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
        const cacheKey = `${originCoords.lat},${originCoords.lng}-${destCoords.lat},${destCoords.lng}`
        
        const res = await fetch(
          `/api/transit-directions?originLat=${originCoords.lat}&originLng=${originCoords.lng}&destLat=${destCoords.lat}&destLng=${destCoords.lng}`
        )
        const data = await res.json()
        
        if (data.routes) {
          setRoutes(data.routes)
          TransitCache.saveRoute(cacheKey, data.routes)
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
    <div className="min-h-screen bg-white dark:bg-stone-950">
      <div className="border-b border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Transit</h1>
            <p className="text-sm text-stone-600 dark:text-stone-400">Plan your journey</p>
          </div>
          <Link href="/" className="text-sm text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100">
            Back
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6">
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium mb-2 text-stone-700 dark:text-stone-300">From</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                    <input
                      ref={originRef}
                      type="text"
                      value={originInput}
                      onChange={(e) => setOriginInput(e.target.value)}
                      placeholder="Your location"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onFocus={() => originSuggestions.length > 0 && setShowOriginSuggestions(true)}
                    />
                  </div>
                  {showOriginSuggestions && originSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                      {originSuggestions.map((suggestion: any) => (
                        <button
                          key={suggestion.place_id}
                          onClick={() => {
                            setOriginInput(suggestion.description)
                            setShowOriginSuggestions(false)
                          }}
                          className="w-full text-left p-4 hover:bg-stone-50 dark:hover:bg-stone-700 border-b border-stone-100 dark:border-stone-700 last:border-0 transition-colors"
                        >
                          <div className="font-medium text-sm">{suggestion.structured_formatting.main_text}</div>
                          <div className="text-xs text-stone-500 mt-0.5">{suggestion.structured_formatting.secondary_text}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={swapLocations}
                    className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    title="Swap locations"
                  >
                    <Repeat className="h-5 w-5 text-stone-600 dark:text-stone-400" />
                  </button>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium mb-2 text-stone-700 dark:text-stone-300">To</label>
                  <div className="relative">
                    <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="Where to?"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && searchDestination()}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    />
                  </div>
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                      {suggestions.map((suggestion: any) => (
                        <button
                          key={suggestion.place_id}
                          onClick={() => {
                            setDestination(suggestion.description)
                            setShowSuggestions(false)
                          }}
                          className="w-full text-left p-4 hover:bg-stone-50 dark:hover:bg-stone-700 border-b border-stone-100 dark:border-stone-700 last:border-0 transition-colors"
                        >
                          <div className="font-medium text-sm">{suggestion.structured_formatting.main_text}</div>
                          <div className="text-xs text-stone-500 mt-0.5">{suggestion.structured_formatting.secondary_text}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-stone-700 dark:text-stone-300">Departure</label>
                  <select
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="now">Leave now</option>
                    <option value="15">In 15 minutes</option>
                    <option value="30">In 30 minutes</option>
                    <option value="60">In 1 hour</option>
                  </select>
                </div>

                <button 
                  onClick={searchDestination} 
                  disabled={!destination || !originInput || loading}
                  className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-stone-300 dark:disabled:bg-stone-700 text-white rounded-xl font-medium transition-colors disabled:cursor-not-allowed"
                >
                  {loading ? 'Searching...' : 'Find routes'}
                </button>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
                  {error}
                </div>
              )}
            </div>

            {routes.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{routes.length} route{routes.length > 1 ? 's' : ''} found</h2>
                  <button
                    onClick={() => setShowMap(!showMap)}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {showMap ? 'Hide' : 'Show'} map
                  </button>
                </div>

                {showMap && origin.lat !== 0 && (
                  <div className="rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800">
                    <TransitMap origin={origin} destination={{ lat: 0, lng: 0 }} routes={routes} />
                  </div>
                )}

                {routes.map((route, i) => (
                  <div 
                    key={i} 
                    className={`bg-white dark:bg-stone-900 border rounded-2xl p-6 transition-all cursor-pointer ${
                      selectedRoute === i 
                        ? 'border-blue-500 shadow-lg shadow-blue-500/10' 
                        : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                    onClick={() => setSelectedRoute(selectedRoute === i ? null : i)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-semibold">{route.duration}</span>
                          {i === 0 && <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">Fastest</span>}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-stone-600 dark:text-stone-400">
                          <span>{route.distance}</span>
                          <span>•</span>
                          <span>{currency.symbol}{(parseFloat(route.fare) * currency.rate).toFixed(0)}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Leaf className="h-3.5 w-3.5" />
                            {route.carbonSaved}kg CO₂
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(route, i)
                          }}
                          className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                        >
                          <Star className={`h-5 w-5 ${favoriteRoutes.find(r => r.key === `${originInput}-${destination}-${i}`) ? 'fill-yellow-400 text-yellow-400' : 'text-stone-400'}`} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const text = `${originInput} → ${destination}\\n${route.duration} • ${route.distance}\\nVia Pic2Nav`
                            navigator.share ? navigator.share({ text }) : navigator.clipboard.writeText(text)
                          }}
                          className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                        >
                          <Share2 className="h-5 w-5 text-stone-400" />
                        </button>
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

            {routes.length === 0 && !loading && (
              <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bus className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Plan your journey</h3>
                <p className="text-sm text-stone-600 dark:text-stone-400">Enter your destination to see available transit routes</p>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            {favoriteRoutes.length > 0 && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  Saved routes
                </h3>
                <div className="space-y-2">
                  {favoriteRoutes.slice(0, 3).map((fav, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setOriginInput(fav.origin)
                        setDestination(fav.destination)
                      }}
                      className="w-full text-left p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                    >
                      <div className="text-sm font-medium truncate">{fav.origin}</div>
                      <div className="text-xs text-stone-500 truncate">→ {fav.destination}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
              <h3 className="font-semibold mb-2">Go green</h3>
              <p className="text-sm text-blue-100">Public transit reduces CO₂ emissions by up to 95% vs driving</p>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6">
              <h3 className="font-semibold mb-4">Quick links</h3>
              <div className="space-y-2">
                <Link href="/camera" className="block p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                  <div className="text-sm font-medium">Photo location</div>
                  <div className="text-xs text-stone-500">Find places from photos</div>
                </Link>
                <Link href="/blog" className="block p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                  <div className="text-sm font-medium">Blog</div>
                  <div className="text-xs text-stone-500">Tips and guides</div>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
