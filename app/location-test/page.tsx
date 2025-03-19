"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  Info,
  X,
  Upload,
  Sparkles,
  Navigation,
  Layers,
  Compass,
  ChevronRight,
  Calendar,
  Award,
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
  const [activeSection, setActiveSection] = useState<string | null>(null)

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
      formData.append("saveToDb", "true")

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
      setActiveSection("overview")

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
      setActiveSection("overview")

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
      setActiveSection("overview")

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
    setActiveSection(null)
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

    if (data.architecturalStyle) {
      items.push({
        icon: <Building className="h-3 w-3" />,
        label: `Style: ${data.architecturalStyle}`,
      })
    }

    if (data.yearBuilt) {
      items.push({
        icon: <Calendar className="h-3 w-3" />,
        label: `Built: ${data.yearBuilt}`,
      })
    }

    if (items.length === 0) return null

    return (
      <div className="flex flex-wrap gap-1.5 mt-3">
        {items.map((item, index) => (
          <Badge
            key={index}
            variant="outline"
            className="text-xs flex items-center gap-1 py-1 px-2 rounded-md bg-background/50 backdrop-blur-sm"
          >
            {item.icon}
            <span>{item.label}</span>
          </Badge>
        ))}
      </div>
    )
  }

  // Define sections for the results
  const resultSections = [
    { id: "overview", label: "Overview", icon: <Info className="h-4 w-4" /> },
    { id: "details", label: "Details", icon: <Layers className="h-4 w-4" /> },
    { id: "location", label: "Location", icon: <MapPin className="h-4 w-4" /> },
    { id: "media", label: "Media", icon: <Camera className="h-4 w-4" /> },
  ]

  return (
    <div className="container py-10 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Location Recognition
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Identify places around the world using images, text descriptions, or addresses
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 grid grid-cols-3 w-full">
              <TabsTrigger value="image" className="flex items-center gap-2 py-3">
                <Camera className="h-4 w-4" />
                <span className={isMobile ? "hidden" : "inline"}>Image</span>
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center gap-2 py-3">
                <FileText className="h-4 w-4" />
                <span className={isMobile ? "hidden" : "inline"}>Text</span>
              </TabsTrigger>
              <TabsTrigger value="address" className="flex items-center gap-2 py-3">
                <MapPin className="h-4 w-4" />
                <span className={isMobile ? "hidden" : "inline"}>Address</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="image" className="mt-0">
              <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-b from-background to-muted/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Camera className="h-5 w-5 text-primary" />
                    </div>
                    Image Recognition
                  </CardTitle>
                  <CardDescription>Upload an image or take a photo to identify the location</CardDescription>
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
                      <div className="relative rounded-xl overflow-hidden shadow-md">
                        <video ref={videoRef} className="w-full h-[300px] object-cover" autoPlay playsInline muted />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                        <Button
                          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 rounded-full px-6"
                          size="lg"
                          onClick={handleCameraCapture}
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Capture
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-full h-9 w-9"
                          onClick={stopCamera}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : imagePreview ? (
                      <div className="relative rounded-xl overflow-hidden shadow-md">
                        <motion.img
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-[300px] object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-full h-9 w-9"
                          onClick={() => setImagePreview(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <motion.div
                          whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                          className="border border-border/50 rounded-xl p-4 text-center cursor-pointer hover:bg-muted/50 transition-all"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="py-8">
                            <div className="bg-primary/10 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                              <Upload className="h-8 w-8 text-primary" />
                            </div>
                            <p className="font-medium">Upload Image</p>
                            <p className="text-sm text-muted-foreground mt-1">JPG, PNG, GIF</p>
                          </div>
                        </motion.div>

                        <motion.div
                          whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                          className="border border-border/50 rounded-xl p-4 text-center cursor-pointer hover:bg-muted/50 transition-all"
                          onClick={handleCameraCapture}
                        >
                          <div className="py-8">
                            <div className="bg-primary/10 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                              <Camera className="h-8 w-8 text-primary" />
                            </div>
                            <p className="font-medium">Use Camera</p>
                            <p className="text-sm text-muted-foreground mt-1">Take a photo now</p>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </div>

                  {isProcessing && activeTab === "image" && (
                    <div className="mt-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">Analyzing image...</span>
                        <span className="text-primary font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={reset} className="text-muted-foreground">
                    <X className="mr-2 h-4 w-4" />
                    Reset
                  </Button>

                  {imagePreview && !isProcessing && (
                    <Button
                      onClick={() => processImage(fileInputRef.current?.files?.[0] as File)}
                      disabled={isProcessing || !fileInputRef.current?.files?.[0]}
                      className="rounded-full px-4"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyze Again
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="text" className="mt-0">
              <Card className="border-none shadow-lg bg-gradient-to-b from-background to-muted/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    Text Recognition
                  </CardTitle>
                  <CardDescription>Enter text containing location information</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Enter text with location information, e.g., 'I'm visiting the Eiffel Tower in Paris next week.'"
                    className="min-h-[200px] resize-none border-border/50 rounded-xl"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />

                  {isProcessing && activeTab === "text" && (
                    <div className="mt-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">Analyzing text...</span>
                        <span className="text-primary font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={reset} className="text-muted-foreground">
                    <X className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  <Button onClick={processText} disabled={isProcessing || !text.trim()} className="rounded-full px-4">
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
              <Card className="border-none shadow-lg bg-gradient-to-b from-background to-muted/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    Address Lookup
                  </CardTitle>
                  <CardDescription>Enter an address to get location details</CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Enter an address, e.g., '1600 Pennsylvania Avenue, Washington DC'"
                    className="mb-4 border-border/50 rounded-xl h-12"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />

                  {isProcessing && activeTab === "address" && (
                    <div className="mt-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">Looking up address...</span>
                        <span className="text-primary font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={reset} className="text-muted-foreground">
                    <X className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  <Button
                    onClick={processAddress}
                    disabled={isProcessing || !address.trim()}
                    className="rounded-full px-4"
                  >
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
          </Tabs>
        </div>

        <div className="lg:col-span-7">
          <Card className="h-full border-none shadow-lg bg-gradient-to-b from-background to-muted/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Compass className="h-5 w-5 text-primary" />
                  </div>
                  Results
                </CardTitle>
                {result && result.confidence && (
                  <Badge
                    variant={result.confidence > 0.7 ? "default" : "outline"}
                    className={`px-3 py-1 rounded-full ${result.confidence > 0.7 ? "bg-primary/20 text-primary" : ""}`}
                  >
                    {Math.round(result.confidence * 100)}% confidence
                  </Badge>
                )}
              </div>
              <CardDescription>Location recognition results will appear here</CardDescription>
            </CardHeader>

            <CardContent className="overflow-y-auto max-h-[600px] scrollbar-thin pb-6">
              {isProcessing ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full"></div>
                    <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
                  </div>
                  <p className="mt-6 text-lg font-medium">Processing your request...</p>
                  <p className="text-muted-foreground">Analyzing data and identifying location</p>
                </motion.div>
              ) : error ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-destructive/10 p-6 rounded-xl flex items-start my-8"
                >
                  <AlertCircle className="h-6 w-6 text-destructive mr-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-destructive text-lg">Error</p>
                    <p className="mt-1">{error}</p>
                    <Button
                      variant="outline"
                      className="mt-4 border-destructive/20 text-destructive hover:bg-destructive/10"
                      onClick={reset}
                    >
                      Try Again
                    </Button>
                  </div>
                </motion.div>
              ) : result ? (
                <div>
                  {/* Navigation tabs for result sections */}
                  <div className="flex overflow-x-auto pb-2 mb-6 gap-2 scrollbar-none">
                    {resultSections.map((section) => (
                      <Button
                        key={section.id}
                        variant={activeSection === section.id ? "default" : "outline"}
                        className={`rounded-full px-4 py-2 text-sm ${activeSection === section.id ? "bg-primary text-primary-foreground" : "bg-background"}`}
                        onClick={() => setActiveSection(section.id)}
                      >
                        <div className="flex items-center gap-2">
                          {section.icon}
                          <span>{section.label}</span>
                        </div>
                      </Button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {activeSection === "overview" && (
                      <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                      >
                        <div className="bg-muted/30 rounded-xl p-5 backdrop-blur-sm">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-2xl font-bold">{result.name || "Unknown Location"}</h3>
                          </div>

                          {result.recognitionType && (
                            <div className="flex items-center text-sm mb-3">
                              <Badge variant="secondary" className="rounded-full px-3 py-1">
                                {result.recognitionType}
                              </Badge>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 mb-4">
                            {result.category && (
                              <Badge
                                variant="outline"
                                className="rounded-full px-3 py-1 bg-background/50 backdrop-blur-sm"
                              >
                                {result.category}
                              </Badge>
                            )}
                            {result.buildingType && (
                              <Badge
                                variant="outline"
                                className="rounded-full px-3 py-1 bg-background/50 backdrop-blur-sm"
                              >
                                {result.buildingType}
                              </Badge>
                            )}
                          </div>

                          {result.address && (
                            <div className="flex items-start gap-3 mb-4">
                              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <p>{result.address}</p>
                            </div>
                          )}

                          {result.description && (
                            <div className="mb-4">
                              <p className="text-muted-foreground mb-2 text-sm">Description</p>
                              <p className="text-sm">
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

                          {renderEnvironmentalData(result)}
                        </div>

                        {/* Key Information Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {result.architecturalStyle && (
                            <Card className="bg-background/50 backdrop-blur-sm border-none shadow-sm">
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="bg-primary/10 p-2 rounded-full">
                                    <Building className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Architectural Style</p>
                                    <p className="font-medium">{result.architecturalStyle}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {result.yearBuilt && (
                            <Card className="bg-background/50 backdrop-blur-sm border-none shadow-sm">
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="bg-primary/10 p-2 rounded-full">
                                    <Calendar className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Year Built</p>
                                    <p className="font-medium">{result.yearBuilt}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {result.culturalSignificance && (
                            <Card className="bg-background/50 backdrop-blur-sm border-none shadow-sm md:col-span-2">
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="bg-primary/10 p-2 rounded-full">
                                    <Award className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Cultural Significance</p>
                                    <p className="font-medium">{result.culturalSignificance}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>

                        {/* Actions */}
                        {result.location && (
                          <div className="flex gap-3 mt-6">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button asChild className="flex-1 rounded-full">
                                    <a
                                      href={`https://www.google.com/maps?q=${result.latitude || result.location.latitude},${result.longitude || result.location.longitude}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
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

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" className="flex-1 rounded-full" asChild>
                                    <a
                                      href={`https://www.google.com/maps/dir/?api=1&destination=${result.latitude || result.location.latitude},${result.longitude || result.location.longitude}`}
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
                          </div>
                        )}
                      </motion.div>
                    )}

                    {activeSection === "details" && (
                      <motion.div
                        key="details"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                      >
                        <div className="bg-muted/30 rounded-xl p-5 backdrop-blur-sm">
                          <h3 className="text-xl font-bold mb-4">Detailed Information</h3>

                          {result.materialType && (
                            <div className="mb-4">
                              <p className="text-sm text-muted-foreground mb-1">Building Material</p>
                              <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-primary" />
                                <p>{result.materialType}</p>
                              </div>
                            </div>
                          )}

                          {result.culturalSignificance && (
                            <div className="mb-4">
                              <p className="text-sm text-muted-foreground mb-1">Cultural Significance</p>
                              <div className="flex items-start gap-2">
                                <Award className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                                <p>{result.culturalSignificance}</p>
                              </div>
                            </div>
                          )}

                          {result.historicalInfo && (
                            <div className="mb-4">
                              <p className="text-sm text-muted-foreground mb-1">Historical Information</p>
                              <div className="flex items-start gap-2">
                                <Info className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                                <p className="text-sm">
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
                            </div>
                          )}
                        </div>

                        {/* Contact information */}
                        {(result.phoneNumber || result.website) && (
                          <div className="bg-muted/30 rounded-xl p-5 backdrop-blur-sm">
                            <h3 className="text-xl font-bold mb-4">Contact Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {result.phoneNumber && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">Phone</p>
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-primary" />
                                    <p>{result.phoneNumber}</p>
                                  </div>
                                </div>
                              )}

                              {result.website && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">Website</p>
                                  <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-primary" />
                                    <a
                                      href={result.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline truncate"
                                    >
                                      {result.website}
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {result.openingHours && result.openingHours.length > 0 && (
                          <div className="bg-muted/30 rounded-xl p-5 backdrop-blur-sm">
                            <h3 className="text-xl font-bold mb-4">Opening Hours</h3>
                            <div className="flex items-start gap-2">
                              <Clock className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                              <ul className="list-none space-y-1">
                                {Array.isArray(result.openingHours) ? (
                                  result.openingHours.map((hours, index) => (
                                    <li key={index} className="text-sm">
                                      {hours}
                                    </li>
                                  ))
                                ) : (
                                  <li className="text-sm">{result.openingHours}</li>
                                )}
                              </ul>
                            </div>
                          </div>
                        )}

                        {result.rating && (
                          <div className="bg-muted/30 rounded-xl p-5 backdrop-blur-sm">
                            <h3 className="text-xl font-bold mb-4">Rating</h3>
                            <div className="flex items-center gap-3">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg
                                    key={star}
                                    className={`w-5 h-5 ${
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
                              <span className="text-lg font-medium">{result.rating.toFixed(1)}</span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {activeSection === "location" && (
                      <motion.div
                        key="location"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                      >
                        <div className="bg-muted/30 rounded-xl p-5 backdrop-blur-sm">
                          <h3 className="text-xl font-bold mb-4">Location Details</h3>

                          {result.address && (
                            <div className="mb-4">
                              <p className="text-sm text-muted-foreground mb-1">Address</p>
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                                <p>{result.address}</p>
                              </div>
                            </div>
                          )}

                          {result.location && (
                            <div className="mb-4">
                              <p className="text-sm text-muted-foreground mb-1">Coordinates</p>
                              <div className="flex items-center gap-2">
                                <Compass className="h-4 w-4 text-primary" />
                                <p className="font-mono text-sm">
                                  {result.latitude || result.location.latitude.toFixed(6)},{" "}
                                  {result.longitude || result.location.longitude.toFixed(6)}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Display enhanced geotagging information */}
                        {result.geoData && Object.keys(result.geoData).some((key) => result.geoData[key]) && (
                          <div className="bg-muted/30 rounded-xl p-5 backdrop-blur-sm">
                            <h3 className="text-xl font-bold mb-4">Geographic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {result.geoData.country && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">Country</p>
                                  <p>
                                    {result.geoData.country}{" "}
                                    {result.geoData.countryCode && `(${result.geoData.countryCode})`}
                                  </p>
                                </div>
                              )}
                              {result.geoData.administrativeArea && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">State/Province</p>
                                  <p>{result.geoData.administrativeArea}</p>
                                </div>
                              )}
                              {result.geoData.locality && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">City</p>
                                  <p>{result.geoData.locality}</p>
                                </div>
                              )}
                              {result.geoData.subLocality && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">District</p>
                                  <p>{result.geoData.subLocality}</p>
                                </div>
                              )}
                              {result.geoData.postalCode && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">Postal Code</p>
                                  <p>{result.geoData.postalCode}</p>
                                </div>
                              )}
                              {(result.geoData.streetName || result.geoData.streetNumber) && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">Street</p>
                                  <p>
                                    {result.geoData.streetNumber} {result.geoData.streetName}
                                  </p>
                                </div>
                              )}
                              {result.geoData.elevation && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">Elevation</p>
                                  <p>{result.geoData.elevation.toFixed(1)} meters</p>
                                </div>
                              )}
                              {result.geoData.timezone && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">Timezone</p>
                                  <p>{result.geoData.timezone}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Display nearby places */}
                        {result.nearbyPlaces && result.nearbyPlaces.length > 0 && (
                          <div className="bg-muted/30 rounded-xl p-5 backdrop-blur-sm">
                            <h3 className="text-xl font-bold mb-4">Nearby Places</h3>
                            <div className="space-y-3">
                              {result.nearbyPlaces.map((place, idx) => (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                  className="flex justify-between items-center bg-background/50 p-3 rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-full">
                                      <MapPin className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                      <p className="font-medium">{place.name}</p>
                                      <p className="text-xs text-muted-foreground">{place.type}</p>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="rounded-full px-2">
                                    {place.distance < 1000
                                      ? `${Math.round(place.distance)}m`
                                      : `${(place.distance / 1000).toFixed(1)}km`}
                                  </Badge>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}

                        {result.pointsOfInterest && result.pointsOfInterest.length > 0 && (
                          <div className="bg-muted/30 rounded-xl p-5 backdrop-blur-sm">
                            <h3 className="text-xl font-bold mb-4">Points of Interest</h3>
                            <ul className="space-y-2">
                              {result.pointsOfInterest.map((poi, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <ChevronRight className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                                  <span>{poi}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {activeSection === "media" && (
                      <motion.div
                        key="media"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                      >
                        {result.photos && result.photos.length > 0 ? (
                          <div className="bg-muted/30 rounded-xl p-5 backdrop-blur-sm">
                            <h3 className="text-xl font-bold mb-4">Photos</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {result.photos.map((photo, index) => (
                                <motion.a
                                  href={photo}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  key={index}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: index * 0.1 }}
                                  whileHover={{ scale: 1.05 }}
                                  className="overflow-hidden rounded-lg shadow-md aspect-square relative group"
                                >
                                  <img
                                    src={photo || "/placeholder.svg"}
                                    alt={`${result.name} photo ${index + 1}`}
                                    className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Search className="h-6 w-6 text-white" />
                                  </div>
                                </motion.a>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-muted/30 rounded-xl p-8 backdrop-blur-sm text-center">
                            <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-xl font-medium mb-2">No Photos Available</h3>
                            <p className="text-muted-foreground">There are no photos available for this location.</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="bg-primary/5 p-6 rounded-full mb-6">
                    <MapPin className="h-12 w-12 text-primary/70" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">No Results Yet</h3>
                  <p className="text-muted-foreground max-w-md">
                    Upload an image, enter text, or lookup an address to identify a location.
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

