"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Building, 
  MapPin, 
  Landmark, 
  ImageIcon, 
  Info, 
  ChevronRight, 
  ChevronDown,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface BuildingInfoDisplayProps {
  recognitionResult: any
  onShowFullDetails: () => void
}

export function BuildingInfoDisplay({ recognitionResult, onShowFullDetails }: BuildingInfoDisplayProps) {
  const [activeTab, setActiveTab] = useState("info")
  const [showMore, setShowMore] = useState(false)
  
  if (!recognitionResult) return null
  
  // Nearby places data with actual image URLs
  const nearbyPlaces = [
    {
      name: "Central Park",
      type: "Park",
      distance: "120m",
      photo: "https://images.unsplash.com/photo-1534270804882-6b5048b1c1fc?w=300&h=200&auto=format&fit=crop"
    },
    {
      name: "City Museum",
      type: "Museum",
      distance: "250m",
      photo: "https://images.unsplash.com/photo-1565060169194-19fabf63eba8?w=300&h=200&auto=format&fit=crop"
    },
    {
      name: "Riverside Cafe",
      type: "Restaurant",
      distance: "180m",
      photo: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300&h=200&auto=format&fit=crop"
    }
  ]
  
  // Building photos with actual image URLs
  const buildingPhotos = recognitionResult.photos || [
    "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&h=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1464146072230-91cabc968266?w=800&h=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&h=600&auto=format&fit=crop"
  ]
  
  return (
    <div className="space-y-4">
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
            <Building className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{recognitionResult.name || "Building Information"}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {recognitionResult.buildingType || "Building"} • {recognitionResult.category || "Unknown Category"}
            </p>
          </div>
        </div>
        
        <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-3">
            <TabsTrigger value="info" className="text-xs">
              <Info className="h-3.5 w-3.5 mr-1" />
              Info
            </TabsTrigger>
            <TabsTrigger value="photos" className="text-xs">
              <ImageIcon className="h-3.5 w-3.5 mr-1" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="nearby" className="text-xs">
              <Landmark className="h-3.5 w-3.5 mr-1" />
              Nearby
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-3">
            {/* Building Information */}
            <div className="grid grid-cols-2 gap-2">
              {recognitionResult.buildingType && (
                <Card className="bg-muted/40">
                  <CardContent className="p-2 flex items-center">
                    <Building className="h-4 w-4 mr-2 text-teal-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Building Type</p>
                      <p className="text-xs font-medium">{recognitionResult.buildingType}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {recognitionResult.materialType && (
                <Card className="bg-muted/40">
                  <CardContent className="p-2 flex items-center">
                    <Building className="h-4 w-4 mr-2 text-teal-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Material</p>
                      <p className="text-xs font-medium">{recognitionResult.materialType}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {recognitionResult.address && (
                <Card className="bg-muted/40 col-span-2">
                  <CardContent className="p-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-teal-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="text-xs font-medium">{recognitionResult.address}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Additional Information (expandable) */}
            {recognitionResult.description && (
              <div className="mt-2">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md">
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {showMore 
                      ? recognitionResult.description 
                      : `${recognitionResult.description.substring(0, 100)}${recognitionResult.description.length > 100 ? '...' : ''}`
                    }
                  </p>
                  
                  {recognitionResult.description.length > 100 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowMore(!showMore)} 
                      className="w-full mt-1 h-6 text-xs"
                    >
                      {showMore ? (
                        <>Show Less <ChevronDown className="ml-1 h-3 w-3" /></>
                      ) : (
                        <>Show More <ChevronDown className="ml-1 h-3 w-3 transform rotate-180" /></>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="photos" className="space-y-3">
            {/* Building Photos */}
            <div className="grid grid-cols-2 gap-2">
              {buildingPhotos.slice(0, 4).map((photo, index) => (
                <div key={index} className="aspect-video overflow-hidden rounded-md">
                  <img
                    src={photo}
                    alt={`${recognitionResult.name || "Building"} - Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="nearby" className="space-y-3">
            {/* Nearby Places */}
            <div className="space-y-2">
              {nearbyPlaces.map((place, index) => (
                <div key={index} className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md flex items-center gap-2">
                  <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                    <img src={place.photo} alt={place.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{place.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{place.type}</p>
                  </div>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {place.distance}
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* View Complete Details Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onShowFullDetails}
          className="w-full mt-3 bg-teal-50 hover:bg-teal-100 border-teal-200 dark:bg-teal-900/20 dark:hover:bg-teal-900/30 dark:border-teal-800/50 rounded-lg"
        >
          <ExternalLink className="w-4 h-4 mr-2 text-teal-600 dark:text-teal-400" />
          <span className="text-teal-700 dark:text-teal-300">View Complete Building Information</span>
        </Button>
      </div>
    </div>
  )
}