"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, MapPin, Camera, FileText, Search, AlertCircle } from "lucide-react"

export default function LocationTestPage() {
  const [activeTab, setActiveTab] = useState("image")
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [text, setText] = useState("")
  const [address, setAddress] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    setImagePreview(URL.createObjectURL(file))

    await processImage(file)
  }

  const processImage = async (file: File) => {
    try {
      setIsProcessing(true)
      setError(null)

      const formData = new FormData()
      formData.append("image", file)

      // Add current location if available
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0,
            })
          })

          formData.append("lat", position.coords.latitude.toString())
          formData.append("lng", position.coords.longitude.toString())
        } catch (err) {
          console.log("Geolocation error:", err)
        }
      }

      const response = await fetch("/api/location-recognizer", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      console.error("Processing failed:", err)
      setError(err instanceof Error ? err.message : "Processing failed")
    } finally {
      setIsProcessing(false)
    }
  }

  const processText = async () => {
    if (!text.trim()) {
      setError("Please enter some text")
      return
    }

    try {
      setIsProcessing(true)
      setError(null)

      const formData = new FormData()
      formData.append("text", text)

      // Add current location if available
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0,
            })
          })

          formData.append("lat", position.coords.latitude.toString())
          formData.append("lng", position.coords.longitude.toString())
        } catch (err) {
          console.log("Geolocation error:", err)
        }
      }

      const response = await fetch("/api/location-recognizer", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      console.error("Processing failed:", err)
      setError(err instanceof Error ? err.message : "Processing failed")
    } finally {
      setIsProcessing(false)
    }
  }

  const processAddress = async () => {
    if (!address.trim()) {
      setError("Please enter an address")
      return
    }

    try {
      setIsProcessing(true)
      setError(null)

      const formData = new FormData()
      formData.append("address", address)

      // Add current location if available
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0,
            })
          })

          formData.append("lat", position.coords.latitude.toString())
          formData.append("lng", position.coords.longitude.toString())
        } catch (err) {
          console.log("Geolocation error:", err)
        }
      }

      const response = await fetch("/api/location-recognizer", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      console.error("Processing failed:", err)
      setError(err instanceof Error ? err.message : "Processing failed")
    } finally {
      setIsProcessing(false)
    }
  }

  const reset = () => {
    setResult(null)
    setError(null)
    setImagePreview(null)
    setText("")
    setAddress("")
  }

  return (
    <div className="container py-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Location Recognition Test</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="image">
            <Camera className="h-4 w-4 mr-2" />
            Image Recognition
          </TabsTrigger>
          <TabsTrigger value="text">
            <FileText className="h-4 w-4 mr-2" />
            Text Recognition
          </TabsTrigger>
          <TabsTrigger value="address">
            <MapPin className="h-4 w-4 mr-2" />
            Address Lookup
          </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <TabsContent value="image" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Image Recognition</CardTitle>
                  <CardDescription>Upload an image to identify the location</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />

                    <div
                      className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {imagePreview ? (
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Preview"
                          className="max-h-[200px] mx-auto rounded-lg"
                        />
                      ) : (
                        <div className="py-8">
                          <Camera className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                          <p>Click to upload an image</p>
                          <p className="text-sm text-muted-foreground">Supports JPG, PNG, GIF</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={reset}>
                    Reset
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="text" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Text Recognition</CardTitle>
                  <CardDescription>Enter text containing location information</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Enter text with location information, e.g., 'I'm visiting the Eiffel Tower in Paris next week.'"
                    className="min-h-[200px]"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={reset}>
                    Reset
                  </Button>
                  <Button onClick={processText} disabled={isProcessing}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Analyze Text
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="address" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Address Lookup</CardTitle>
                  <CardDescription>Enter an address to get location details</CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Enter an address, e.g., '1600 Pennsylvania Avenue, Washington DC'"
                    className="mb-4"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={reset}>
                    Reset
                  </Button>
                  <Button onClick={processAddress} disabled={isProcessing}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing
                      </>
                    ) : (
                      <>
                        <MapPin className="mr-2 h-4 w-4" />
                        Lookup Address
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>Location recognition results will appear here</CardDescription>
              </CardHeader>
              <CardContent>
                {isProcessing ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p>Processing your request...</p>
                  </div>
                ) : error ? (
                  <div className="bg-destructive/10 p-4 rounded-lg flex items-start">
                    <AlertCircle className="h-5 w-5 text-destructive mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">Error</p>
                      <p className="text-sm">{error}</p>
                    </div>
                  </div>
                ) : result ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">{result.name || "Unknown Location"}</h3>
                      {result.confidence && (
                        <Badge variant={result.confidence > 0.8 ? "default" : "outline"}>
                          {Math.round(result.confidence * 100)}% confidence
                        </Badge>
                      )}
                    </div>

                    {result.type && (
                      <div className="flex items-center text-sm">
                        <span className="text-muted-foreground mr-2">Recognition Type:</span>
                        <Badge variant="secondary">{result.type}</Badge>
                      </div>
                    )}

                    {result.address && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Address:</span>
                        <p>{result.address}</p>
                      </div>
                    )}

                    {result.description && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Description:</span>
                        <p>{result.description}</p>
                      </div>
                    )}

                    {result.location && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Coordinates:</span>
                        <p>
                          {result.location.latitude.toFixed(6)}, {result.location.longitude.toFixed(6)}
                        </p>
                      </div>
                    )}

                    {result.pointsOfInterest && result.pointsOfInterest.length > 0 && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Nearby Points of Interest:</span>
                        <ul className="list-disc pl-5 mt-1">
                          {result.pointsOfInterest.map((poi: string, index: number) => (
                            <li key={index}>{poi}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.mapUrl && (
                      <div className="mt-4">
                        <Button asChild className="w-full">
                          <a href={result.mapUrl} target="_blank" rel="noopener noreferrer">
                            <MapPin className="mr-2 h-4 w-4" />
                            View on Map
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No results yet. Upload an image, enter text, or lookup an address to get started.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  )
}

