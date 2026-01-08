"use client"

import { useState, useRef, useCallback } from "react"
import { Camera, Upload, X, MapPin, Loader2, Search, Menu, Share2, Heart, HelpCircle, Globe2 } from "lucide-react"
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
  recognitionId?: string
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
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
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
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Hero Section */}
        {!previewImage && !isProcessing && !result && (
          <div>
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
              {/* Left: Content */}
              <div className="space-y-6">
                <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-stone-900 leading-tight">Find any location on Earth</h2>
                <p className="text-xl text-stone-600 leading-relaxed">Upload images, search addresses, or drop GPS coordinates. Get instant intelligence on any location worldwide.</p>
                
                {/* Search Bar */}
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search address, postcode, or coordinates..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      fetchSuggestions(e.target.value)
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    className="w-full bg-white border-2 border-stone-300 text-stone-900 px-6 py-4 pr-14 text-base focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all rounded-xl"
                  />
                  <button
                    onClick={() => handleSearch()}
                    disabled={isSearching}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-stone-900 text-white p-3 hover:bg-stone-800 transition-colors disabled:opacity-50 rounded-lg"
                  >
                    {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  </button>
                  
                  {/* Autocomplete */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border-2 border-stone-300 mt-2 z-50 shadow-xl rounded-xl overflow-hidden">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion.place_id}
                          onClick={() => selectSuggestion(suggestion)}
                          className="w-full text-left px-6 py-4 text-stone-900 hover:bg-stone-50 transition-colors border-b border-stone-200 last:border-b-0 flex items-start gap-3"
                        >
                          <MapPin className="w-4 h-4 text-stone-500 mt-1 flex-shrink-0" />
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
                    className="flex-1 bg-stone-900 text-white px-8 py-4 font-semibold hover:bg-stone-800 transition-colors rounded-xl flex items-center justify-center gap-3 text-base"
                  >
                    <Upload className="w-5 h-5" />
                    Upload Image
                  </button>
                  <button
                    onClick={startCamera}
                    className="flex-1 border-2 border-stone-300 text-stone-900 px-8 py-4 font-semibold hover:bg-stone-50 transition-colors rounded-xl flex items-center justify-center gap-3 text-base"
                  >
                    <Camera className="w-5 h-5" />
                    Take Photo
                  </button>
                </div>
              </div>

              {/* Right: Globe */}
              <div className="relative h-[400px] lg:h-[500px]">
                <InteractiveGlobe />
              </div>
            </div>
            
            {/* Features */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {[
                { icon: MapPin, title: 'GPS Extraction', desc: 'Extract precise coordinates from any photo with EXIF data' },
                { icon: Globe2, title: 'Global Coverage', desc: 'Search and analyze locations across 195 countries' },
                { icon: Search, title: 'AI Recognition', desc: 'Identify landmarks and buildings using computer vision' }
              ].map((feature, i) => (
                <div key={i} className="group">
                  <div className="w-12 h-12 bg-stone-900 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 mb-2">{feature.title}</h3>
                  <p className="text-stone-600">{feature.desc}</p>
                </div>
              ))}
            </div>
            
            {/* Stats */}
            <div className="border-t border-stone-200 pt-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {[
                  { value: '1M+', label: 'Locations' },
                  { value: '195', label: 'Countries' },
                  { value: '99%', label: 'Accuracy' },
                  { value: '<2s', label: 'Response' }
                ].map((stat, i) => (
                  <div key={i}>
                    <p className="text-4xl font-black text-stone-900 mb-2">{stat.value}</p>
                    <p className="text-sm text-stone-500">{stat.label}</p>
                  </div>
                ))}
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
          <div className="max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-4xl font-black text-stone-900 mb-2">{result.name}</h2>
                  <p className="text-lg text-stone-600">{result.address}</p>
                </div>
                {result.confidence && (
                  <div className="text-right">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-bold text-green-700">{Math.round(result.confidence * 100)}% Match</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Feedback */}
              <div className="mb-4">
                <ResultFeedback recognitionId={result.recognitionId} address={result.address} />
              </div>
              
              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    if (result.location) {
                      window.open(`https://www.google.com/maps/search/?api=1&query=${result.location.latitude},${result.location.longitude}`, '_blank')
                    }
                  }}
                  className="bg-stone-900 text-white px-6 py-3 rounded-xl hover:bg-stone-800 transition-colors font-semibold flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  Open in Maps
                </button>
                <button
                  onClick={() => {
                    if (result.location) {
                      const text = `${result.name}\n${result.address}\n${result.location.latitude}, ${result.location.longitude}`
                      navigator.clipboard.writeText(text)
                      toast({ title: "Copied to clipboard" })
                    }
                  }}
                  className="border-2 border-stone-300 text-stone-900 px-6 py-3 rounded-xl hover:bg-stone-50 transition-colors font-semibold flex items-center gap-2"
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
                  className="border-2 border-stone-300 text-stone-900 px-6 py-3 rounded-xl hover:bg-stone-50 transition-colors font-semibold"
                >
                  New Search
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Map & Image */}
              <div className="lg:col-span-2 space-y-6">
                {result.location && (
                  <div className="bg-white rounded-2xl overflow-hidden border-2 border-stone-200 shadow-lg">
                    <iframe
                      src={`https://www.google.com/maps?q=${result.location.latitude},${result.location.longitude}&output=embed`}
                      className="w-full h-[400px] lg:h-[500px] border-0"
                      loading="lazy"
                    />
                  </div>
                )}
                
                {previewImage && (
                  <div className="bg-white rounded-2xl overflow-hidden border-2 border-stone-200 shadow-lg">
                    <img src={previewImage} alt="Preview" className="w-full h-[300px] object-cover bg-stone-50" />
                  </div>
                )}
              </div>

              {/* Right Column - Info */}
              <div className="space-y-6">
                {/* Coordinates */}
                {result.location && (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
                    <h4 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      Coordinates
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-stone-600 mb-1">Latitude</p>
                        <p className="text-lg font-mono font-bold text-stone-900">{result.location.latitude.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-600 mb-1">Longitude</p>
                        <p className="text-lg font-mono font-bold text-stone-900">{result.location.longitude.toFixed(6)}</p>
                      </div>
                      {result.elevation && (
                        <div>
                          <p className="text-xs text-stone-600 mb-1">Elevation</p>
                          <p className="text-lg font-bold text-stone-900">{result.elevation.elevation}m</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Weather */}
                {result.weather && (
                  <div className="bg-white rounded-2xl border-2 border-stone-200 p-6">
                    <h4 className="font-bold text-stone-900 mb-4">Weather</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-4xl font-black text-stone-900">{result.weather.temperature}°</p>
                        <p className="text-sm text-stone-600">Celsius</p>
                      </div>
                      {result.weather.humidity && (
                        <div className="text-right">
                          <p className="text-3xl font-black text-stone-900">{result.weather.humidity}%</p>
                          <p className="text-sm text-stone-600">Humidity</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Area Scores */}
                {result.enhancedAnalysis && (
                  <div className="bg-white rounded-2xl border-2 border-stone-200 p-6">
                    <h4 className="font-bold text-stone-900 mb-4">Area Scores</h4>
                    <div className="space-y-4">
                      {result.enhancedAnalysis.walkability && (
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-stone-600">Walkability</span>
                            <span className="text-lg font-black text-stone-900">{result.enhancedAnalysis.walkability.score}</span>
                          </div>
                          <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 transition-all" style={{width: `${result.enhancedAnalysis.walkability.score}%`}}></div>
                          </div>
                        </div>
                      )}
                      {result.enhancedAnalysis.bikeability && (
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-stone-600">Bikeability</span>
                            <span className="text-lg font-black text-stone-900">{result.enhancedAnalysis.bikeability.score}</span>
                          </div>
                          <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 transition-all" style={{width: `${result.enhancedAnalysis.bikeability.score}%`}}></div>
                          </div>
                        </div>
                      )}
                      {result.enhancedAnalysis.airQuality && (
                        <div className="flex justify-between items-center pt-3 border-t-2 border-stone-100">
                          <span className="text-sm text-stone-600">Air Quality</span>
                          <span className="text-base font-bold text-stone-900">{result.enhancedAnalysis.airQuality.category}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Nearby Places */}
                {result.nearbyPlaces && result.nearbyPlaces.length > 0 && (
                  <div className="bg-white rounded-2xl border-2 border-stone-200 p-6">
                    <h4 className="font-bold text-stone-900 mb-4">Nearby</h4>
                    <div className="space-y-3">
                      {result.nearbyPlaces.slice(0, 5).map((place, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-stone-900 truncate">{place.name}</p>
                            <p className="text-xs text-stone-500">{place.type}</p>
                          </div>
                          <span className="text-xs text-stone-600 font-bold ml-3">{place.distance}m</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transit */}
                {result.transit && result.transit.length > 0 && (
                  <div className="bg-white rounded-2xl border-2 border-stone-200 p-6">
                    <h4 className="font-bold text-stone-900 mb-4">Transit</h4>
                    <div className="space-y-3">
                      {result.transit.slice(0, 3).map((station, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <p className="text-sm font-semibold text-stone-900 flex-1">{station.name}</p>
                          <span className="text-xs text-stone-600 font-bold">{station.distance}m</span>
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
            <div className="bg-white p-12 text-center rounded-2xl border-2 border-stone-200">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <X className="w-8 h-8 text-stone-600" />
              </div>
              <h3 className="text-3xl font-black text-stone-900 mb-3">Location not found</h3>
              <p className="text-lg text-stone-600 mb-8">{result.error || "Unable to identify this location"}</p>
              <button
                onClick={() => {
                  setResult(null)
                  setPreviewImage(null)
                }}
                className="bg-stone-900 text-white px-8 py-4 hover:bg-stone-800 transition-colors rounded-xl font-semibold"
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
