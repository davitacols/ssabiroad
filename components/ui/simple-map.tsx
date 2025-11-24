"use client"

import { useEffect, useRef, useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'

interface SimpleMapProps {
  height?: string
  className?: string
}

export function SimpleMap({ height = "400px", className = "" }: SimpleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let map: google.maps.Map | null = null

    const initMap = () => {
      if (!mapRef.current) return

      // Get user location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }

          // Create map
          map = new google.maps.Map(mapRef.current!, {
            center: userLocation,
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
          })

          // Add user marker
          new google.maps.Marker({
            position: userLocation,
            map: map,
            title: "Your Location",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#4285f4",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2
            }
          })

          setIsLoading(false)
        },
        (error) => {
          console.error('Geolocation error:', error)
          // Default to NYC
          const defaultLocation = { lat: 40.7580, lng: -73.9855 }
          
          map = new google.maps.Map(mapRef.current!, {
            center: defaultLocation,
            zoom: 13,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
          })

          setError("Using default location")
          setIsLoading(false)
        }
      )
    }

    const loadGoogleMaps = () => {
      if (window.google?.maps) {
        initMap()
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = initMap
      script.onerror = () => {
        setError("Failed to load Google Maps")
        setIsLoading(false)
      }
      document.head.appendChild(script)
    }

    loadGoogleMaps()

    return () => {
      if (map) {
        map = null
      }
    }
  }, [])

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 rounded-xl border border-stone-200 dark:border-stone-800 ${className}`} style={{ height }}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-sm text-stone-600 dark:text-stone-400">Loading map...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 rounded-xl border border-stone-200 dark:border-stone-800 ${className}`} style={{ height }}>
        <div className="text-center p-6">
          <MapPin className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-stone-700 dark:text-stone-300 mb-2">Interactive Map</h3>
          <p className="text-sm text-stone-500 dark:text-stone-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className} style={{ height }}>
      <div ref={mapRef} className="w-full h-full rounded-xl" />
    </div>
  )
}