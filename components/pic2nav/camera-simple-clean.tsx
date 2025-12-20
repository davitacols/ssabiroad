"use client"

import { useState, useRef, useCallback } from "react"
import { Camera, Upload, X, MapPin, Loader2, Search, Menu, Share2, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Location {
  latitude: number
  longitude: number
}

interface NearbyPlace {
  name: string
  type: string
  distance: number
  placeId?: string
  photoReference?: string
}

interface RecognitionResult {
  success: boolean
  name?: string
  address?: string
  location?: Location
  confidence?: number
  error?: string
  nearbyPlaces?: NearbyPlace[]
  photos?: string[]
  deviceAnalysis?: any
  weather?: any
  locationDetails?: any
  elevation?: any
  transit?: any[]
  demographics?: any
  historicalData?: any
  enhancedAnalysis?: any
}

export function CameraSimple() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<RecognitionResult | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const [currentFile, setCurrentFile] = useState<File | null>(null)

  const processImage = useCallback(async (file: File) => {
    setIsProcessing(true)
    setResult(null)
    setCurrentFile(file)

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
    
    setIsSearching(true)
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
      setIsSearching(false)
    }
  }, [searchQuery, toast])

  const selectSuggestion = useCallback((suggestion: any) => {
    setSearchQuery(suggestion.description)
    setShowSuggestions(false)
    handleSearch(suggestion.description)
  }, [handleSearch])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 group">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-12 sm:h-14 md:h-16 w-auto object-contain drop-shadow-lg" />
          </a>
          <div className="flex items-center gap-2 sm:gap-4">
            <a href="/api-access" className="hidden md:inline-flex px-4 py-2 text-sm text-stone-600 hover:text-stone-900 transition-colors">API</a>
            <button 
              onClick={() => {
                setResult(null)
                setPreviewImage(null)
              }}
              className="bg-stone-900 hover:bg-stone-800 text-white text-sm px-4 py-2 rounded-md"
            >
              New Search
            </button>
          </div>
        </div>
      </nav>

      {/* Camera View */}
      {cameraActive && (
        <div className="fixed inset-0 z-50 bg-black">
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6">
            <button 
              onClick={stopCamera}
              className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <button 
              onClick={capturePhoto}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-gray-800"
            >
              <div className="w-16 h-16 bg-white rounded-full"></div>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Hero Section */}
        {!previewImage && !isProcessing && !result && (
          <div>
            <div className="max-w-4xl mx-auto text-center mb-8 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-stone-900 mb-4 sm:mb-6 leading-tight px-4">Discover locations through images</h2>
              <p className="text-base sm:text-lg md:text-xl text-stone-600 mb-8 sm:mb-12 px-4">Upload photos, search by address, or use GPS coordinates to find any location</p>
              
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto mb-8 sm:mb-12 relative px-4">
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search by address, postcode, or coordinates..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      fetchSuggestions(e.target.value)
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    className="w-full bg-white border border-stone-300 text-stone-900 px-4 sm:px-6 py-3 sm:py-4 pr-12 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors rounded-md"
                  />
                  <button
                    onClick={() => handleSearch()}
                    disabled={isSearching}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-stone-900 text-white p-2 hover:bg-stone-800 transition-colors disabled:opacity-50 rounded-md"
                  >
                    {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Autocomplete Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-stone-300 mt-1 z-50 shadow-lg rounded-md">
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={suggestion.place_id}
                        onClick={() => selectSuggestion(suggestion)}
                        className="w-full text-left px-6 py-3 text-stone-900 hover:bg-stone-50 transition-colors border-b border-stone-200 last:border-b-0"
                      >
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-stone-500 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm">{suggestion.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                <p className="text-sm text-stone-500 mt-3 text-left">Try: "New York", "SW1A 1AA", "10001", or "51.5074, -0.1278"</p>
              </div>
            </div>
            
            {/* Upload Section */}
            <div className="max-w-4xl mx-auto mb-12 sm:mb-20 px-4">
              <div className="bg-stone-50 border-2 border-dashed border-stone-300 p-8 sm:p-12 lg:p-20 text-center hover:border-stone-400 transition-colors rounded-md">
                <MapPin className="w-16 h-16 text-stone-400 mx-auto mb-6" />
                <h3 className="text-xl sm:text-2xl font-semibold text-stone-900 mb-6 sm:mb-8">Or upload an image</h3>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto bg-stone-900 text-white px-6 sm:px-10 py-3 sm:py-4 font-medium hover:bg-stone-800 transition-colors rounded-md text-sm sm:text-base"
                  >
                    Choose file
                  </button>
                  <span className="text-stone-500 text-sm sm:text-base">or</span>
                  <button
                    onClick={startCamera}
                    className="w-full sm:w-auto border border-stone-300 text-stone-900 px-6 sm:px-10 py-3 sm:py-4 font-medium hover:bg-stone-50 transition-colors flex items-center justify-center gap-2 rounded-md text-sm sm:text-base"
                  >
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                    Take photo
                  </button>
                </div>
              </div>
            </div>
            
            {/* Features Grid */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-20 px-4">
              <div className="border-t border-stone-200 pt-4 sm:pt-6">
                <h3 className="text-lg sm:text-xl font-semibold text-stone-900 mb-2 sm:mb-3">Image Recognition</h3>
                <p className="text-sm sm:text-base text-stone-600">Upload any photo and our AI will identify the location, landmarks, and points of interest</p>
              </div>
              <div className="border-t border-stone-200 pt-4 sm:pt-6">
                <h3 className="text-lg sm:text-xl font-semibold text-stone-900 mb-2 sm:mb-3">Text Search</h3>
                <p className="text-sm sm:text-base text-stone-600">Search using addresses, postcodes, zip codes, or GPS coordinates from anywhere in the world</p>
              </div>
              <div className="border-t border-stone-200 pt-4 sm:pt-6">
                <h3 className="text-lg sm:text-xl font-semibold text-stone-900 mb-2 sm:mb-3">Instant Results</h3>
                <p className="text-sm sm:text-base text-stone-600">Get detailed location information, coordinates, and direct links to view on maps</p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="max-w-6xl mx-auto border-t border-stone-200 pt-8 sm:pt-12 px-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center">
                <div>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 mb-1 sm:mb-2">1M+</p>
                  <p className="text-xs sm:text-sm text-stone-500">Locations identified</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 mb-1 sm:mb-2">195</p>
                  <p className="text-xs sm:text-sm text-stone-500">Countries covered</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 mb-1 sm:mb-2">99%</p>
                  <p className="text-xs sm:text-sm text-stone-500">Accuracy rate</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 mb-1 sm:mb-2">24/7</p>
                  <p className="text-xs sm:text-sm text-stone-500">Always available</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing */}
        {(isProcessing || isSearching) && (
          <div className="max-w-2xl mx-auto text-center py-12 sm:py-20 px-4">
            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-stone-900 animate-spin mx-auto mb-4 sm:mb-6" />
            <h3 className="text-xl sm:text-2xl font-semibold text-stone-900 mb-2">{isSearching ? 'Searching location' : 'Analyzing image'}</h3>
            <p className="text-sm sm:text-base text-stone-600">Please wait while we identify the location</p>
          </div>
        )}

        {/* Result */}
        {result && result.success && (
          <div className="max-w-7xl mx-auto">
            {/* Success Banner */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900">Location Found</h3>
                <p className="text-sm text-green-700">{result.name}</p>
              </div>
              {result.confidence && (
                <div className="text-right">
                  <p className="text-xs text-green-600">Confidence</p>
                  <p className="text-lg font-bold text-green-700">{Math.round(result.confidence * 100)}%</p>
                </div>
              )}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Image & Map */}
              <div className="lg:col-span-2 space-y-6">
                {previewImage && (
                  <div className="bg-white rounded-lg overflow-hidden border border-stone-200 shadow-sm">
                    <img src={previewImage} alt="Preview" className="w-full h-[300px] sm:h-[400px] lg:h-[500px] object-contain bg-stone-50" />
                  </div>
                )}
                
                {result.location && (
                  <div className="bg-white rounded-lg overflow-hidden border border-stone-200 shadow-sm">
                    <div className="bg-stone-50 px-4 py-3 border-b border-stone-200 flex items-center justify-between">
                      <h4 className="font-semibold text-stone-900 text-sm">Map View</h4>
                      <button
                        onClick={() => {
                          const { latitude, longitude } = result.location!
                          navigator.clipboard.writeText(`${latitude}, ${longitude}`)
                          toast({ title: "Coordinates copied!" })
                        }}
                        className="text-xs text-stone-600 hover:text-stone-900 transition-colors"
                      >
                        Copy coordinates
                      </button>
                    </div>
                    <iframe
                      src={`https://www.google.com/maps?q=${result.location.latitude},${result.location.longitude}&output=embed`}
                      className="w-full h-[300px] sm:h-[350px] lg:h-[450px] border-0"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      if (result.location) {
                        window.open(`https://www.google.com/maps/search/?api=1&query=${result.location.latitude},${result.location.longitude}`, '_blank')
                      }
                    }}
                    className="bg-stone-900 text-white px-4 py-3 rounded-lg hover:bg-stone-800 transition-colors text-sm font-medium"
                  >
                    Open in Maps
                  </button>
                  <button
                    onClick={() => {
                      if (result.location) {
                        const text = `${result.name}\n${result.address}\n${result.location.latitude}, ${result.location.longitude}`
                        navigator.clipboard.writeText(text)
                        toast({ title: "Location details copied!" })
                      }
                    }}
                    className="bg-white border border-stone-300 text-stone-900 px-4 py-3 rounded-lg hover:bg-stone-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <button
                    onClick={() => {
                      setResult(null)
                      setPreviewImage(null)
                      setCurrentFile(null)
                    }}
                    className="bg-white border border-stone-300 text-stone-900 px-4 py-3 rounded-lg hover:bg-stone-50 transition-colors text-sm font-medium"
                  >
                    New Search
                  </button>
                </div>
              </div>

              {/* Right Column - Info */}
              <div className="space-y-4">
                {/* Location Details */}
                <div className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
                  <div className="bg-stone-50 px-4 py-3 border-b border-stone-200">
                    <h4 className="font-semibold text-stone-900 text-sm">Location Details</h4>
                  </div>
                  <div className="p-4 space-y-3">
                    {result.address && (
                      <div>
                        <p className="text-xs text-stone-500 mb-1">Address</p>
                        <p className="text-sm text-stone-900">{result.address}</p>
                      </div>
                    )}
                    {result.location && (
                      <div>
                        <p className="text-xs text-stone-500 mb-1">Coordinates</p>
                        <p className="text-sm font-mono text-stone-900">{result.location.latitude.toFixed(6)}, {result.location.longitude.toFixed(6)}</p>
                      </div>
                    )}
                    {result.elevation && (
                      <div>
                        <p className="text-xs text-stone-500 mb-1">Elevation</p>
                        <p className="text-sm text-stone-900">{result.elevation.elevation}m above sea level</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Training */}
                {result.location && currentFile && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                        <h4 className="font-semibold text-blue-900 text-sm">Help Improve AI</h4>
                      </div>
                      <p className="text-xs text-blue-700 mb-3">Is this location correct?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            if (!currentFile || !result.location || !result.address) return
                            const formData = new FormData()
                            formData.append('file', currentFile)
                            formData.append('latitude', result.location.latitude.toString())
                            formData.append('longitude', result.location.longitude.toString())
                            formData.append('address', result.address)
                            formData.append('userId', 'anonymous')
                            await fetch('/api/location-recognition-v2/feedback', { method: 'POST', body: formData })
                            toast({ title: "✅ Thanks! AI improved" })
                          }}
                          className="flex-1 bg-green-600 text-white px-3 py-2 text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                          ✓ Correct
                        </button>
                        <button
                          onClick={() => {
                            const correction = prompt('Enter correct address:')
                            if (correction && currentFile && result.location) {
                              const formData = new FormData()
                              formData.append('file', currentFile)
                              formData.append('latitude', result.location.latitude.toString())
                              formData.append('longitude', result.location.longitude.toString())
                              formData.append('address', correction)
                              formData.append('userId', 'anonymous')
                              fetch('/api/location-recognition-v2/feedback', { method: 'POST', body: formData })
                                .then(() => toast({ title: "✅ Correction submitted!" }))
                            }
                          }}
                          className="flex-1 bg-orange-600 text-white px-3 py-2 text-xs font-medium rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          ✗ Fix it
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Weather */}
                {result.weather && (
                  <div className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
                    <div className="bg-stone-50 px-4 py-3 border-b border-stone-200">
                      <h4 className="font-semibold text-stone-900 text-sm">Current Weather</h4>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-3xl font-bold text-stone-900">{result.weather.temperature}°C</p>
                          <p className="text-xs text-stone-500">Temperature</p>
                        </div>
                        {result.weather.humidity && (
                          <div className="text-right">
                            <p className="text-2xl font-bold text-stone-900">{result.weather.humidity}%</p>
                            <p className="text-xs text-stone-500">Humidity</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Area Scores */}
                {result.enhancedAnalysis && (
                  <div className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
                    <div className="bg-stone-50 px-4 py-3 border-b border-stone-200">
                      <h4 className="font-semibold text-stone-900 text-sm">Area Scores</h4>
                    </div>
                    <div className="p-4 space-y-3">
                      {result.enhancedAnalysis.walkability && (
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-stone-600">Walkability</span>
                            <span className="text-sm font-bold text-stone-900">{result.enhancedAnalysis.walkability.score}/100</span>
                          </div>
                          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 transition-all" style={{width: `${result.enhancedAnalysis.walkability.score}%`}}></div>
                          </div>
                        </div>
                      )}
                      {result.enhancedAnalysis.bikeability && (
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-stone-600">Bikeability</span>
                            <span className="text-sm font-bold text-stone-900">{result.enhancedAnalysis.bikeability.score}/100</span>
                          </div>
                          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 transition-all" style={{width: `${result.enhancedAnalysis.bikeability.score}%`}}></div>
                          </div>
                        </div>
                      )}
                      {result.enhancedAnalysis.airQuality && (
                        <div className="flex justify-between items-center pt-2 border-t border-stone-100">
                          <span className="text-xs text-stone-600">Air Quality</span>
                          <span className="text-sm font-semibold text-stone-900">{result.enhancedAnalysis.airQuality.category}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Nearby Places */}
                {result.nearbyPlaces && result.nearbyPlaces.length > 0 && (
                  <div className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
                    <div className="bg-stone-50 px-4 py-3 border-b border-stone-200">
                      <h4 className="font-semibold text-stone-900 text-sm">Nearby Places</h4>
                    </div>
                    <div className="p-4 space-y-3">
                      {result.nearbyPlaces.slice(0, 5).map((place, idx) => (
                        <div key={idx} className="flex items-start gap-3 pb-3 border-b border-stone-100 last:border-0 last:pb-0">
                          <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4 text-stone-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-stone-900 truncate">{place.name}</p>
                            <p className="text-xs text-stone-500">{place.type}</p>
                          </div>
                          <span className="text-xs text-stone-600 font-medium">{place.distance}m</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transit */}
                {result.transit && result.transit.length > 0 && (
                  <div className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
                    <div className="bg-stone-50 px-4 py-3 border-b border-stone-200">
                      <h4 className="font-semibold text-stone-900 text-sm">Public Transit</h4>
                    </div>
                    <div className="p-4 space-y-2">
                      {result.transit.slice(0, 3).map((station, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <p className="text-stone-900 flex-1">{station.name}</p>
                          <span className="text-xs text-stone-600 font-medium">{station.distance}m</span>
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
          <div className="bg-white p-12 text-center rounded-md border border-stone-200">
            <h3 className="text-2xl font-semibold text-stone-900 mb-2">Location not found</h3>
            <p className="text-stone-600 mb-6">{result.error || "Unable to identify this location"}</p>
            <button
              onClick={() => {
                setResult(null)
                setPreviewImage(null)
              }}
              className="bg-stone-900 text-white px-6 py-2 hover:bg-stone-800 transition-colors rounded-md"
            >
              Try Again
            </button>
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
