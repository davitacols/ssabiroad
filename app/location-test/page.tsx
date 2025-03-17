"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  MapPin,
  Camera,
  FileText,
  Search,
  AlertCircle,
  Cloud,
  Building,
  Trees,
  Wind,
  Droplets,
  Globe,
  Phone,
  Clock,
  Star,
  Info,
  X,
  Upload,
  Sparkles,
  Navigation,
  Layers,
  Compass,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"

export default function LocationTestPage() {
  const [activeTab, setActiveTab] = useState("image")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [text, setText] = useState("")
  const [address, setAddress] = useState("")
  const [cameraActive, setCameraActive] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()
  const isMobile = useIsMobile()

  // Reset progress when not processing
  useEffect(() => {
    if (!isProcessing) {
      setProgress(0)
    }
  }, [isProcessing])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    setImagePreview(URL.createObjectURL(file))

    await processImage(file)
  }

  const handleCameraCapture = async () => {
    try {
      if (!cameraActive) {
        // Start the camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment", // Use back camera if available
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        })

        // Set the stream to the video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
          setCameraActive(true)
        }
      } else {
        // Capture the current frame
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current
          const canvas = canvasRef.current

          // Set canvas dimensions to match video
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          // Draw the current video frame to the canvas
          const context = canvas.getContext("2d")
          if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height)

            // Convert the canvas to a Blob
            canvas.toBlob(
              async (blob) => {
                if (blob) {
                  // Create a File object from the Blob
                  const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  })

                  // Set preview and process the image
                  setImagePreview(URL.createObjectURL(file))
                  await processImage(file)

                  // Stop the camera
                  stopCamera()
                }
              },
              "image/jpeg",
              0.8,
            ) // JPEG at 80% quality
          }
        }
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      toast({
        title: "Camera Error",
        description: "Could not access the camera. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  // Helper function to stop the camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      const tracks = stream.getTracks()

      tracks.forEach((track) => {
        track.stop()
      })

      videoRef.current.srcObject = null
      setCameraActive(false)
    }
  }

  const processImage = async (file: File) => {
    try {
      setIsProcessing(true)
      setError(null)
      setProgress(10)

      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 5
        })
      }, 150)

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

      const response = await fetch("/api/location-recognition", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      setResult(data)

      if (data.success) {
        toast({
          title: "Location Identified",
          description: `Found: ${data.name || "Unknown location"}`,
        })
      }
    } catch (err) {
      console.error("Processing failed:", err)
      setError(err instanceof Error ? err.message : "Processing failed")
      toast({
        title: "Processing Failed",
        description: err instanceof Error ? err.message : "Processing failed",
        variant: "destructive",
      })
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
      setProgress(10)

      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 8
        })
      }, 200)

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

      const response = await fetch("/api/location-recognition", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      setResult(data)

      if (data.success) {
        toast({
          title: "Location Identified",
          description: `Found: ${data.name || "Unknown location"}`,
        })
      }
    } catch (err) {
      console.error("Processing failed:", err)
      setError(err instanceof Error ? err.message : "Processing failed")
      toast({
        title: "Processing Failed",
        description: err instanceof Error ? err.message : "Processing failed",
        variant: "destructive",
      })
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
      setProgress(10)

      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

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

      const response = await fetch("/api/location-recognition", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      setResult(data)

      if (data.success) {
        toast({
          title: "Location Identified",
          description: `Found: ${data.name || "Unknown location"}`,
        })
      }
    } catch (err) {
      console.error("Processing failed:", err)
      setError(err instanceof Error ? err.message : "Processing failed")
      toast({
        title: "Processing Failed",
        description: err instanceof Error ? err.message : "Processing failed",
        variant: "destructive",
      })
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
    stopCamera()
  }

  // Render environmental data badges
  const renderEnvironmentalData = (data: any) => {
    if (!data) return null

    const items = []

    if (data.weatherConditions) {
      items.push({
        icon: <Cloud className="h-3 w-3" />,
        label: data.weatherConditions.split(",")[0],
      })
    }

    if (data.airQuality) {
      items.push({
        icon: <Wind className="h-3 w-3" />,
        label: `Air: ${data.airQuality}`,
      })
    }

    if (data.urbanDensity) {
      items.push({
        icon: <Building className="h-3 w-3" />,
        label: data.urbanDensity,
      })
    }

    if (data.vegetationDensity) {
      items.push({
        icon: <Trees className="h-3 w-3" />,
        label: data.vegetationDensity,
      })
    }

    if (data.waterProximity) {
      items.push({
        icon: <Droplets className="h-3 w-3" />,
        label: data.waterProximity,
      })
    }

    if (data.materialType) {
      items.push({
        icon: <Layers className="h-3 w-3" />,
        label: `Material: ${data.materialType}`,
      })
    }

    if (items.length === 0) return null

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {items.map((item, index) => (
          <Badge key={index} variant="outline" className="text-xs flex items-center gap-1">
            {item.icon}
            <span>{item.label}</span>
          </Badge>
        ))}
      </div>
    )
  }

  return (
    <div className="container py-10 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold mb-2">Location Recognition Test</h1>
        <p className="text-muted-foreground mb-6">Test our location recognition API with images, text, or addresses</p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 grid grid-cols-3 md:w-auto">
          <TabsTrigger value="image" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            <span className={isMobile ? "hidden" : "inline"}>Image</span>
          </TabsTrigger>
          <TabsTrigger value="text" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className={isMobile ? "hidden" : "inline"}>Text</span>
          </TabsTrigger>
          <TabsTrigger value="address" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className={isMobile ? "hidden" : "inline"}>Address</span>
          </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <TabsContent value="image" className="mt-0">
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-primary" />
                    Image Recognition
                  </CardTitle>
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

                    {cameraActive ? (
                      <div className="relative">
                        <video
                          ref={videoRef}
                          className="w-full h-[300px] object-cover rounded-lg"
                          autoPlay
                          playsInline
                          muted
                        />
                        <canvas ref={canvasRef} className="hidden" />
                        <Button
                          className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
                          size="lg"
                          onClick={handleCameraCapture}
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Capture
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
                          onClick={stopCamera}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : imagePreview ? (
                      <div className="relative">
                        <motion.img
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-[300px] object-cover rounded-lg"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
                          onClick={() => setImagePreview(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="py-8">
                            <Upload className="h-12 w-12 mx-auto mb-2 text-primary/70" />
                            <p className="font-medium">Upload Image</p>
                            <p className="text-sm text-muted-foreground">JPG, PNG, GIF</p>
                          </div>
                        </motion.div>

                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={handleCameraCapture}
                        >
                          <div className="py-8">
                            <Camera className="h-12 w-12 mx-auto mb-2 text-primary/70" />
                            <p className="font-medium">Use Camera</p>
                            <p className="text-sm text-muted-foreground">Take a photo now</p>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </div>

                  {isProcessing && activeTab === "image" && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Analyzing image...</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={reset}>
                    <X className="mr-2 h-4 w-4" />
                    Reset
                  </Button>

                  {imagePreview && !isProcessing && (
                    <Button
                      onClick={() => processImage(fileInputRef.current?.files?.[0] as File)}
                      disabled={isProcessing || !fileInputRef.current?.files?.[0]}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyze Again
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="text" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Text Recognition
                  </CardTitle>
                  <CardDescription>Enter text containing location information</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Enter text with location information, e.g., 'I'm visiting the Eiffel Tower in Paris next week.'"
                    className="min-h-[200px]"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />

                  {isProcessing && activeTab === "text" && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Analyzing text...</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={reset}>
                    <X className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  <Button onClick={processText} disabled={isProcessing || !text.trim()}>
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
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Address Lookup
                  </CardTitle>
                  <CardDescription>Enter an address to get location details</CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Enter an address, e.g., '1600 Pennsylvania Avenue, Washington DC'"
                    className="mb-4"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />

                  {isProcessing && activeTab === "address" && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Looking up address...</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={reset}>
                    <X className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  <Button onClick={processAddress} disabled={isProcessing || !address.trim()}>
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
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Compass className="h-5 w-5 text-primary" />
                    Results
                  </span>
                  {result && result.confidence && (
                    <Badge variant={result.confidence > 0.8 ? "default" : "outline"}>
                      {Math.round(result.confidence * 100)}% confidence
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Location recognition results will appear here</CardDescription>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-[500px] scrollbar-thin">
                {isProcessing ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-8"
                  >
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p>Processing your request...</p>
                  </motion.div>
                ) : error ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-destructive/10 p-4 rounded-lg flex items-start"
                  >
                    <AlertCircle className="h-5 w-5 text-destructive mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">Error</p>
                      <p className="text-sm">{error}</p>
                    </div>
                  </motion.div>
                ) : result ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">{result.name || "Unknown Location"}</h3>
                    </div>

                    {result.type && (
                      <div className="flex items-center text-sm">
                        <span className="text-muted-foreground mr-2">Recognition Type:</span>
                        <Badge variant="secondary">{result.type}</Badge>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {result.category && <Badge variant="outline">{result.category}</Badge>}
                      {result.buildingType && <Badge variant="outline">{result.buildingType}</Badge>}
                    </div>

                    {renderEnvironmentalData(result)}

                    {result.address && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Address:</span>
                        <p className="mt-1 p-2 bg-muted/30 rounded-md">{result.address}</p>
                      </div>
                    )}

                    {result.description && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Description:</span>
                        <p className="mt-1 p-2 bg-muted/30 rounded-md">
                          {showFullDescription || result.description.length <= 150
                            ? result.description
                            : `${result.description.substring(0, 150)}...`}
                          {result.description.length > 150 && (
                            <Button
                              variant="link"
                              className="p-0 h-auto text-xs"
                              onClick={() => setShowFullDescription(!showFullDescription)}
                            >
                              {showFullDescription ? "Show less" : "Show more"}
                            </Button>
                          )}
                        </p>
                      </div>
                    )}

                    {result.location && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Coordinates:</span>
                        <div className="flex items-center mt-1 p-2 bg-muted/30 rounded-md">
                          <span className="font-mono text-xs">
                            {result.location.latitude.toFixed(6)}, {result.location.longitude.toFixed(6)}
                          </span>
                          <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" asChild>
                            <a
                              href={`https://www.google.com/maps?q=${result.location.latitude},${result.location.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MapPin className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Display enhanced geotagging information */}
                    {result.geoData && Object.keys(result.geoData).some((key) => result.geoData[key]) && (
                      <div className="text-sm mt-4">
                        <span className="text-muted-foreground font-medium">Detailed Location Information:</span>
                        <div className="mt-2 grid grid-cols-2 gap-2 bg-muted/30 p-3 rounded-md">
                          {result.geoData.country && (
                            <div>
                              <span className="text-muted-foreground text-xs">Country:</span>
                              <p className="text-xs">
                                {result.geoData.country}{" "}
                                {result.geoData.countryCode && `(${result.geoData.countryCode})`}
                              </p>
                            </div>
                          )}
                          {result.geoData.administrativeArea && (
                            <div>
                              <span className="text-muted-foreground text-xs">State/Province:</span>
                              <p className="text-xs">{result.geoData.administrativeArea}</p>
                            </div>
                          )}
                          {result.geoData.locality && (
                            <div>
                              <span className="text-muted-foreground text-xs">City:</span>
                              <p className="text-xs">{result.geoData.locality}</p>
                            </div>
                          )}
                          {result.geoData.subLocality && (
                            <div>
                              <span className="text-muted-foreground text-xs">District:</span>
                              <p className="text-xs">{result.geoData.subLocality}</p>
                            </div>
                          )}
                          {result.geoData.postalCode && (
                            <div>
                              <span className="text-muted-foreground text-xs">Postal Code:</span>
                              <p className="text-xs">{result.geoData.postalCode}</p>
                            </div>
                          )}
                          {(result.geoData.streetName || result.geoData.streetNumber) && (
                            <div>
                              <span className="text-muted-foreground text-xs">Street:</span>
                              <p className="text-xs">
                                {result.geoData.streetNumber} {result.geoData.streetName}
                              </p>
                            </div>
                          )}
                          {result.geoData.elevation && (
                            <div>
                              <span className="text-muted-foreground text-xs">Elevation:</span>
                              <p className="text-xs">{result.geoData.elevation.toFixed(1)} meters</p>
                            </div>
                          )}
                          {result.geoData.timezone && (
                            <div>
                              <span className="text-muted-foreground text-xs">Timezone:</span>
                              <p className="text-xs">{result.geoData.timezone}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Display nearby places */}
                    {result.nearbyPlaces && result.nearbyPlaces.length > 0 && (
                      <div className="text-sm mt-4">
                        <span className="text-muted-foreground font-medium">Nearby Places:</span>
                        <div className="mt-2 space-y-2">
                          {result.nearbyPlaces.slice(0, 3).map((place, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="flex justify-between items-center bg-muted/30 p-2 rounded-md"
                            >
                              <div>
                                <p className="text-xs font-medium">{place.name}</p>
                                <p className="text-xs text-muted-foreground">{place.type}</p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {place.distance < 1000
                                  ? `${Math.round(place.distance)}m`
                                  : `${(place.distance / 1000).toFixed(1)}km`}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contact information */}
                    <div className="grid grid-cols-2 gap-2">
                      {result.phoneNumber && (
                        <div className="text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> Phone:
                          </span>
                          <p className="text-xs mt-1">{result.phoneNumber}</p>
                        </div>
                      )}

                      {result.website && (
                        <div className="text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Globe className="h-3 w-3" /> Website:
                          </span>
                          <p className="text-xs mt-1 truncate">
                            <a
                              href={result.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {result.website}
                            </a>
                          </p>
                        </div>
                      )}
                    </div>

                    {result.openingHours && result.openingHours.length > 0 && (
                      <div className="text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Opening Hours:
                        </span>
                        <ul className="list-none mt-1 bg-muted/30 p-2 rounded-md">
                          {Array.isArray(result.openingHours) ? (
                            result.openingHours.map((hours, index) => (
                              <li key={index} className="text-xs">
                                {hours}
                              </li>
                            ))
                          ) : (
                            <li className="text-xs">{result.openingHours}</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {result.rating && (
                      <div className="text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Star className="h-3 w-3" /> Rating:
                        </span>
                        <div className="flex items-center mt-1">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= Math.round(result.rating)
                                    ? "text-amber-500 fill-amber-500"
                                    : "text-gray-300 fill-gray-300"
                                }`}
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                              </svg>
                            ))}
                          </div>
                          <span className="ml-2 text-xs">{result.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    )}

                    {result.photos && result.photos.length > 0 && (
                      <div className="text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Camera className="h-3 w-3" /> Photos:
                        </span>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {result.photos.slice(0, 3).map((photo, index) => (
                            <motion.a
                              href={photo}
                              target="_blank"
                              rel="noopener noreferrer"
                              key={index}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ scale: 1.05 }}
                            >
                              <img
                                src={photo || "/placeholder.svg"}
                                alt={`${result.name} photo ${index + 1}`}
                                className="rounded-md h-20 w-full object-cover"
                              />
                            </motion.a>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.historicalInfo && (
                      <div className="text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Info className="h-3 w-3" /> Historical Information:
                        </span>
                        <p className="mt-1 text-xs bg-muted/30 p-2 rounded-md">
                          {showFullDescription || result.historicalInfo.length <= 150
                            ? result.historicalInfo
                            : `${result.historicalInfo.substring(0, 150)}...`}
                          {result.historicalInfo.length > 150 && (
                            <Button
                              variant="link"
                              className="p-0 h-auto text-xs"
                              onClick={() => setShowFullDescription(!showFullDescription)}
                            >
                              {showFullDescription ? "Show less" : "Show more"}
                            </Button>
                          )}
                        </p>
                      </div>
                    )}

                    {result.pointsOfInterest && result.pointsOfInterest.length > 0 && (
                      <div className="text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Nearby Points of Interest:
                        </span>
                        <ul className="list-disc pl-5 mt-1 text-xs">
                          {result.pointsOfInterest.map((poi, index) => (
                            <li key={index}>{poi}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.mapUrl && (
                      <div className="mt-4 flex gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button asChild className="w-full">
                                <a href={result.mapUrl} target="_blank" rel="noopener noreferrer">
                                  <MapPin className="mr-2 h-4 w-4" />
                                  View on Map
                                </a>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Open in Google Maps</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {result.location && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" className="w-full" asChild>
                                  <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${result.location.latitude},${result.location.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Navigation className="mr-2 h-4 w-4" />
                                    Navigate
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Get directions to this location</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-8 text-center"
                  >
                    <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No results yet. Upload an image, enter text, or lookup an address to get started.
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  )
}

