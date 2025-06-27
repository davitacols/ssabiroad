"use client"

import { useState } from "react"
import { LocationDetails } from "./location-details"
import { LocationMap } from "@/components/location-map"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface EnhancedLocationDisplayProps {
  result: any
  locationImages?: string[]
  onShare?: () => void
}

export function EnhancedLocationDisplay({ result, locationImages = [], onShare }: EnhancedLocationDisplayProps) {
  const [showMap, setShowMap] = useState(false)

  if (!result) return null

  const handleOpenMap = () => {
    setShowMap(true)
  }

  return (
    <div className="space-y-4">
      {/* Location Details */}
      <LocationDetails 
        result={result}
        onOpenMap={handleOpenMap}
        onShare={onShare}
      />

      {/* Map Dialog */}
      <Dialog open={showMap} onOpenChange={setShowMap}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <LocationMap
            locations={[
              {
                id: result.placeId || "current",
                name: result.name || "Current Location",
                address: result.formattedAddress || result.address,
                location: {
                  lat: result.location?.latitude,
                  lng: result.location?.longitude
                },
                type: result.buildingType,
                category: result.category,
                verified: result.confidence > 0.7
              }
            ]}
            initialCenter={{
              lat: result.location?.latitude,
              lng: result.location?.longitude
            }}
            height="100%"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}