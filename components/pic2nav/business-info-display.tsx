"use client"

import { useState, useEffect } from "react"
import { Loader2, MapPin, Star, Clock, Phone, Globe, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface Location {
  latitude: number
  longitude: number
}

interface LocationRecognitionResponse {
  success: boolean
  type: string
  name?: string
  address?: string
  location?: Location
  description?: string
  confidence?: number
  category?: string
  error?: string
  mapUrl?: string
  id?: string
  formattedAddress?: string
  placeId?: string
  addressComponents?: any[]
  photos?: string[]
  rating?: number
  openingHours?: {
    weekday_text?: string[]
    open_now?: boolean
  }
  website?: string
  phoneNumber?: string
  priceLevel?: number
  buildingType?: string
  materialType?: string
  weatherConditions?: string
  airQuality?: string
  urbanDensity?: string
  vegetationDensity?: string
  crowdDensity?: string
  timeOfDay?: string
  significantColors?: string[]
  waterProximity?: string
  isBusinessLocation?: boolean
  businessName?: string
  businessAddress?: string
  businessCategory?: string
  businessConfidence?: number
}

interface JobStatus {
  id: string
  status: "pending" | "processing" | "completed" | "failed"
  progress: number
  result?: LocationRecognitionResponse
  error?: string
}

export function BusinessInfoDisplay({
  recognitionResult,
  jobId,
}: {
  recognitionResult?: LocationRecognitionResponse
  jobId?: string
}) {
  const [enhancedData, setEnhancedData] = useState<LocationRecognitionResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)

  // Debug log the incoming props
  useEffect(() => {
    console.log("BusinessInfoDisplay received props:", {
      recognitionResult: recognitionResult
        ? {
            name: recognitionResult.name,
            type: recognitionResult.type,
            success: recognitionResult.success,
          }
        : null,
      jobId,
    })
  }, [recognitionResult, jobId])

  // Function to poll job status
  useEffect(() => {
    if (!jobId) return

    let retryCount = 0
    let pollInterval: NodeJS.Timeout | null = null

    const checkJobStatus = async () => {
      try {
        const response = await fetch(`/api/location-recognition/${jobId}`)

        if (!response.ok) {
          // Improved error handling with status code
          const errorMessage = `API error: ${response.status}${response.statusText ? ` - ${response.statusText}` : ""}`
          console.error(errorMessage)

          // Only set error after multiple failed attempts
          if (retryCount > 3) {
            setError(errorMessage)
            setLoading(false)
          } else {
            retryCount++
            pollInterval = setTimeout(checkJobStatus, 2000)
          }
          return
        }

        const data = await response.json()

        if (data.success && data.job) {
          setJobStatus(data.job)

          // If job is completed, set the enhanced data
          if (data.job.status === "completed" && data.job.result) {
            console.log("Job completed, setting enhanced data:", data.job.result)
            setEnhancedData(data.job.result)
            setLoading(false)
          } else if (data.job.status === "failed") {
            setError(data.job.error || "Job processing failed")
            setLoading(false)
          } else {
            // Job still in progress, continue polling
            pollInterval = setTimeout(checkJobStatus, 2000)
          }
        }
      } catch (err) {
        console.error("Error checking job status:", err)

        // Only set error after multiple failed attempts
        if (retryCount > 3) {
          setError(err instanceof Error ? err.message : "Failed to check job status")
          setLoading(false)
        } else {
          retryCount++
          pollInterval = setTimeout(checkJobStatus, 2000)
        }
      }
    }

    setLoading(true)
    checkJobStatus()

    // Clean up timer on unmount
    return () => {
      if (pollInterval) {
        clearTimeout(pollInterval)
      }
    }
  }, [jobId])

  // If we have a direct recognition result but no enhanced data yet, fetch enhanced data
  useEffect(() => {
    if (recognitionResult && !enhancedData && !jobId && !loading) {
      const fetchEnhancedData = async () => {
        try {
          // Check if we have required location data before making the API call
          if (!recognitionResult.location || (!recognitionResult.placeId && !recognitionResult.name)) {
            console.log("Insufficient data available for enhancement, using original data")
            setEnhancedData(recognitionResult)
            return
          }

          setLoading(true)
          setError(null)

          // Create a form data object to send to the API
          const formData = new FormData()
          formData.append("operation", "enhanceData")
          
          if (recognitionResult.placeId) {
            formData.append("placeId", recognitionResult.placeId)
          }
          
          if (recognitionResult.name) {
            formData.append("name", recognitionResult.name)
          }
          
          if (recognitionResult.address) {
            formData.append("address", recognitionResult.address)
          }
          
          if (recognitionResult.category) {
            formData.append("category", recognitionResult.category)
          }
          
          if (recognitionResult.type) {
            formData.append("recognitionType", recognitionResult.type)
          }
          
          if (recognitionResult.id) {
            formData.append("locationId", recognitionResult.id)
          }

          if (recognitionResult.location) {
            formData.append("latitude", recognitionResult.location.latitude.toString())
            formData.append("longitude", recognitionResult.location.longitude.toString())
          }

          const response = await fetch("/api/location-enhancement", {
            method: "POST",
            body: formData,
          })

          if (!response.ok) {
            console.error(`API error: ${response.status}`)
            // Fall back to original data if enhancement fails
            setEnhancedData(recognitionResult)
            return
          }

          const data = await response.json()

          if (data.success) {
            setEnhancedData(data)
          } else {
            // If enhancement fails, just use the original data
            console.warn("Enhancement API returned failure status, using original data")
            setEnhancedData(recognitionResult)
          }
        } catch (err) {
          console.error("Error fetching enhanced data:", err)
          // If enhancement fails, just use the original data
          setEnhancedData(recognitionResult)
        } finally {
          setLoading(false)
        }
      }

      fetchEnhancedData()
    }
  }, [recognitionResult, enhancedData, jobId, loading])

  // If we have a direct recognition result and no job ID, use it
  const displayData = enhancedData || recognitionResult

  // Debug log the display data
  useEffect(() => {
    if (displayData) {
      console.log("BusinessInfoDisplay using data:", {
        name: displayData.name,
        type: displayData.type,
        isBusinessLocation: displayData.isBusinessLocation,
        businessName: displayData.businessName,
      })
    }
  }, [displayData])

  // If no data to display yet, show loading or nothing
  if (!displayData && !jobStatus) {
    if (loading) {
      return (
        <div className="mt-4 p-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-md">
          <div className="flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin mr-2 text-teal-500" />
            <span>Loading enhanced information...</span>
          </div>
        </div>
      )
    }
    return null
  }

  // If we have job status but it's still processing
  if (jobStatus && (jobStatus.status === "pending" || jobStatus.status === "processing")) {
    return (
      <div className="mt-4 p-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-md">
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center mb-2">
            <Loader2 className="h-5 w-5 animate-spin mr-2 text-teal-500" />
            <span>Analyzing additional information...</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-300"
              style={{ width: `${jobStatus.progress}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  // If we have an error
  if (error) {
    return (
      <div className="mt-4 p-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-md">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 text-amber-500" />
          <span>Could not load enhanced information: {error}</span>
        </div>
      </div>
    )
  }

  // If we have data to display
  if (displayData) {
    // For buildings or locations that aren't explicitly marked as businesses,
    // we'll still show some basic info if available
    const isBusinessOrBuilding =
      displayData.isBusinessLocation ||
      displayData.businessName ||
      displayData.category === "Building" ||
      displayData.buildingType

    if (!isBusinessOrBuilding) {
      return null
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl"
      >
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-teal-500" />
          {displayData.isBusinessLocation ? "Business Information" : "Location Details"}
        </h3>

        {(displayData.businessName || displayData.name) && (
          <div className="mb-3">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Name</div>
            <div className="font-medium">{displayData.businessName || displayData.name}</div>
          </div>
        )}

        {(displayData.businessCategory || displayData.category) && (
          <div className="mb-3">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Category</div>
            <Badge variant="secondary">{displayData.businessCategory || displayData.category}</Badge>
          </div>
        )}

        {displayData.buildingType && (
          <div className="mb-3">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Building Type</div>
            <Badge variant="outline">{displayData.buildingType}</Badge>
          </div>
        )}

        {displayData.rating && (
          <div className="mb-3">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Rating</div>
            <div className="flex items-center">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400 mr-1" />
              <span className="font-medium">{displayData.rating}</span>
            </div>
          </div>
        )}

        {displayData.openingHours && (
          <div className="mb-3">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Opening Hours</div>
            <div className="flex items-start">
              <Clock className="h-4 w-4 mr-1 mt-0.5 text-slate-400" />
              <div className="text-sm">
                {displayData.openingHours.weekday_text && Array.isArray(displayData.openingHours.weekday_text) ? (
                  <div className="grid gap-1">
                    {displayData.openingHours.weekday_text.map((day: string, index: number) => (
                      <div key={index}>{day}</div>
                    ))}
                  </div>
                ) : (
                  <div>{displayData.openingHours.open_now ? "Open now" : "Closed now"}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {displayData.phoneNumber && (
          <div className="mb-3">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Phone</div>
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-1 text-slate-400" />
              <a href={`tel:${displayData.phoneNumber}`} className="text-teal-500 hover:underline">
                {displayData.phoneNumber}
              </a>
            </div>
          </div>
        )}

        {displayData.website && (
          <div className="mb-3">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Website</div>
            <div className="flex items-center">
              <Globe className="h-4 w-4 mr-1 text-slate-400" />
              <a
                href={displayData.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-500 hover:underline truncate max-w-[200px]"
              >
                {displayData.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          </div>
        )}

        {(displayData.businessAddress || displayData.address || displayData.formattedAddress) && (
          <div className="mb-4">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Address</div>
            <div className="flex items-start">
              <MapPin className="h-4 w-4 mr-1 mt-0.5 text-slate-400" />
              <span>{displayData.businessAddress || displayData.formattedAddress || displayData.address}</span>
            </div>
          </div>
        )}

        {displayData.placeId ? (
          <Button variant="outline" size="sm" className="w-full rounded-xl" asChild>
            <a
              href={`https://www.google.com/maps/place/?q=place_id:${displayData.placeId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Google Maps
            </a>
          </Button>
        ) : displayData.mapUrl ? (
          <Button variant="outline" size="sm" className="w-full rounded-xl" asChild>
            <a
              href={displayData.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Map
            </a>
          </Button>
        ) : null}
      </motion.div>
    )
  }

  return null
}