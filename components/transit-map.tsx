'use client'

import { useEffect, useRef } from 'react'
import { MapPin, Navigation } from 'lucide-react'

interface TransitMapProps {
  origin: { lat: number; lng: number }
  destination: { lat: number; lng: number }
  routes?: any[]
}

export default function TransitMap({ origin, destination, routes }: TransitMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && mapRef.current) {
      const map = new google.maps.Map(mapRef.current, {
        center: origin,
        zoom: 13,
        styles: [{ featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'on' }] }]
      })

      new google.maps.Marker({ position: origin, map, icon: { url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwN2JmZiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI4Ii8+PC9zdmc+', scaledSize: new google.maps.Size(32, 32) } })
      new google.maps.Marker({ position: destination, map, icon: { url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2RjMjYyNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI4Ii8+PC9zdmc+', scaledSize: new google.maps.Size(32, 32) } })

      const directionsService = new google.maps.DirectionsService()
      const directionsRenderer = new google.maps.DirectionsRenderer({ map, suppressMarkers: true })

      directionsService.route({
        origin,
        destination,
        travelMode: google.maps.TravelMode.TRANSIT
      }, (result, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(result)
        }
      })
    }
  }, [origin, destination])

  return (
    <div className="relative w-full h-96 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 bg-white dark:bg-stone-900 rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-blue-600" />
          <span>Origin</span>
        </div>
        <div className="flex items-center gap-2 text-sm mt-2">
          <Navigation className="h-4 w-4 text-red-600" />
          <span>Destination</span>
        </div>
      </div>
    </div>
  )
}
