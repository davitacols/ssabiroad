"use client"

import type React from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Info,
  MapPin,
  X,
  Navigation,
  Star,
  Clock,
  Phone,
  Globe,
  AccessibilityIcon,
  Leaf,
  Wifi,
  CreditCard,
  DollarSign,
  Shield,
  CheckCircle,
} from "lucide-react"

interface DetectionResult {
  success: boolean
  type: string
  description: string
  location: {
    latitude: number
    longitude: number
  }
  confidence: number
  publicInfo: {
    openingHours?: string[]
    contactInfo?: {
      phone?: string
      website?: string
    }
    ratings?: {
      average: number
      total: number
      source: string
    }[]
    accessibility?: {
      features: string[]
    }
    publicTransport?: string[]
  }
  features?: {
    architecture?: string[]
    materials?: string[]
    style?: string[]
  }
  imageProperties: {
    dominantColors: string[]
    brightness: number
    contrast: number
    primaryStyle?: string
    aestheticScore?: number
  }
  safetyScore: number
  similarBuildings: string[]
  lastUpdated: string
  sourceReliability: number
}

interface DetectionResultDialogProps {
  showResult: boolean
  setShowResult: (show: boolean) => void
  detectionResult: DetectionResult | null
}

const DetectionResultDialog: React.FC<DetectionResultDialogProps> = ({
  showResult,
  setShowResult,
  detectionResult,
}) => {
  if (!detectionResult) return null

  const handleNavigate = () => {
    if (detectionResult?.location) {
      const destination = encodeURIComponent(
        `${detectionResult.location.latitude},${detectionResult.location.longitude}`,
      )
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${destination}`
      window.open(mapsUrl, "_blank")
    }
  }

  return (
    <Dialog open={showResult} onOpenChange={setShowResult}>
      <DialogContent className="max-w-4xl bg-white rounded-lg p-0 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-2xl font-semibold">{detectionResult.description || "Building Details"}</h2>
          <Button variant="ghost" size="icon" onClick={() => setShowResult(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start border-b px-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="amenities">Amenities</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
            <TabsTrigger value="imageProperties">Image Properties</TabsTrigger>
            <TabsTrigger value="nearby">Nearby</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="p-4 space-y-6">
            <div className="flex items-center gap-2 text-green-600">
              <Info className="w-5 h-5" />
              <span>Building detected ({(detectionResult.confidence * 100).toFixed(1)}% confidence)</span>
            </div>

            {detectionResult.type && (
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                <span>Detection Type: {detectionResult.type}</span>
              </div>
            )}

            {detectionResult.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>
                  Location: {detectionResult.location.latitude}, {detectionResult.location.longitude}
                </span>
              </div>
            )}

            {detectionResult.safetyScore !== undefined && (
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span>Safety Score: {detectionResult.safetyScore}</span>
              </div>
            )}

            {detectionResult.lastUpdated && (
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>Last Updated: {new Date(detectionResult.lastUpdated).toLocaleString()}</span>
              </div>
            )}

            {detectionResult.sourceReliability !== undefined && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Source Reliability: {(detectionResult.sourceReliability * 100).toFixed(2)}%</span>
              </div>
            )}

            {detectionResult.features && (
              <div className="grid grid-cols-2 gap-4">
                {detectionResult.features.style && (
                  <div>
                    <h3 className="font-semibold">Architectural Style</h3>
                    <p>{detectionResult.features.style.join(", ")}</p>
                  </div>
                )}
              </div>
            )}

            {detectionResult.address && (
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                  <span>{detectionResult.address}</span>
                </div>

                <Button onClick={handleNavigate} className="w-full">
                  <Navigation className="w-5 h-5 mr-2" />
                  Open in Maps
                </Button>
              </div>
            )}

            {detectionResult.publicInfo?.ratings && detectionResult.publicInfo.ratings.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span>
                    {detectionResult.publicInfo.ratings[0].average.toFixed(1)} (
                    {detectionResult.publicInfo.ratings[0].total} reviews)
                  </span>
                </div>
              </div>
            )}

            {detectionResult.publicInfo?.openingHours && (
              <div className="flex items-start gap-2">
                <Clock className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Opening Hours</h3>
                  <ul className="list-disc list-inside">
                    {detectionResult.publicInfo.openingHours.map((hours, index) => (
                      <li key={index}>{hours}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {detectionResult.publicInfo?.contactInfo && (
              <div className="space-y-2">
                {detectionResult.publicInfo.contactInfo.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    <a
                      href={`tel:${detectionResult.publicInfo.contactInfo.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {detectionResult.publicInfo.contactInfo.phone}
                    </a>
                  </div>
                )}
                {detectionResult.publicInfo.contactInfo.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    <a
                      href={detectionResult.publicInfo.contactInfo.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            )}

            {detectionResult.publicInfo?.priceRange && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                <span>Price Range: {detectionResult.publicInfo.priceRange}</span>
              </div>
            )}

            {detectionResult.publicInfo?.paymentMethods && (
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <span>Payment Methods: {detectionResult.publicInfo.paymentMethods.join(", ")}</span>
              </div>
            )}

            {detectionResult.publicInfo?.languages && (
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                <span>Languages: {detectionResult.publicInfo.languages.join(", ")}</span>
              </div>
            )}

            {detectionResult.publicInfo?.checkInOut && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>Check-in: {detectionResult.publicInfo.checkInOut.checkIn}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>Check-out: {detectionResult.publicInfo.checkInOut.checkOut}</span>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="amenities" className="p-4 space-y-6">
            {detectionResult.publicInfo?.amenities && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Amenities</h3>
                <ul className="grid grid-cols-2 gap-2">
                  {detectionResult.publicInfo.amenities.map((amenity, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Wifi className="w-4 h-4" />
                      {amenity}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {detectionResult.similarBuildings && detectionResult.similarBuildings.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Similar Buildings</h3>
                <ul className="list-disc list-inside">
                  {detectionResult.similarBuildings.map((building, index) => (
                    <li key={index}>{building}</li>
                  ))}
                </ul>
              </div>
            )}

            {detectionResult.publicInfo?.publicTransport && detectionResult.publicInfo.publicTransport.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Public Transport</h3>
                <ul className="list-disc list-inside">
                  {detectionResult.publicInfo.publicTransport.map((transport, index) => (
                    <li key={index}>{transport}</li>
                  ))}
                </ul>
              </div>
            )}

            {detectionResult.publicInfo?.services && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Services</h3>
                <ul className="space-y-2">
                  {detectionResult.publicInfo.services.map((service, index) => (
                    <li key={index}>
                      <h4 className="font-semibold">{service.name}</h4>
                      <p>{service.description}</p>
                      <p>Availability: {service.availability}</p>
                      {service.pricing && <p>Pricing: {service.pricing}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {detectionResult.publicInfo?.parking && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Parking</h3>
                <p>Available: {detectionResult.publicInfo.parking.available ? "Yes" : "No"}</p>
                {detectionResult.publicInfo.parking.type && (
                  <p>Type: {detectionResult.publicInfo.parking.type.join(", ")}</p>
                )}
                {detectionResult.publicInfo.parking.pricing && (
                  <p>Pricing: {detectionResult.publicInfo.parking.pricing}</p>
                )}
                {detectionResult.publicInfo.parking.capacity && (
                  <p>Capacity: {detectionResult.publicInfo.parking.capacity} spaces</p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="p-4 space-y-4">
            {detectionResult.publicInfo?.historicalInfo ? (
              <div className="space-y-4">
                <p>{detectionResult.publicInfo.historicalInfo.description}</p>
                {detectionResult.publicInfo.historicalInfo.yearBuilt && (
                  <p>
                    <strong>Year Built:</strong> {detectionResult.publicInfo.historicalInfo.yearBuilt}
                  </p>
                )}
                {detectionResult.publicInfo.historicalInfo.architect && (
                  <p>
                    <strong>Architect:</strong> {detectionResult.publicInfo.historicalInfo.architect}
                  </p>
                )}
                {detectionResult.publicInfo.historicalInfo.significance && (
                  <p>
                    <strong>Significance:</strong> {detectionResult.publicInfo.historicalInfo.significance}
                  </p>
                )}
                {detectionResult.publicInfo.historicalInfo.events &&
                  detectionResult.publicInfo.historicalInfo.events.length > 0 && (
                    <div>
                      <h4 className="font-semibold">Historical Events</h4>
                      <ul className="list-disc list-inside">
                        {detectionResult.publicInfo.historicalInfo.events.map((event, index) => (
                          <li key={index}>
                            <strong>{event.date}:</strong> {event.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            ) : (
              <p>No historical information available.</p>
            )}
          </TabsContent>

          <TabsContent value="accessibility" className="p-4 space-y-4">
            {detectionResult.publicInfo?.accessibility ? (
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <AccessibilityIcon className="w-5 h-5" />
                  Accessibility Features
                </h3>
                <ul className="list-disc list-inside space-y-2">
                  {detectionResult.publicInfo.accessibility.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>No accessibility information available.</p>
            )}

            {detectionResult.publicInfo?.sustainabilityInfo && (
              <div className="mt-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Leaf className="w-5 h-5" />
                  Sustainability Information
                </h3>
                {detectionResult.publicInfo.sustainabilityInfo.rating && (
                  <p>
                    <strong>Rating:</strong> {detectionResult.publicInfo.sustainabilityInfo.rating}
                  </p>
                )}
                {detectionResult.publicInfo.sustainabilityInfo.certifications.length > 0 && (
                  <div>
                    <strong>Certifications:</strong>
                    <ul className="list-disc list-inside">
                      {detectionResult.publicInfo.sustainabilityInfo.certifications.map((cert, index) => (
                        <li key={index}>{cert}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {detectionResult.publicInfo.sustainabilityInfo.features.length > 0 && (
                  <div>
                    <strong>Sustainability Features:</strong>
                    <ul className="list-disc list-inside">
                      {detectionResult.publicInfo.sustainabilityInfo.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="imageProperties" className="p-4 space-y-4">
            <h3 className="font-semibold text-lg">Image Properties</h3>
            {detectionResult.imageProperties && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Dominant Colors</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {detectionResult.imageProperties.dominantColors.map((color, index) => (
                      <div
                        key={index}
                        className="w-8 h-8 rounded-full border"
                        style={{ backgroundColor: color }}
                        title={color}
                      ></div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold">Brightness</h4>
                  <p>{(detectionResult.imageProperties.brightness * 100).toFixed(2)}%</p>
                </div>
                <div>
                  <h4 className="font-semibold">Contrast</h4>
                  <p>{(detectionResult.imageProperties.contrast * 100).toFixed(2)}%</p>
                </div>
                {detectionResult.imageProperties.primaryStyle && (
                  <div>
                    <h4 className="font-semibold">Primary Style</h4>
                    <p>{detectionResult.imageProperties.primaryStyle}</p>
                  </div>
                )}
                {detectionResult.imageProperties.aestheticScore !== undefined && (
                  <div>
                    <h4 className="font-semibold">Aesthetic Score</h4>
                    <p>{detectionResult.imageProperties.aestheticScore.toFixed(2)}</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="nearby" className="p-4 space-y-4">
            {detectionResult.publicInfo?.nearbyAttractions &&
            detectionResult.publicInfo.nearbyAttractions.length > 0 ? (
              <div>
                <h3 className="font-semibold text-lg mb-2">Nearby Attractions</h3>
                <ul className="space-y-2">
                  {detectionResult.publicInfo.nearbyAttractions.map((attraction, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 mt-1" />
                      <div>
                        <h4 className="font-semibold">{attraction.name}</h4>
                        <p>Distance: {attraction.distance}</p>
                        <p>Type: {attraction.type}</p>
                        {attraction.rating && <p>Rating: {attraction.rating}/5</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>No information about nearby attractions available.</p>
            )}

            {detectionResult.publicInfo?.events && detectionResult.publicInfo.events.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-lg mb-2">Upcoming Events</h3>
                <ul className="space-y-4">
                  {detectionResult.publicInfo.events.map((event, index) => (
                    <li key={index} className="border-b pb-2">
                      <h4 className="font-semibold">{event.name}</h4>
                      <p>Date: {event.date}</p>
                      <p>{event.description}</p>
                      {event.ticketInfo && <p>Ticket Info: {event.ticketInfo}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default DetectionResultDialog

