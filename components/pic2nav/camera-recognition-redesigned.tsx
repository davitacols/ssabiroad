"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Camera, Upload, X, MapPin, Loader2, Navigation, Share2, Copy, Globe, CheckCircle2, AlertCircle, ZoomIn, ZoomOut, RotateCw, Download, History, Maximize2, Globe2, Zap, Layers, BarChart3, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Location {
  latitude: number
  longitude: number
}

interface RecognitionResult {
  success: boolean
  name?: string
  address?: string
  location?: Location
  confidence?: number
  error?: string
  rating?: number
  website?: string
  phoneNumber?: string
  category?: string
  method?: string
  nearbyPlaces?: any[]
  photos?: string[]
  weather?: any
  locationDetails?: any
  elevation?: any
  transit?: any[]
  demographics?: any
  deviceAnalysis?: any
  description?: string
}

export function CameraRecognitionRedesigned() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<RecognitionResult | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [uploadHistory, setUploadHistory] = useState<Array<{url: string, name: string, timestamp: number}>>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isStartingCamera, setIsStartingCamera] = useState(false)
  const [activeTab, setActiveTab] = useState("single")
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (cameraActive || result)) {
        reset()
      }
      if (e.ctrlKey && e.key === 'v') {
        handlePaste()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [cameraActive, result])

  const handlePaste = async () => {
    try {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        const imageType = item.types.find(type => type.startsWith('image/'))
        if (imageType) {
          const blob = await item.getType(imageType)
          const file = new File([blob], `pasted-${Date.now()}.png`, { type: imageType })
          handleFileSelect(file)
          break
        }
      }
    } catch {
      toast({ title: "Paste failed", description: "No image in clipboard", variant: "destructive" })
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file)
    } else {
      toast({ title: "Invalid file", description: "Please drop an image file", variant: "destructive" })
    }
  }, [])

  const processImage = useCallback(async (file: File) => {
    setIsProcessing(true)
    setResult(null)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("image", file)
      formData.append("analyzeLandmarks", "true")
      
      if ((file as any).location) {
        formData.append("clientGPSLatitude", (file as any).location.latitude.toString())
        formData.append("clientGPSLongitude", (file as any).location.longitude.toString())
      }

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('/api/location-recognition-v2', {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) throw new Error(`API error: ${response.status}`)

      const data = await response.json()
      setResult(data)
      
      if (data.success) {
        toast({
          title: "Location identified",
          description: data.name || "Location found",
        })
        
        try {
          await fetch('/api/save-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })
        } catch (e) {
          console.error('Failed to save location:', e)
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Recognition failed"
      setResult({ success: false, error: errorMessage })
      toast({
        title: "Recognition failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setUploadProgress(0)
    }
  }, [toast])

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      setCameraActive(false)
    }
  }, [])

  const handleFileSelect = useCallback((file: File & { location?: { latitude: number; longitude: number } }) => {
    if (!file) return
    
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 10MB",
        variant: "destructive"
      })
      return
    }
    
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setZoom(1)
    setRotation(0)
    setUploadHistory(prev => [{ url, name: file.name, timestamp: Date.now() }, ...prev.slice(0, 4)])
    processImage(file)
  }, [processImage, toast])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const context = canvas.getContext("2d")
    if (!context) return

    context.drawImage(video, 0, 0)
    
    canvas.toBlob(async (blob) => {
      if (!blob) return
      
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 })
        })
        
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" }) as any
        file.location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
        handleFileSelect(file)
      } catch {
        toast({ title: "Location unavailable", description: "Photo captured without GPS", variant: "destructive" })
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" })
        handleFileSelect(file)
      }
      stopCamera()
    }, "image/jpeg", 0.95)
  }, [toast, stopCamera, handleFileSelect])

  const startCamera = useCallback(async () => {
    setIsStartingCamera(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
        await videoRef.current.play()
      }
    } catch (error) {
      toast({
        title: "Camera error",
        description: "Could not access camera",
        variant: "destructive",
      })
      fileInputRef.current?.click()
    } finally {
      setIsStartingCamera(false)
    }
  }, [toast])

  const reset = useCallback(() => {
    setResult(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setIsProcessing(false)
    setZoom(1)
    setRotation(0)
    stopCamera()
  }, [previewUrl, stopCamera])

  const shareLocation = async (item: RecognitionResult) => {
    if (!item.success) return
    
    const shareData = {
      title: item.name || "Location Found",
      text: `${item.name} - ${item.address}`,
      url: item.location ? 
        `https://www.google.com/maps/search/?api=1&query=${item.location.latitude},${item.location.longitude}` : 
        window.location.href
    }
    
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`)
        toast({ title: "Copied to clipboard" })
      }
    } else {
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`)
      toast({ title: "Copied to clipboard" })
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-cyan-500/15 to-blue-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>
      
      {/* Floating header */}
      <nav className="relative z-50 mx-4 mt-4">
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <a href="/" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Camera className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-semibold">Pic2Nav</span>
              </a>
              <div className="hidden md:flex items-center gap-1">
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10" asChild>
                  <a href="/">Home</a>
                </Button>
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10" asChild>
                  <a href="/dashboard">Dashboard</a>
                </Button>
              </div>
            </div>
            {result && (
              <Button onClick={reset} className="bg-white/10 hover:bg-white/20 text-white border-0">
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-500/20 to-purple-500/20 backdrop-blur-sm border border-violet-500/30 rounded-full px-4 py-2 mb-6">
            <Zap className="w-4 h-4 text-violet-400" />
            <span className="text-violet-300 text-sm font-medium">AI-Powered Location Detection</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white via-violet-200 to-purple-200 bg-clip-text text-transparent">
              Smart Location
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Scanner
            </span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Upload photos and let our advanced AI reveal hidden location data with precision
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-12">
            <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("single")}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${
                    activeTab === "single" 
                      ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25" 
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span className="font-medium">Single Photo</span>
                </button>
                <button
                  onClick={() => setActiveTab("batch")}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${
                    activeTab === "batch" 
                      ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25" 
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span className="font-medium">Batch Process</span>
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${
                    activeTab === "history" 
                      ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25" 
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span className="font-medium">History</span>
                </button>
              </div>
            </div>
          </div>

          <div className={`transition-all duration-500 ${activeTab === "single" ? "block" : "hidden"}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upload Section */}
              <div className="space-y-6">
                <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full animate-pulse"></div>
                      <h2 className="text-white font-semibold">Image Upload</h2>
                    </div>
                  </div>
                  <div className="p-6">
                    <div 
                      ref={dropZoneRef}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative aspect-[4/3] bg-black/20 rounded-2xl overflow-hidden border-2 transition-all duration-500 ${
                        isDragging 
                          ? 'border-violet-500 bg-violet-500/10 scale-105 shadow-2xl shadow-violet-500/25' 
                          : 'border-white/20 hover:border-white/30'
                      }`}
                    >
                      <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted style={{ display: cameraActive ? 'block' : 'none' }} />
                      {previewUrl && !cameraActive && (
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="w-full h-full object-contain transition-transform duration-200" 
                          style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
                        />
                      )}
                      {previewUrl && !cameraActive && !isProcessing && (
                        <div className="absolute top-4 right-4 flex gap-2">
                          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="w-10 h-10 bg-black/60 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all">
                            <ZoomOut className="w-4 h-4" />
                          </button>
                          <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="w-10 h-10 bg-black/60 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all">
                            <ZoomIn className="w-4 h-4" />
                          </button>
                          <button onClick={() => setRotation(r => (r + 90) % 360)} className="w-10 h-10 bg-black/60 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all">
                            <RotateCw className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {isProcessing && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center">
                          <div className="text-center space-y-6">
                            <div className="relative">
                              <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto"></div>
                              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-500 rounded-full animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                            </div>
                            <div>
                              <p className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Analyzing Image</p>
                              <p className="text-white/60 mt-2">Extracting location data with AI...</p>
                            </div>
                            {uploadProgress > 0 && (
                              <div className="w-full max-w-xs mx-auto space-y-2">
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500 shadow-lg" 
                                    style={{ width: `${uploadProgress}%` }}
                                  />
                                </div>
                                <p className="text-white/60 text-sm">{uploadProgress}%</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {cameraActive && !isProcessing && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                          <button onClick={stopCamera} className="w-12 h-12 bg-black/60 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-red-500/20 hover:border-red-500/50 transition-all">
                            <X className="w-5 h-5" />
                          </button>
                          <button onClick={capturePhoto} className="w-16 h-16 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-violet-500/50 hover:scale-110 transition-all duration-300">
                            <Camera className="w-6 h-6" />
                          </button>
                        </div>
                      )}
                      {!cameraActive && !previewUrl && !isProcessing && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center space-y-8 p-8">
                            <div className="relative">
                              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-violet-500/50">
                                {isDragging ? <Maximize2 className="w-10 h-10 text-white animate-pulse" /> : <Camera className="w-10 h-10 text-white" />}
                              </div>
                              <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full blur-xl animate-pulse"></div>
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-white mb-3">
                                {isDragging ? 'Drop image here' : 'Upload an image'}
                              </h3>
                              <p className="text-white/60">
                                {isDragging ? 'Release to upload and analyze' : 'Drag & drop, paste (Ctrl+V), or select a file'}
                              </p>
                            </div>
                            {!isDragging && (
                              <div className="flex gap-4 justify-center">
                                <button 
                                  onClick={startCamera} 
                                  disabled={isStartingCamera}
                                  className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-2xl font-medium shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105 transition-all duration-300 disabled:opacity-50"
                                >
                                  {isStartingCamera ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                                  {isStartingCamera ? 'Starting...' : 'Camera'}
                                </button>
                                <button 
                                  onClick={() => fileInputRef.current?.click()}
                                  className="flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl font-medium hover:bg-white/20 transition-all duration-300"
                                >
                                  <Upload className="w-5 h-5" />
                                  Upload
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Section */}
              <div className="space-y-6">
                {result ? (
                  result.success ? (
                    <div className="space-y-6">
                      {/* Location Quality Card */}
                      <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full blur-2xl"></div>
                        <div className="relative">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25">
                              <CheckCircle2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white">Location Identified</h3>
                              <p className="text-green-400 font-medium">High confidence match</p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                              <h4 className="text-2xl font-bold text-white mb-2">{result.name || "Location Found"}</h4>
                              {result.address && <p className="text-white/70">{result.address}</p>}
                            </div>
                            {result.confidence && (
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-white/70">Confidence Score</span>
                                  <span className="text-2xl font-bold text-white">{Math.round(result.confidence * 100)}%</span>
                                </div>
                                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-green-400 to-emerald-400 transition-all duration-1000 shadow-lg" 
                                    style={{ width: `${result.confidence * 100}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Privacy Analysis Card */}
                      <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-blue-500/15 to-cyan-500/15 rounded-full blur-2xl"></div>
                        <div className="relative">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                              <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white">Privacy Analysis</h3>
                              <p className="text-blue-400 font-medium">Location data assessment</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                              <p className="text-white/60 text-sm mb-2">GPS Data</p>
                              <p className="text-white font-bold text-lg">
                                {result.location ? '✓ Available' : '✗ Not Found'}
                              </p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                              <p className="text-white/60 text-sm mb-2">Method</p>
                              <p className="text-white font-bold text-lg capitalize">
                                {result.method?.replace(/-/g, ' ') || 'Visual'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Security Insights Card */}
                      <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-36 h-36 bg-gradient-to-br from-purple-500/15 to-pink-500/15 rounded-full blur-2xl"></div>
                        <div className="relative">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                              <BarChart3 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white">Security Insights</h3>
                              <p className="text-purple-400 font-medium">Risk assessment</p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                              <span className="text-white/70">Location Exposure</span>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                <span className="text-green-400 font-bold">Low Risk</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                              <span className="text-white/70">Data Sensitivity</span>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                <span className="text-yellow-400 font-bold">Medium</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Accuracy Metrics Card */}
                      <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-indigo-500/15 to-violet-500/15 rounded-full blur-2xl"></div>
                        <div className="relative">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                              <Globe2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white">Accuracy Metrics</h3>
                              <p className="text-indigo-400 font-medium">Location precision data</p>
                            </div>
                          </div>
                          {result.location && (
                            <div className="space-y-4">
                              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                                <p className="text-white/60 text-sm mb-2">Coordinates</p>
                                <p className="text-white font-mono text-lg">
                                  {result.location.latitude.toFixed(6)}, {result.location.longitude.toFixed(6)}
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                                  <p className="text-white/60 text-sm mb-2">Precision</p>
                                  <p className="text-white font-bold text-lg">±10m</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                                  <p className="text-white/60 text-sm mb-2">Source</p>
                                  <p className="text-white font-bold text-lg">EXIF + AI</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6">
                        <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
                        <div className="space-y-3">
                          {result.location && (
                            <a 
                              href={`https://www.google.com/maps/dir/?api=1&destination=${result.location.latitude},${result.location.longitude}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 w-full p-4 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-2xl font-medium shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105 transition-all duration-300"
                            >
                              <Navigation className="w-5 h-5" />
                              Open in Maps
                            </a>
                          )}
                          <button 
                            onClick={() => result.location && (navigator.clipboard.writeText(`${result.location.latitude}, ${result.location.longitude}`), toast({ title: "Coordinates copied" }))}
                            className="flex items-center gap-3 w-full p-4 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl font-medium hover:bg-white/20 transition-all duration-300"
                          >
                            <Copy className="w-5 h-5" />
                            Copy Coordinates
                          </button>
                          <button 
                            onClick={() => shareLocation(result)}
                            className="flex items-center gap-3 w-full p-4 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl font-medium hover:bg-white/20 transition-all duration-300"
                          >
                            <Share2 className="w-5 h-5" />
                            Share Location
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-black/40 backdrop-blur-2xl border border-red-500/30 rounded-3xl p-6 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-3xl"></div>
                      <div className="relative flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/25">
                          <AlertCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">Recognition Failed</h3>
                          <p className="text-white/70 mb-4">{result.error}</p>
                          <button 
                            onClick={reset}
                            className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl font-medium shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-105 transition-all duration-300"
                          >
                            Try Again
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8">
                    <div className="text-center space-y-6">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-white/60" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">No results yet</h3>
                        <p className="text-white/60">Upload an image to see AI-powered location analysis</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={`transition-all duration-500 ${activeTab === "batch" ? "block" : "hidden"}`}>
            <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-12">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-violet-500/50">
                  <Layers className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">Batch Processing</h3>
                  <p className="text-white/60 mb-6">Process multiple images simultaneously with AI</p>
                  <a 
                    href="/batch"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-2xl font-medium shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105 transition-all duration-300"
                  >
                    <Layers className="w-5 h-5" />
                    Go to Batch Processor
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className={`transition-all duration-500 ${activeTab === "history" ? "block" : "hidden"}`}>
            <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8">
              {uploadHistory.length > 0 ? (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-white">Recent Uploads</h3>
                  <div className="grid gap-4">
                    {uploadHistory.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-6 p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 cursor-pointer transition-all duration-300 hover:scale-105" 
                        onClick={() => { setPreviewUrl(item.url); setActiveTab("single") }}
                      >
                        <img src={item.url} alt={item.name} className="w-20 h-20 object-cover rounded-2xl shadow-lg" />
                        <div>
                          <p className="text-xl font-bold text-white mb-1">{item.name}</p>
                          <p className="text-white/60">{new Date(item.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    <History className="w-10 h-10 text-white/60" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-3">No History</h3>
                    <p className="text-white/60">Your upload history will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Tabs>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileSelect(file) }} />
      <canvas ref={canvasRef} className="hidden" />
      
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}