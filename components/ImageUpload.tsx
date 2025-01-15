'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { MapPin, Loader2 } from 'lucide-react'

interface BuildingInfo {
  description?: string
  confidence?: number
  address?: string
  location?: {
    lat: number
    lng: number
  }
}

interface ProcessingResult {
  success: boolean
  type: 'landmark' | 'image-metadata' | 'building' | 'unknown'
  description?: string
  confidence?: number
  address?: string
  location?: {
    lat: number
    lng: number
  }
  buildings?: BuildingInfo[]
  directions?: {
    distance: string
    duration: string
    steps: Array<{
      instruction: string
      distance: string
      duration: string
    }>
  }
  error?: string
}

interface Location {
  lat: number
  lng: number
}

export default function ImageUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ProcessingResult | null>(null)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  useEffect(() => {
    // Get current location when component mounts
    getCurrentLocation()
  }, [])

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true)
    setLocationError(null)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
      })

      setCurrentLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to get current location'
      setLocationError(errorMessage)
      console.error('Location error:', err)
    } finally {
      setIsLoadingLocation(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please select a valid image file.')
        setFile(null)
      } else {
        setError(null)
        setFile(selectedFile)
      }
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an image first.')
      return
    }

    if (!currentLocation) {
      setError('Current location is required. Please enable location access.')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('image', file)
    formData.append('currentLat', currentLocation.lat.toString())
    formData.append('currentLng', currentLocation.lng.toString())

    try {
      const response = await fetch('/api/process-image', {
        method: 'POST',
        body: formData,
      })

      const responseText = await response.text()

      // Safely parse response
      const data: ProcessingResult = JSON.parse(responseText)

      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      setResult(data)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred.'
      setError(errorMessage)
      console.error('Upload error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={getCurrentLocation}
            disabled={isLoadingLocation}
            className="w-full sm:w-auto"
          >
            {isLoadingLocation ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="mr-2 h-4 w-4" />
            )}
            {currentLocation ? 'Update Location' : 'Get Current Location'}
          </Button>
          {currentLocation && (
            <span className="text-sm text-gray-500">
              Location: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
            </span>
          )}
        </div>

        {locationError && (
          <Alert variant="destructive">
            <AlertDescription>{locationError}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isLoading}
          />
          <Button 
            onClick={handleUpload} 
            disabled={!file || isLoading || !currentLocation}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Upload Image'
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <div className="bg-gray-50 p-4 rounded-md space-y-4">
          {result.success ? (
            <>
              <div>
                <h3 className="font-semibold mb-2">
                  {result.type === 'landmark'
                    ? 'Landmark Detected:'
                    : result.type === 'image-metadata'
                    ? 'Location Found via Metadata:'
                    : result.type === 'building'
                    ? 'Building Information:'
                    : 'Results'}
                </h3>
                <p className="mb-1">Description: {result.description || 'N/A'}</p>
                <p className="mb-1">Address: {result.address || 'Not available'}</p>
                {result.location && (
                  <p>
                    Coordinates: {result.location.lat.toFixed(6)}, 
                    {result.location.lng.toFixed(6)}
                  </p>
                )}
              </div>

              {result.directions && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Directions</h3>
                  <p className="mb-2">
                    Distance: {result.directions.distance} • Duration: {result.directions.duration}
                  </p>
                  <ol className="list-decimal ml-6 space-y-2">
                    {result.directions.steps.map((step, index) => (
                      <li key={index} className="text-sm">
                        <p className="font-medium">{step.instruction}</p>
                        <p className="text-gray-500">
                          {step.distance} • {step.duration}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {result.type === 'building' && result.buildings && result.buildings.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold">Detected Buildings:</h4>
                  <ul className="list-disc ml-6 space-y-2">
                    {result.buildings.map((building, index) => (
                      <li key={index}>
                        <p>{building.description} (Confidence: {building.confidence?.toFixed(2) || 'N/A'})</p>
                        {building.address && <p>Address: {building.address}</p>}
                        {building.location && (
                          <p>
                            Coordinates: {building.location.lat.toFixed(6)}, {building.location.lng.toFixed(6)}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="bg-red-50 p-4 rounded-md">
              <h3 className="font-semibold text-red-600 mb-2">No Data Found</h3>
              <p>{result.error || 'Unable to process the image.'}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}