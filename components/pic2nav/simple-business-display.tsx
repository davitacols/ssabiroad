"use client"

import { Building, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface SimpleBusinessDisplayProps {
  businessName: string
  address?: string
  category?: string
  buildingType?: string
  latitude?: number
  longitude?: number
}

export function SimpleBusinessDisplay({
  businessName,
  address,
  category = "Business",
  buildingType,
  latitude,
  longitude,
}: SimpleBusinessDisplayProps) {
  return (
    <div className="mt-8 pt-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl z-10 relative">
      <h3 className="text-lg font-bold mb-4 flex items-center">
        <Building className="h-5 w-5 mr-2 text-teal-500" />
        Business Information
      </h3>

      <div className="mb-3">
        <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Name</div>
        <div className="font-medium">{businessName}</div>
      </div>

      {category && (
        <div className="mb-3">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Category</div>
          <Badge variant="secondary">{category}</Badge>
        </div>
      )}

      {buildingType && (
        <div className="mb-3">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Building Type</div>
          <Badge variant="outline">{buildingType}</Badge>
        </div>
      )}

      {address && (
        <div className="mb-4">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Address</div>
          <div className="flex items-start">
            <MapPin className="h-4 w-4 mr-1 mt-0.5 text-slate-400" />
            <span>{address}</span>
          </div>
        </div>
      )}

      {latitude && longitude && (
        <Button variant="outline" size="sm" className="w-full rounded-xl" asChild>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Google Maps
          </a>
        </Button>
      )}
    </div>
  )
}
