"use client"

import { useState, useRef, useCallback } from "react"
import { Camera, Upload, X, MapPin, Loader2, Search, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { InteractiveGlobe } from "@/components/ui/interactive-globe"
import { ResultFeedback } from "@/components/result-feedback"

interface Location {
  latitude: number
  longitude: number
}

interface NearbyPlace {
  name: string
  type: string
  distance: number
}

interface RecognitionResult {
  success: boolean
  name?: string
  address?: string
  location?: Location
  confidence?: number
  error?: string
  nearbyPlaces?: NearbyPlace[]
  weather?: any
  elevation?: any
  transit?: any[]
  enhancedAnalysis?: any
  recognitionId?: string
}

export function CameraRedesignedV2() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<RecognitionResult | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  const processImage = useCallback(async (file: File) => {
    setIsProcessing(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("image", file)
      
      const response = await fetch('/api/location-recognition-v2', {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error(`API error: ${response.status}`)

      const data = await response.json()
      setResult(data)
      
      if (data.success && data.location) {
        toast({
          title: "Location Found!",
          description: data.name || "Location identified",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Recognition failed"
      setResult({ success: false, error: errorMessage })
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }, [toast])

  const handleFileSelect = useCallback((file: File) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreviewImage(url)
    processImage(file)
  }, [processImage])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
        await videoRef.current.play()
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Could not access camera",
        variant: "destructive",
      })
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

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const context = canvas.getContext("2d")
    if (!context) return

    context.drawImage(video, 0, 0)
    
    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" })
      handleFileSelect(file)
      stopCamera()
    }, "image/jpeg", 0.95)
  }, [handleFileSelect, stopCamera])

  const fetchSuggestions = useCallback(async (input: string) => {
    if (!input.trim() || input.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    
    try {
      const response = await fetch(`/api/places-autocomplete?input=${encodeURIComponent(input)}`)
      const data = await response.json()
      
      if (data.predictions) {
        setSuggestions(data.predictions.slice(0, 5))
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('Autocomplete error:', error)
    }
  }, [])

  const handleSearch = useCallback(async (query?: string) => {
    const searchText = query || searchQuery
    if (!searchText.trim()) return
    
    setIsProcessing(true)
    setShowSuggestions(false)
    
    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(searchText)}`)
      const data = await response.json()
      
      if (data.location && data.formatted_address) {
        setResult({
          success: true,
          name: data.formatted_address,
          address: data.formatted_address,
          location: { latitude: data.location.lat, longitude: data.location.lng },
          confidence: 1
        })
        setPreviewImage(null)
        toast({
          title: "Location Found",
          description: data.formatted_address,
        })
      } else {
        toast({
          title: "Not Found",
          description: data.error || "Could not find this location",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Failed to search location",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }, [searchQuery, toast])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-10 sm:h-12 w-auto" />
          </a>
          <button 
            onClick={() => {
              setResult(null)
              setPreviewImage(null)
            }}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            New Search
          </button>
        </div>
      </nav>

      {/* Camera View */}
      {cameraActive && (
        <div className="fixed inset-0 z-50 bg-black">
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6">
            <button 
              onClick={stopCamera}
              className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-all"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <button 
              onClick={capturePhoto}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-white/50 hover:scale-105 transition-transform"
            >
              <div className="w-16 h-16 bg-white rounded-full"></div>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        {/* Hero Section */}
        {!previewImage && !isProcessing && !result && (
          <div className="space-y-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Content */}
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">AI-Powered Location Intelligence</span>
                </div>
                
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 leading-tight">
                  Discover any location instantly
                </h1>
                
                <p className="text-xl text-slate-600 leading-relaxed">
                  Upload photos, search addresses, or use GPS coordinates to unlock detailed location insights worldwide.
                </p>
                
                {/* Search Bar */}
                <div className="relative">
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="Search address, place, or coordinates..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        fetchSuggestions(e.target.value)
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      className="w-full bg-white border-2 border-slate-200 text-slate-900 px-6 py-4 pr-14 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all rounded-2xl shadow-sm group-hover:shadow-md"
                    />
                    <button
                      onClick={() => handleSearch()}
                      disabled={isProcessing}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-3 hover:bg-blue-700 transition-colors disabled:opacity-50 rounded-xl"
                    >
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Autocomplete */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border-2 border-slate-200 mt-2 z-50 shadow-xl rounded-2xl overflow-hidden">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion.place_id}
                          onClick={() => {
                            setSearchQuery(suggestion.description)
                            setShowSuggestions(false)
                            handleSearch(suggestion.description)
                          }}
                          className="w-full text-left px-6 py-4 text-slate-900 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 flex items-start gap-3"
                        >
                          <MapPin className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                          <span className="text-sm">{suggestion.description}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Upload Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="flex-1 bg-slate-900 text-white px-8 py-4 font-semibold hover:bg-slate-800 transition-all rounded-2xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    {isProcessing ? 'Processing...' : 'Upload Image'}
                  </button>
                  <button
                    onClick={startCamera}
                    disabled={isProcessing || cameraActive}
                    className="flex-1 bg-white border-2 border-slate-200 text-slate-900 px-8 py-4 font-semibold hover:bg-slate-50 transition-all rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:shadow-md disabled:opacity-50"
                  >
                    {cameraActive ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                    {cameraActive ? 'Opening...' : 'Take Photo'}
                  </button>
                </div>
              </div>

              {/* Right: Globe */}
              <div className="relative h-[400px] lg:h-[600px]">
                <InteractiveGlobe />
              </div>
            </div>
            
            {/* Features */}
            <div className="grid sm:grid-cols-3 gap-8">
              {[
                { icon: MapPin, title: 'GPS Extraction', desc: 'Extract precise coordinates from photo EXIF data', color: 'bg-blue-500' },
                { icon: Search, title: 'AI Recognition', desc: 'Identify landmarks using computer vision', color: 'bg-purple-500' },
                { icon: Sparkles, title: 'Global Coverage', desc: 'Search locations across 195 countries', color: 'bg-emerald-500' }
              ].map((feature, i) => (
                <div key={i} className="group p-6 bg-white rounded-2xl border border-slate-200 hover:shadow-lg transition-all">
                  <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Processing */}
        {isProcessing && !result && (
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Analyzing location</h3>
            <p className="text-slate-600">Please wait while we identify the location</p>
          </div>
        )}

        {/* Result */}
        {result && result.success && (
          <div className="space-y-8">
            {/* Header */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div className="flex-1">
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">{result.name}</h2>
                  <p className="text-lg text-slate-600">{result.address}</p>
                </div>
                {result.confidence && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm font-bold text-emerald-700">{Math.round(result.confidence * 100)}% Match</span>
                  </div>
                )}
              </div>
              
              <ResultFeedback recognitionId={result.recognitionId} address={result.address} />
              
              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  onClick={() => {
                    if (result.location) {
                      window.open(`https://www.google.com/maps/search/?api=1&query=${result.location.latitude},${result.location.longitude}`, '_blank')
                    }
                  }}
                  className="bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors font-semibold flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  Open in Maps
                </button>
                <button
                  onClick={() => {
                    setResult(null)
                    setPreviewImage(null)
                  }}
                  className="bg-white border-2 border-slate-200 text-slate-900 px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors font-semibold"
                >
                  New Search
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Map & Image */}
              <div className="lg:col-span-2 space-y-6">
                {result.location && (
                  <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-lg">
                    <iframe
                      src={`https://www.google.com/maps?q=${result.location.latitude},${result.location.longitude}&output=embed`}
                      className="w-full h-[400px] lg:h-[500px] border-0"
                      loading="lazy"
                    />
                  </div>
                )}
                
                {previewImage && (
                  <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-lg">
                    <img src={previewImage} alt="Preview" className="w-full h-[300px] object-cover" />
                  </div>
                )}
              </div>

              {/* Info Cards */}
              <div className="space-y-6">
                {result.location && (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-6 border border-blue-200">
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      Coordinates
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Latitude</p>
                        <p className="text-lg font-mono font-bold text-slate-900">{result.location.latitude.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Longitude</p>
                        <p className="text-lg font-mono font-bold text-slate-900">{result.location.longitude.toFixed(6)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {result.weather && (
                  <div className="bg-white rounded-3xl border border-slate-200 p-6">
                    <h4 className="font-bold text-slate-900 mb-4">Weather</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-4xl font-black text-slate-900">{result.weather.temperature}°</p>
                        <p className="text-sm text-slate-600">Celsius</p>
                      </div>
                      {result.weather.humidity && (
                        <div className="text-right">
                          <p className="text-3xl font-black text-slate-900">{result.weather.humidity}%</p>
                          <p className="text-sm text-slate-600">Humidity</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {result.nearbyPlaces && result.nearbyPlaces.length > 0 && (
                  <div className="bg-white rounded-3xl border border-slate-200 p-6">
                    <h4 className="font-bold text-slate-900 mb-4">Nearby Places</h4>
                    <div className="space-y-3">
                      {result.nearbyPlaces.slice(0, 5).map((place, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">{place.name}</p>
                            <p className="text-xs text-slate-500">{place.type}</p>
                          </div>
                          <span className="text-xs text-slate-600 font-bold">{place.distance}m</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {result && !result.success && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-lg">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-3">Location not found</h3>
              <p className="text-lg text-slate-600 mb-8">{result.error || "Unable to identify this location"}</p>
              <button
                onClick={() => {
                  setResult(null)
                  setPreviewImage(null)
                }}
                className="bg-slate-900 text-white px-8 py-4 hover:bg-slate-800 transition-colors rounded-2xl font-semibold"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      <input 
        ref={fileInputRef} 
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={(e) => { 
          const file = e.target.files?.[0]; 
          if (file) handleFileSelect(file) 
        }} 
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
