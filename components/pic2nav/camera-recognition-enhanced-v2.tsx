"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Camera, Upload, X, MapPin, Loader2, Star, Navigation, Share2, Bookmark, Copy, Eye, Zap, Clock, Wifi, History, Heart, Download, Settings, Filter, Grid, List, Search, ChevronDown, ChevronUp, Trash2, RefreshCw, Maximize2, Volume2, VolumeX, FlashOff, Flash, Info, TrendingUp, Compass, ImageIcon, ZoomIn, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

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
  photos?: string[]
  reviews?: Array<{author: string, rating: number, text: string}>
  nearbyPlaces?: Array<{name: string, type: string, distance: number}>
  weather?: any
  method?: string
  timestamp?: number
  id?: string
}

interface CameraSettings {
  flashEnabled: boolean
  soundEnabled: boolean
  autoSave: boolean
  highQuality: boolean
  gpsEnabled: boolean
}

interface Stats {
  totalScans: number
  successRate: number
  favoriteCount: number
  lastScanTime: number
}

export function CameraRecognitionEnhancedV2() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<RecognitionResult | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [processingStep, setProcessingStep] = useState("")
  const [processingProgress, setProcessingProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("camera")
  const [history, setHistory] = useState<RecognitionResult[]>([])
  const [favorites, setFavorites] = useState<RecognitionResult[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [showSettings, setShowSettings] = useState(false)
  const [batchMode, setBatchMode] = useState(false)
  const [batchResults, setBatchResults] = useState<RecognitionResult[]>([])
  const [cameraSettings, setCameraSettings] = useState<CameraSettings>({
    flashEnabled: false,
    soundEnabled: true,
    autoSave: false,
    highQuality: true,
    gpsEnabled: true
  })
  const [stats, setStats] = useState<Stats>({
    totalScans: 0,
    successRate: 0,
    favoriteCount: 0,
    lastScanTime: 0
  })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [showImageTools, setShowImageTools] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  // Load saved data on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('camera-history')
    const savedFavorites = localStorage.getItem('camera-favorites')
    const savedSettings = localStorage.getItem('camera-settings')
    const savedStats = localStorage.getItem('camera-stats')
    
    if (savedHistory) setHistory(JSON.parse(savedHistory))
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites))
    if (savedSettings) setCameraSettings(JSON.parse(savedSettings))
    if (savedStats) setStats(JSON.parse(savedStats))
  }, [])

  // Update stats
  useEffect(() => {
    const successCount = history.filter(h => h.success).length
    const newStats = {
      totalScans: history.length,
      successRate: history.length > 0 ? (successCount / history.length) * 100 : 0,
      favoriteCount: favorites.length,
      lastScanTime: history[0]?.timestamp || 0
    }
    setStats(newStats)
    localStorage.setItem('camera-stats', JSON.stringify(newStats))
  }, [history, favorites])

  // Save data when changed
  useEffect(() => {
    localStorage.setItem('camera-history', JSON.stringify(history))
  }, [history])

  useEffect(() => {
    localStorage.setItem('camera-favorites', JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    localStorage.setItem('camera-settings', JSON.stringify(cameraSettings))
  }, [cameraSettings])

  const processImage = useCallback(async (file: File) => {
    setIsProcessing(true)
    setResult(null)
    setProcessingProgress(0)

    try {
      const steps = [
        { step: "Analyzing image...", progress: 25 },
        { step: "Extracting location data...", progress: 50 },
        { step: "Identifying place...", progress: 75 },
        { step: "Gathering details...", progress: 100 }
      ]

      for (const { step, progress } of steps) {
        setProcessingStep(step)
        setProcessingProgress(progress)
        await new Promise(resolve => setTimeout(resolve, 400))
      }

      const formData = new FormData()
      formData.append("image", file)
      formData.append("analyzeLandmarks", "true")

      const response = await fetch('/api/location-recognition-v2', {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error(`API error: ${response.status}`)

      const data = await response.json()
      const resultWithId = {
        ...data,
        id: Date.now().toString(),
        timestamp: Date.now()
      }
      
      setResult(resultWithId)
      
      if (data.success) {
        // Add to history
        setHistory(prev => [resultWithId, ...prev.slice(0, 49)]) // Keep last 50
        
        // Auto-save if enabled
        if (cameraSettings.autoSave) {
          setFavorites(prev => [resultWithId, ...prev])
        }

        // Play sound if enabled
        if (cameraSettings.soundEnabled) {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
          audio.play().catch(() => {})
        }

        toast({
          title: "Location identified!",
          description: data.name || "Location found",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Recognition failed"
      setResult({ success: false, error: errorMessage, id: Date.now().toString(), timestamp: Date.now() })
      toast({
        title: "Recognition failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setProcessingStep("")
      setProcessingProgress(0)
    }
  }, [toast, cameraSettings])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', 
          width: { ideal: cameraSettings.highQuality ? 1920 : 1280 }, 
          height: { ideal: cameraSettings.highQuality ? 1080 : 720 } 
        },
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
    }
  }, [toast, cameraSettings.highQuality])

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
          if (!batchMode) stopCamera()
        }
      }, "image/jpeg", cameraSettings.highQuality ? 0.95 : 0.8)
    }
  }, [batchMode, cameraSettings.highQuality])

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
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    processImage(file)
  }, [processImage])

  const reset = useCallback(() => {
    setResult(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setIsProcessing(false)
    setActiveTab("camera")
    stopCamera()
    setBatchResults([])
  }, [previewUrl, stopCamera])

  const addToFavorites = useCallback((item: RecognitionResult) => {
    if (!favorites.find(f => f.id === item.id)) {
      setFavorites(prev => [item, ...prev])
      toast({ title: "Added to favorites" })
    }
  }, [favorites, toast])

  const removeFromFavorites = useCallback((id: string) => {
    setFavorites(prev => prev.filter(f => f.id !== id))
    toast({ title: "Removed from favorites" })
  }, [toast])

  const clearHistory = useCallback(() => {
    setHistory([])
    toast({ title: "History cleared" })
  }, [toast])

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

  const filteredHistory = history.filter(item => {
    const matchesSearch = !searchQuery || 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === "all" || item.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const filteredFavorites = favorites.filter(item => {
    const matchesSearch = !searchQuery || 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 px-4">
      {/* Enhanced Header with Stats */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Camera Scanner
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">Enhanced location recognition with smart features</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="text-xs sm:text-sm"
            >
              <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBatchMode(!batchMode)}
              className={`text-xs sm:text-sm ${batchMode ? "bg-blue-50 border-blue-200 dark:bg-blue-950" : ""}`}
            >
              <Grid className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Batch
            </Button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Scans</p>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalScans}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">Success Rate</p>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100">{stats.successRate.toFixed(0)}%</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">Favorites</p>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-red-900 dark:text-red-100">{stats.favoriteCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Last Scan</p>
              </div>
              <p className="text-xs sm:text-sm font-bold text-purple-900 dark:text-purple-100">
                {stats.lastScanTime ? new Date(stats.lastScanTime).toLocaleDateString() : 'Never'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border-0 shadow-xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base sm:text-lg">Camera Settings</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <label className="text-sm font-medium">High Quality</label>
                </div>
                <Switch
                  checked={cameraSettings.highQuality}
                  onCheckedChange={(checked) => 
                    setCameraSettings(prev => ({ ...prev, highQuality: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <label className="text-sm font-medium">Sound Effects</label>
                </div>
                <Switch
                  checked={cameraSettings.soundEnabled}
                  onCheckedChange={(checked) => 
                    setCameraSettings(prev => ({ ...prev, soundEnabled: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <label className="text-sm font-medium">Auto Save</label>
                </div>
                <Switch
                  checked={cameraSettings.autoSave}
                  onCheckedChange={(checked) => 
                    setCameraSettings(prev => ({ ...prev, autoSave: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <label className="text-sm font-medium">GPS Enabled</label>
                </div>
                <Switch
                  checked={cameraSettings.gpsEnabled}
                  onCheckedChange={(checked) => 
                    setCameraSettings(prev => ({ ...prev, gpsEnabled: checked }))
                  }
                />
              </div>
            </div>
            <Separator className="my-4" />
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Quick Actions</h4>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  setHistory([])
                  setFavorites([])
                  toast({ title: "All data cleared" })
                }}>
                  <Trash2 className="h-3 w-3 mr-2" />
                  Clear All Data
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  const data = JSON.stringify({ history, favorites, settings: cameraSettings })
                  const blob = new Blob([data], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `camera-data-${Date.now()}.json`
                  a.click()
                  toast({ title: "Data exported" })
                }}>
                  <Download className="h-3 w-3 mr-2" />
                  Export Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
          <TabsTrigger value="camera" className="text-xs sm:text-sm">
            <Camera className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Camera</span>
            <span className="sm:hidden">Scan</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm">
            <History className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">History</span>
            <span className="sm:hidden">({history.length})</span>
            <span className="hidden sm:inline"> ({history.length})</span>
          </TabsTrigger>
          <TabsTrigger value="favorites" className="text-xs sm:text-sm">
            <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Favorites</span>
            <span className="sm:hidden">({favorites.length})</span>
            <span className="hidden sm:inline"> ({favorites.length})</span>
          </TabsTrigger>
          <TabsTrigger value="batch" className="text-xs sm:text-sm">
            <Grid className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Batch</span>
            <span className="sm:hidden">({batchResults.length})</span>
            <span className="hidden sm:inline"> ({batchResults.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Camera Tab */}
        <TabsContent value="camera" className="space-y-6">
          <Card className="overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur border-0 shadow-2xl">
            <CardContent className="p-0">
              <div className="relative bg-black" style={{ aspectRatio: '16/9', minHeight: '250px' }}>
                {/* Camera View */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                  style={{ display: cameraActive ? 'block' : 'none' }}
                />
                
                {/* Preview Image with Tools */}
                {previewUrl && !cameraActive && (
                  <div className="relative w-full h-full">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover transition-transform duration-200" 
                      style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
                    />
                    {showImageTools && (
                      <div className="absolute top-2 right-2 flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white/90 backdrop-blur"
                          onClick={() => setZoom(Math.min(zoom + 0.2, 3))}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white/90 backdrop-blur"
                          onClick={() => setZoom(Math.max(zoom - 0.2, 0.5))}
                        >
                          <ZoomIn className="h-4 w-4 rotate-180" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white/90 backdrop-blur"
                          onClick={() => setRotation((rotation + 90) % 360)}
                        >
                          <RotateCw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white/90 backdrop-blur"
                          onClick={() => {
                            setZoom(1)
                            setRotation(0)
                          }}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute bottom-2 right-2 bg-white/90 backdrop-blur"
                      onClick={() => setShowImageTools(!showImageTools)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {/* Processing Overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-purple-600/90 backdrop-blur flex items-center justify-center p-4">
                    <div className="text-center text-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 max-w-sm w-full">
                      <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin mx-auto mb-3 sm:mb-4" />
                      <p className="text-base sm:text-lg font-semibold mb-2">AI Processing</p>
                      <p className="text-xs sm:text-sm opacity-90 mb-3 sm:mb-4">{processingStep}</p>
                      <Progress value={processingProgress} className="w-full h-2" />
                      <p className="text-xs mt-2 opacity-75">{processingProgress}%</p>
                    </div>
                  </div>
                )}
                
                {/* Enhanced Camera Controls */}
                {cameraActive && !isProcessing && (
                  <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 sm:gap-4">
                    <Button onClick={stopCamera} variant="outline" size="icon" className="rounded-full w-10 h-10 sm:w-12 sm:h-12 bg-white/90 backdrop-blur">
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => setCameraSettings(prev => ({ ...prev, flashEnabled: !prev.flashEnabled }))}
                      variant="outline"
                      size="icon"
                      className="rounded-full w-10 h-10 sm:w-12 sm:h-12 bg-white/90 backdrop-blur hidden sm:flex"
                    >
                      {cameraSettings.flashEnabled ? <Flash className="h-4 w-4" /> : <FlashOff className="h-4 w-4" />}
                    </Button>
                    <Button onClick={capturePhoto} size="lg" className="rounded-full w-14 h-14 sm:w-16 sm:h-16 bg-white border-4 border-white/60 shadow-xl hover:scale-105 transition-transform">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-500" />
                    </Button>
                    <Button
                      onClick={() => setCameraSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                      variant="outline"
                      size="icon"
                      className="rounded-full w-10 h-10 sm:w-12 sm:h-12 bg-white/90 backdrop-blur hidden sm:flex"
                    >
                      {cameraSettings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </Button>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      size="icon"
                      className="rounded-full w-10 h-10 sm:w-12 sm:h-12 bg-white/90 backdrop-blur"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {/* Empty State */}
                {!cameraActive && !previewUrl && !isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                    <div className="text-center p-4 sm:p-8">
                      <Camera className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-slate-400 mb-3 sm:mb-4" />
                      <h3 className="text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Enhanced AI Scanner</h3>
                      <p className="text-sm sm:text-base text-slate-500 mb-4 sm:mb-6 px-4">Capture or upload images with advanced features</p>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center px-4">
                        <Button onClick={startCamera} className="bg-gradient-to-r from-blue-600 to-purple-600 w-full sm:w-auto">
                          <Camera className="h-4 w-4 mr-2" />
                          Start Camera
                        </Button>
                        <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full sm:w-auto">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Photo
                        </Button>
                      </div>
                      <div className="mt-6 grid grid-cols-2 gap-3 max-w-xs mx-auto">
                        <div className="p-3 bg-white/50 dark:bg-slate-700/50 rounded-lg">
                          <Zap className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                          <p className="text-xs font-medium">Fast AI</p>
                        </div>
                        <div className="p-3 bg-white/50 dark:bg-slate-700/50 rounded-lg">
                          <Compass className="h-5 w-5 mx-auto text-green-600 mb-1" />
                          <p className="text-xs font-medium">GPS Data</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Quick Actions Bar */}
              {!isProcessing && (
                <div className="p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-t">
                  <div className="flex flex-wrap gap-1 sm:gap-2 justify-center">
                    <Button onClick={startCamera} variant="ghost" size="sm" className="text-xs sm:text-sm">
                      <Camera className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Camera</span>
                    </Button>
                    <Button onClick={() => fileInputRef.current?.click()} variant="ghost" size="sm" className="text-xs sm:text-sm">
                      <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Upload</span>
                    </Button>
                    {result && (
                      <>
                        <Button onClick={() => shareLocation(result)} variant="ghost" size="sm" className="text-xs sm:text-sm">
                          <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Share</span>
                        </Button>
                        <Button onClick={() => addToFavorites(result)} variant="ghost" size="sm" className="text-xs sm:text-sm">
                          <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Favorite</span>
                        </Button>
                        <Button onClick={reset} variant="ghost" size="sm" className="text-xs sm:text-sm">
                          <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Reset</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Display */}
          {result && (
            <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border-0 shadow-xl">
              <CardContent className="p-4 sm:p-6">
                {result.success ? (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                      <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0 w-full">
                        <h3 className="font-bold text-xl sm:text-2xl mb-2 break-words">{result.name || "Location Found"}</h3>
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-3 break-words">{result.address}</p>
                        <div className="flex flex-wrap gap-2">
                          {result.category && (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                              {result.category}
                            </Badge>
                          )}
                          {result.confidence && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                              {Math.round(result.confidence * 100)}% confident
                            </Badge>
                          )}
                          {result.rating && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 text-xs">
                              ⭐ {result.rating}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button onClick={() => shareLocation(result)} size="sm" variant="outline" className="flex-1 sm:flex-none">
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => addToFavorites(result)} size="sm" variant="outline" className="flex-1 sm:flex-none">
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                      {result.location && (
                        <Button asChild className="h-auto p-3 sm:p-4 bg-gradient-to-r from-emerald-600 to-teal-600 w-full">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${result.location.latitude},${result.location.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center"
                          >
                            <Navigation className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                            <div className="text-left">
                              <div className="font-semibold text-sm sm:text-base">Get Directions</div>
                              <div className="text-xs opacity-90">Open in Maps</div>
                            </div>
                          </a>
                        </Button>
                      )}
                      
                      {result.website && (
                        <Button asChild variant="outline" className="h-auto p-3 sm:p-4 w-full">
                          <a href={result.website} target="_blank" rel="noopener noreferrer" className="flex items-center">
                            <Eye className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                            <div className="text-left">
                              <div className="font-semibold text-sm sm:text-base">Visit Website</div>
                              <div className="text-xs opacity-70">Learn more</div>
                            </div>
                          </a>
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => {
                          if (result.location) {
                            navigator.clipboard.writeText(`${result.location.latitude}, ${result.location.longitude}`)
                            toast({ title: "Coordinates copied" })
                          }
                        }}
                        variant="outline"
                        className="h-auto p-3 sm:p-4 w-full"
                      >
                        <Copy className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                        <div className="text-left">
                          <div className="font-semibold text-sm sm:text-base">Copy Location</div>
                          <div className="text-xs opacity-70">GPS coordinates</div>
                        </div>
                      </Button>
                    </div>

                    {/* Additional Info Section */}
                    {(result.weather || result.nearbyPlaces) && (
                      <div className="space-y-3">
                        <Separator />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {result.weather && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Info className="h-4 w-4 text-blue-600" />
                                <h4 className="font-semibold text-sm">Weather</h4>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {result.weather.temperature}°C, {result.weather.description}
                              </p>
                            </div>
                          )}
                          {result.nearbyPlaces && result.nearbyPlaces.length > 0 && (
                            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <MapPin className="h-4 w-4 text-purple-600" />
                                <h4 className="font-semibold text-sm">Nearby</h4>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {result.nearbyPlaces.length} places within 500m
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-red-500 flex items-center justify-center">
                        <X className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">Recognition Failed</h3>
                        <p className="text-red-600 dark:text-red-300 mb-4">{result.error}</p>
                        <Button onClick={reset} variant="outline" size="sm">Try Again</Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4 sm:space-y-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Input
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-sm"
              />
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-40 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Location">Location</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                className="text-xs sm:text-sm"
              >
                {viewMode === "grid" ? <List className="h-3 w-3 sm:h-4 sm:w-4" /> : <Grid className="h-3 w-3 sm:h-4 sm:w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={clearHistory} className="text-xs sm:text-sm">
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Clear
              </Button>
            </div>
          </div>

          <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" : "space-y-3 sm:space-y-4"}>
            {filteredHistory.map((item) => (
              <Card key={item.id} className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm sm:text-base truncate">{item.name || "Unknown Location"}</h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">{item.address}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(item.timestamp || 0).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => addToFavorites(item)}
                        className="h-8 w-8 p-0"
                      >
                        <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => shareLocation(item)}
                        className="h-8 w-8 p-0"
                      >
                        <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredHistory.length === 0 && (
            <div className="text-center py-8 sm:py-12 px-4">
              <History className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-slate-400 mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">No History Found</h3>
              <p className="text-sm sm:text-base text-slate-500">Start scanning locations to build your history</p>
            </div>
          )}
        </TabsContent>

        {/* Favorites Tab */}
        <TabsContent value="favorites" className="space-y-4 sm:space-y-6">
          <div className="flex gap-2">
            <Input
              placeholder="Search favorites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredFavorites.map((item) => (
              <Card key={item.id} className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm sm:text-base truncate">{item.name || "Unknown Location"}</h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">{item.address}</p>
                      {item.rating && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 text-amber-500" />
                          <span className="text-xs">{item.rating}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromFavorites(item.id!)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => shareLocation(item)}
                        className="h-8 w-8 p-0"
                      >
                        <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredFavorites.length === 0 && (
            <div className="text-center py-8 sm:py-12 px-4">
              <Heart className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-slate-400 mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">No Favorites Yet</h3>
              <p className="text-sm sm:text-base text-slate-500">Add locations to your favorites for quick access</p>
            </div>
          )}
        </TabsContent>

        {/* Batch Tab */}
        <TabsContent value="batch" className="space-y-4 sm:space-y-6">
          <div className="text-center py-8 sm:py-12 px-4">
            <Grid className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-slate-400 mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">Batch Processing</h3>
            <p className="text-sm sm:text-base text-slate-500 mb-4">Process multiple images at once</p>
            <Button onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto">
              <Upload className="h-4 w-4 mr-2" />
              Select Multiple Images
            </Button>
          </div>
          
          {batchResults.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm sm:text-base">Batch Results ({batchResults.length})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {batchResults.map((item, index) => (
                  <Card key={index} className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border-0 shadow-lg">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-sm truncate">{item.name || "Unknown"}</h5>
                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{item.address}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={batchMode}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || [])
          if (batchMode && files.length > 1) {
            // Handle batch processing
            files.forEach(file => handleFileSelect(file))
          } else if (files[0]) {
            handleFileSelect(files[0])
          }
        }}
      />
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}