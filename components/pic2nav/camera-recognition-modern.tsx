"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Camera, Upload, X, MapPin, Loader2, Navigation, Share2, Copy, Globe, CheckCircle2, AlertCircle, ZoomIn, ZoomOut, RotateCw, Download, History, Maximize2, Globe2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

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

export function CameraRecognitionModern() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<RecognitionResult | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [uploadHistory, setUploadHistory] = useState<Array<{url: string, name: string, timestamp: number}>>([])
  const [showHistory, setShowHistory] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isStartingCamera, setIsStartingCamera] = useState(false)
  
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

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          const maxSize = 1920
          
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          } else if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
          
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }))
            } else {
              resolve(file)
            }
          }, 'image/jpeg', 0.85)
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  const processImage = useCallback(async (file: File) => {
    setIsProcessing(true)
    setResult(null)
    setUploadProgress(0)

    try {
      // Send original file to preserve GPS data - compression strips EXIF
      const formData = new FormData()
      formData.append("image", file)
      formData.append("analyzeLandmarks", "true")

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
      console.log('API Response:', data)
      console.log('Historical Data:', data.historicalData)
      setResult(data)
      
      if (data.success) {
        toast({
          title: "Location identified",
          description: data.name || "Location found",
        })
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

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const context = canvas.getContext("2d")
    if (context) {
      context.drawImage(video, 0, 0)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" })
          handleFileSelect(file)
          stopCamera()
        }
      }, "image/jpeg", 0.95)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      setCameraActive(false)
    }
  }, [])

  const handleFileSelect = useCallback((file: File) => {
    if (!file) return
    
    // Check file size (10MB limit)
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

  const downloadImage = useCallback(() => {
    if (!previewUrl) return
    const a = document.createElement('a')
    a.href = previewUrl
    a.download = `location-${Date.now()}.jpg`
    a.click()
  }, [previewUrl])

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
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0a0a0a]">
      {/* Organic blob backgrounds */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-pink-400/20 dark:bg-pink-600/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>
      <nav className="relative z-50 border-b border-stone-200/50 dark:border-stone-800/50 bg-white/50 dark:bg-black/50 backdrop-blur-xl sticky top-0 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-1">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
              <a href="/">
                <img src="/pic2nav.png" alt="Pic2Nav" className="h-8 sm:h-10 md:h-12 w-auto object-contain drop-shadow-lg cursor-pointer hover:opacity-90 transition-opacity" />
              </a>
              <div className="hidden md:flex items-center gap-1">
                <Button variant="ghost" className="rounded-full text-sm" asChild>
                  <a href="/">Home</a>
                </Button>
                <Button variant="ghost" className="rounded-full text-sm" asChild>
                  <a href="/dashboard">Dashboard</a>
                </Button>
                <Button variant="ghost" className="rounded-full text-sm" asChild>
                  <a href="/analytics">Analytics</a>
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {uploadHistory.length > 0 && (
                <Button onClick={() => setShowHistory(!showHistory)} variant="ghost" size="sm" className="rounded-full px-2 sm:px-3">
                  <History className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">History</span>
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full">{uploadHistory.length}</span>
                </Button>
              )}
              {result && (
                <Button onClick={reset} variant="ghost" size="sm" className="rounded-full px-2 sm:px-3">
                  <X className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              )}
              <Button className="rounded-full bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 dark:text-stone-900 text-white text-xs sm:text-sm px-3 sm:px-4" size="sm" asChild>
                <a href="/camera">Scan</a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 overflow-x-hidden">
        {!previewUrl && !cameraActive && !isProcessing && (
          <div className="mb-8 text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-stone-900 dark:text-white">
              Discover <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Any Location</span>
            </h1>
            <p className="text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">
              Upload a photo and let AI reveal its location, landmarks, and details
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 w-full">
          <div className="w-full lg:col-span-3">
            <div className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800">
                <h2 className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">Image Upload</h2>
              </div>
              <div className="p-3 sm:p-4 md:p-6">
                <div 
                  ref={dropZoneRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative aspect-[4/3] bg-stone-100 dark:bg-stone-800 rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-colors ${
                    isDragging ? 'border-stone-900 dark:border-stone-100 bg-stone-50 dark:bg-stone-900' : 'border-stone-200 dark:border-stone-700'
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
                    <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex gap-1 sm:gap-2">
                      <Button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} size="icon" variant="secondary" className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/90 dark:bg-stone-900/90 hover:bg-white dark:hover:bg-stone-900 shadow-lg">
                        <ZoomOut className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <Button onClick={() => setZoom(z => Math.min(3, z + 0.25))} size="icon" variant="secondary" className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/90 dark:bg-stone-900/90 hover:bg-white dark:hover:bg-stone-900 shadow-lg">
                        <ZoomIn className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <Button onClick={() => setRotation(r => (r + 90) % 360)} size="icon" variant="secondary" className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/90 dark:bg-stone-900/90 hover:bg-white dark:hover:bg-stone-900 shadow-lg">
                        <RotateCw className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <Button onClick={downloadImage} size="icon" variant="secondary" className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/90 dark:bg-stone-900/90 hover:bg-white dark:hover:bg-stone-900 shadow-lg">
                        <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  )}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/98 via-blue-50/95 to-purple-50/95 dark:from-stone-900/98 dark:via-blue-950/95 dark:to-purple-950/95 backdrop-blur-md flex items-center justify-center">
                      <div className="text-center space-y-6 p-8 w-full max-w-sm">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                          <Loader2 className="relative w-16 h-16 text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text animate-spin mx-auto" style={{WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}} />
                        </div>
                        <div className="space-y-2">
                          <p className="text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Analyzing Image</p>
                          <p className="text-sm text-stone-600 dark:text-stone-400">Extracting location data...</p>
                        </div>
                        {uploadProgress > 0 && (
                          <div className="w-full space-y-2">
                            <div className="h-1.5 bg-stone-200/50 dark:bg-stone-700/50 rounded-full overflow-hidden backdrop-blur-sm">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out rounded-full shadow-lg" 
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                            <p className="text-xs font-medium text-stone-500 dark:text-stone-400">{uploadProgress}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {cameraActive && !isProcessing && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                      <Button onClick={stopCamera} variant="outline" size="icon" className="rounded-full">
                        <X className="w-5 h-5" />
                      </Button>
                      <Button onClick={capturePhoto} size="lg" className="rounded-full w-16 h-16 bg-slate-900 hover:bg-slate-800">
                        <Camera className="w-6 h-6" />
                      </Button>
                    </div>
                  )}
                  {!cameraActive && !previewUrl && !isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-900 dark:to-stone-950">
                      <div className="text-center space-y-4 sm:space-y-6 p-4 sm:p-8">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
                          {isDragging ? <Maximize2 className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-pulse" /> : <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">{isDragging ? 'Drop image here' : 'Upload an image'}</h3>
                          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-xs mx-auto px-2">
                            {isDragging ? 'Release to upload' : 'Drag & drop, paste (Ctrl+V), or select an image'}
                          </p>
                        </div>
                        {!isDragging && (
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                            <Button onClick={startCamera} disabled={isStartingCamera} className="rounded-full bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 dark:text-stone-900 text-white text-sm">
                              {isStartingCamera ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
                              {isStartingCamera ? 'Starting...' : 'Camera'}
                            </Button>
                            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="rounded-full border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-900 text-sm">
                              <Upload className="w-4 h-4 mr-2" />
                              Upload
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:col-span-2 space-y-3 sm:space-y-4">
            {!result && !isProcessing && !previewUrl && (
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl sm:rounded-3xl border border-blue-200 dark:border-blue-900 shadow-xl overflow-hidden">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-blue-200 dark:border-blue-900 bg-blue-100/50 dark:bg-blue-900/20">
                  <h2 className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    How to Use
                  </h2>
                </div>
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">1</div>
                    <div>
                      <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">Upload Image</h3>
                      <p className="text-sm text-stone-600 dark:text-stone-400">Click camera or upload button, drag & drop, or paste (Ctrl+V)</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm">2</div>
                    <div>
                      <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">AI Analysis</h3>
                      <p className="text-sm text-stone-600 dark:text-stone-400">Our AI extracts GPS data and identifies landmarks instantly</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-red-600 flex items-center justify-center text-white font-bold text-sm">3</div>
                    <div>
                      <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">Get Results</h3>
                      <p className="text-sm text-stone-600 dark:text-stone-400">View location, weather, nearby places, and more details</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {showHistory && uploadHistory.length > 0 && (
              <div className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 flex items-center justify-between">
                  <h2 className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">Recent Uploads</h2>
                  <Button onClick={() => setShowHistory(false)} variant="ghost" size="sm">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="p-3 sm:p-4 space-y-2 max-h-64 overflow-y-auto">
                  {uploadHistory.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer" onClick={() => { setPreviewUrl(item.url); setShowHistory(false) }}>
                      <img src={item.url} alt={item.name} className="w-12 h-12 object-cover rounded-xl" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">{item.name}</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">{new Date(item.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result ? (
              result.success ? (
                <div className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 rounded-full blur-2xl"></div>
                    <div className="relative flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-green-900 dark:text-green-100">Location identified</p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">Analysis completed successfully</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative overflow-hidden bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
                    <div className="relative px-4 sm:px-6 py-3 sm:py-4 border-b border-stone-200 dark:border-stone-800 bg-gradient-to-r from-stone-50 to-stone-100 dark:from-stone-800 dark:to-stone-900">
                      <h2 className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Location Details
                      </h2>
                    </div>
                    <div className="relative p-4 sm:p-6 space-y-3 sm:space-y-4">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-xl animate-pulse">
                          <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 mb-1">{result.name || "Location Found"}</h3>
                          {result.address && <p className="text-sm text-stone-600 dark:text-stone-400">{result.address}</p>}
                          {!result.address && result.location && (
                            <p className="text-sm text-stone-600 dark:text-stone-400">
                              {result.location.latitude.toFixed(6)}, {result.location.longitude.toFixed(6)}
                            </p>
                          )}
                          {result.confidence && (
                            <div className="mt-4 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700">
                              <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 mb-2">
                                <span className="font-medium">Confidence Score</span>
                                <span className="font-bold text-base text-stone-900 dark:text-stone-100">{Math.round(result.confidence * 100)}%</span>
                              </div>
                              <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out shadow-lg" style={{ width: `${result.confidence * 100}%` }} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {result.location && (
                        <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
                          <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2 flex items-center gap-2">
                            <Globe2 className="w-3 h-3" />
                            GPS Coordinates
                          </p>
                          <div className="flex items-center gap-2 text-sm font-mono bg-gradient-to-r from-stone-50 to-stone-100 dark:from-stone-800 dark:to-stone-900 rounded-2xl p-4 border border-stone-200 dark:border-stone-700 shadow-inner">
                            <span className="text-stone-900 dark:text-stone-100 font-semibold">{result.location.latitude.toFixed(6)}</span>
                            <span className="text-stone-400">,</span>
                            <span className="text-stone-900 dark:text-stone-100 font-semibold">{result.location.longitude.toFixed(6)}</span>
                          </div>
                        </div>
                      )}

                      {(result.locationDetails?.country || result.locationDetails?.state || result.locationDetails?.region) && (
                        <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
                          <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-3 flex items-center gap-2">
                            <Globe className="w-3 h-3" />
                            Location Info
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            {result.locationDetails?.country && (
                              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50">
                                <p className="text-xs text-stone-600 dark:text-stone-400 mb-1">Country</p>
                                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{result.locationDetails.country}</p>
                              </div>
                            )}
                            {result.locationDetails?.state && (
                              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50">
                                <p className="text-xs text-stone-600 dark:text-stone-400 mb-1">State</p>
                                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{result.locationDetails.state}</p>
                              </div>
                            )}
                            {result.locationDetails?.region && (
                              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 col-span-2">
                                <p className="text-xs text-stone-600 dark:text-stone-400 mb-1">Region</p>
                                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{result.locationDetails.region}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {(result as any).historicalData && (
                        <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
                          <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-3 flex items-center gap-2">
                            <History className="w-3 h-3" />
                            Photo History
                          </p>
                          <div className="space-y-3">
                            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                              <p className="text-lg font-bold text-amber-900 dark:text-amber-100">{(result as any).historicalData.photoAge}</p>
                              {(result as any).historicalData.photoTakenDate && (
                                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                  Taken: {new Date((result as any).historicalData.photoTakenDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            {(result as any).historicalData.historicalContext && (
                              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50">
                                <p className="text-sm text-stone-700 dark:text-stone-300">{(result as any).historicalData.historicalContext}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {(result.method || result.phoneNumber || result.deviceAnalysis) && (
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-200 dark:border-stone-800">
                          {result.method && (
                            <div>
                              <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Method</p>
                              <p className="text-sm text-stone-900 dark:text-stone-100 capitalize">{result.method.replace(/-/g, ' ')}</p>
                            </div>
                          )}
                          {result.phoneNumber && (
                            <div>
                              <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Phone</p>
                              <p className="text-sm text-stone-900 dark:text-stone-100">{result.phoneNumber}</p>
                            </div>
                          )}
                          {result.deviceAnalysis?.camera?.model && (
                            <div className="col-span-2">
                              <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Device</p>
                              <p className="text-sm text-stone-900 dark:text-stone-100">{result.deviceAnalysis.camera.make} {result.deviceAnalysis.camera.model}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {result.nearbyPlaces && result.nearbyPlaces.length > 0 && (
                    <div className="relative overflow-hidden bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xl">
                      <div className="absolute top-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl"></div>
                      <div className="relative px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-gradient-to-r from-stone-50 to-stone-100 dark:from-stone-800 dark:to-stone-900">
                        <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Nearby Places
                          <span className="ml-auto text-xs px-2 py-1 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full">{result.nearbyPlaces.length}</span>
                        </h2>
                      </div>
                      <div className="relative p-4 space-y-2 max-h-64 overflow-y-auto">
                        {result.nearbyPlaces.slice(0, 5).map((place: any, idx: number) => (
                          <div key={idx} className="group p-3 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-all duration-200 cursor-pointer border border-transparent hover:border-stone-200 dark:hover:border-stone-700">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow">
                                <MapPin className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{place.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-full capitalize">{place.type}</span>
                                  {place.distance && <span className="text-xs text-stone-500 dark:text-stone-500">{place.distance}m</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(result.weather || result.elevation) && (
                    <div className="relative overflow-hidden bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xl">
                      <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl"></div>
                      <div className="relative px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-gradient-to-r from-stone-50 to-stone-100 dark:from-stone-800 dark:to-stone-900">
                        <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                          <Globe2 className="w-4 h-4" />
                          Environment
                        </h2>
                      </div>
                      <div className="relative p-4 grid grid-cols-2 gap-3">
                        {result.weather && (
                          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200 dark:border-blue-900">
                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">Weather</p>
                            <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{result.weather.temperature}°C</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Wind {result.weather.windSpeed} km/h</p>
                          </div>
                        )}
                        {result.elevation && (
                          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-900">
                            <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-2">Elevation</p>
                            <p className="text-lg font-bold text-purple-900 dark:text-purple-100">{result.elevation.elevation}m</p>
                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Above sea level</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="relative overflow-hidden bg-gradient-to-br from-white to-stone-50 dark:from-stone-900 dark:to-stone-950 rounded-2xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xl">
                    <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-gradient-to-r from-stone-50 to-stone-100 dark:from-stone-800 dark:to-stone-900">
                      <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Quick Actions
                      </h2>
                    </div>
                    <div className="p-4 space-y-2">
                      {result.location && (
                        <Button asChild className="w-full justify-start rounded-full bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 dark:text-stone-900 text-white">
                          <a href={`https://www.google.com/maps/dir/?api=1&destination=${result.location.latitude},${result.location.longitude}`} target="_blank" rel="noopener noreferrer">
                            <Navigation className="w-4 h-4 mr-2" />
                            Open in Maps
                          </a>
                        </Button>
                      )}
                      <Button onClick={() => result.location && (navigator.clipboard.writeText(`${result.location.latitude}, ${result.location.longitude}`), toast({ title: "Coordinates copied" }))} variant="outline" className="w-full justify-start rounded-full border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-900">
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Coordinates
                      </Button>
                      <Button onClick={() => shareLocation(result)} variant="outline" className="w-full justify-start rounded-full border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-900">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Location
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">Recognition Failed</h3>
                      <p className="text-sm text-red-700 dark:text-red-300">{result.error}</p>
                      <Button onClick={reset} size="sm" className="mt-4 rounded-full bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white">
                        Try Again
                      </Button>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xl p-6 sm:p-8">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">No results yet</h3>
                    <p className="text-sm text-stone-600 dark:text-stone-400">Upload an image to see location details</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileSelect(file) }} />
      <canvas ref={canvasRef} className="hidden" />

      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
