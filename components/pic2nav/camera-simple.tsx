"use client"

import { useState, useRef, useCallback } from "react"
import { Camera, Upload, X, MapPin, Loader2, Search, Menu, Share2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ThemeToggle } from "@/components/theme-toggle"

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

  const [showVerify, setShowVerify] = useState(false)
  const [buildingName, setBuildingName] = useState('')
  const [currentFile, setCurrentFile] = useState<File | null>(null)

  const processImage = useCallback(async (file: File) => {
    setIsProcessing(true)
    setResult(null)
    setShowVerify(false)
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
        setShowVerify(true)
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

  const handleVerifyAndTrain = useCallback(async () => {
    if (!currentFile || !buildingName || !result?.location) return

    try {
      const formData = new FormData()
      formData.append('file', currentFile)
      formData.append('name', buildingName)
      formData.append('latitude', result.location.latitude.toString())
      formData.append('longitude', result.location.longitude.toString())

      const response = await fetch('/api/ml-predict-and-learn?action=verify', {
        method: 'POST',
        body: formData,
      })
      
      if (response.ok) {
        toast({ title: "✅ Added to training data!", description: "Helping improve AI accuracy" })
        setShowVerify(false)
        setBuildingName('')
      }
    } catch (error) {
      toast({ title: "Failed to add", variant: "destructive" })
    }
  }, [currentFile, buildingName, result, toast])

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
    <div className="min-h-screen bg-stone-50 dark:bg-black">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-stone-200/50 dark:border-stone-800/50 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 group">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-12 sm:h-14 md:h-16 w-auto object-contain drop-shadow-lg" />
          </a>
          <div className="flex items-center gap-2 sm:gap-4">
            <a href="/api-access" className="hidden md:inline-flex rounded-full px-4 py-2 text-sm hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors">API</a>
            <ThemeToggle />
            <button 
              onClick={() => {
                setResult(null)
                setPreviewImage(null)
              }}
              className="rounded-full bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 dark:text-stone-900 text-white text-sm px-4 py-2"
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
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-stone-900 dark:text-white mb-4 sm:mb-6 leading-tight px-4">Discover locations<br className="hidden sm:block" />through images</h2>
              <p className="text-base sm:text-lg md:text-xl text-stone-600 dark:text-stone-400 mb-8 sm:mb-12 px-4">Upload photos, search by address, or use GPS coordinates to find any location</p>
              
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
                    className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white px-4 sm:px-6 py-3 sm:py-4 pr-12 text-sm sm:text-base focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 transition-colors rounded-lg sm:rounded-none"
                  />
                  <button
                    onClick={() => handleSearch()}
                    disabled={isSearching}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-stone-900 dark:bg-white text-white dark:text-black p-2 hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors disabled:opacity-50"
                  >
                    {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Autocomplete Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 mt-1 z-50">
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={suggestion.place_id}
                        onClick={() => selectSuggestion(suggestion)}
                        className="w-full text-left px-6 py-3 text-stone-900 dark:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors border-b border-stone-200 dark:border-stone-800 last:border-b-0"
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
              <div className="bg-white dark:bg-stone-900 border-2 border-dashed border-stone-300 dark:border-stone-700 p-8 sm:p-12 lg:p-20 text-center hover:border-stone-400 dark:hover:border-stone-600 transition-colors rounded-lg">
                <MapPin className="w-16 h-16 text-stone-400 dark:text-stone-600 mx-auto mb-6" />
                <h3 className="text-xl sm:text-2xl font-light text-stone-900 dark:text-white mb-6 sm:mb-8">Or upload an image</h3>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto bg-stone-900 dark:bg-white text-white dark:text-black px-6 sm:px-10 py-3 sm:py-4 font-medium hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors rounded-lg text-sm sm:text-base"
                  >
                    Choose file
                  </button>
                  <span className="text-stone-500 text-sm sm:text-base">or</span>
                  <button
                    onClick={startCamera}
                    className="w-full sm:w-auto border border-stone-300 dark:border-stone-600 text-stone-900 dark:text-white px-6 sm:px-10 py-3 sm:py-4 font-medium hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 rounded-lg text-sm sm:text-base"
                  >
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                    Take photo
                  </button>
                </div>
              </div>
            </div>
            
            {/* Features Grid */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-20 px-4">
              <div className="border-t border-stone-300 dark:border-stone-800 pt-4 sm:pt-6">
                <h3 className="text-lg sm:text-xl font-light text-stone-900 dark:text-white mb-2 sm:mb-3">Image Recognition</h3>
                <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400">Upload any photo and our AI will identify the location, landmarks, and points of interest</p>
              </div>
              <div className="border-t border-stone-300 dark:border-stone-800 pt-4 sm:pt-6">
                <h3 className="text-lg sm:text-xl font-light text-stone-900 dark:text-white mb-2 sm:mb-3">Text Search</h3>
                <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400">Search using addresses, postcodes, zip codes, or GPS coordinates from anywhere in the world</p>
              </div>
              <div className="border-t border-stone-300 dark:border-stone-800 pt-4 sm:pt-6">
                <h3 className="text-lg sm:text-xl font-light text-stone-900 dark:text-white mb-2 sm:mb-3">Instant Results</h3>
                <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400">Get detailed location information, coordinates, and direct links to view on maps</p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="max-w-6xl mx-auto border-t border-stone-300 dark:border-stone-800 pt-8 sm:pt-12 px-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center">
                <div>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-light text-stone-900 dark:text-white mb-1 sm:mb-2">1M+</p>
                  <p className="text-xs sm:text-sm text-stone-500">Locations identified</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-light text-stone-900 dark:text-white mb-1 sm:mb-2">195</p>
                  <p className="text-xs sm:text-sm text-stone-500">Countries covered</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-light text-stone-900 dark:text-white mb-1 sm:mb-2">99%</p>
                  <p className="text-xs sm:text-sm text-stone-500">Accuracy rate</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-light text-stone-900 dark:text-white mb-1 sm:mb-2">24/7</p>
                  <p className="text-xs sm:text-sm text-stone-500">Always available</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing */}
        {(isProcessing || isSearching) && (
          <div className="max-w-2xl mx-auto text-center py-12 sm:py-20 px-4">
            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-stone-900 dark:text-white animate-spin mx-auto mb-4 sm:mb-6" />
            <h3 className="text-xl sm:text-2xl font-light text-stone-900 dark:text-white mb-2">{isSearching ? 'Searching location' : 'Analyzing image'}</h3>
            <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400">Please wait while we identify the location</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="max-w-7xl mx-auto">
            {result.success ? (
              <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Left Column - Image & Map */}
                <div className="lg:col-span-2 space-y-6">
                  {previewImage && (
                    <div className="bg-stone-900 dark:bg-black rounded-lg overflow-hidden">
                      <img src={previewImage} alt="Preview" className="w-full h-[300px] sm:h-[400px] lg:h-[500px] object-contain bg-stone-900 dark:bg-black" />
                    </div>
                  )}
                  
                  {result.location && (
                    <div className="bg-stone-200 dark:bg-stone-900 h-[250px] sm:h-[300px] lg:h-[400px] rounded-lg overflow-hidden">
                      <iframe
                        src={`https://www.google.com/maps?q=${result.location.latitude},${result.location.longitude}&output=embed`}
                        className="w-full h-full border-0"
                        loading="lazy"
                      />
                    </div>
                  )}
                  
                  {result.nearbyPlaces && result.nearbyPlaces.length > 0 && (
                    <div className="bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-lg">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Nearby Places</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                        {result.nearbyPlaces.slice(0, 6).map((place: NearbyPlace, idx: number) => (
                          <div key={idx}>
                            <div className="w-full h-20 sm:h-24 lg:h-32 bg-gray-200 dark:bg-stone-800 mb-2 overflow-hidden rounded">
                              {place.photoReference ? (
                                <img 
                                  src={`/api/place-photo?reference=${place.photoReference}`}
                                  alt={place.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                    const sibling = e.currentTarget.nextElementSibling as HTMLElement
                                    if (sibling) sibling.classList.remove('hidden')
                                  }}
                                />
                              ) : null}
                              <div className={`w-full h-full flex items-center justify-center ${place.photoReference ? 'hidden' : ''}`}>
                                <MapPin className="w-6 h-6 text-gray-400 dark:text-stone-600" />
                              </div>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-900 dark:text-white font-medium truncate">{place.name}</p>
                            <p className="text-xs text-gray-500 dark:text-stone-400">{place.distance}m away</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Info */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-lg">
                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-2">{result.name}</h3>
                    {result.address && <p className="text-sm sm:text-base text-gray-600 dark:text-stone-400 mb-4">{result.address}</p>}
                    
                    {showVerify && (
                      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">✅ Help train our AI</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">Is this correct? Add it to improve future predictions!</p>
                        <input
                          type="text"
                          placeholder="Building name (e.g., Eiffel Tower)"
                          value={buildingName}
                          onChange={(e) => setBuildingName(e.target.value)}
                          className="w-full p-2 border rounded mb-2 text-sm"
                        />
                        <button
                          onClick={handleVerifyAndTrain}
                          disabled={!buildingName}
                          className="w-full bg-blue-600 text-white px-4 py-2 text-sm rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          Verify & Train AI
                        </button>
                      </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                      <button
                        onClick={() => {
                          if (result.location) {
                            const { latitude, longitude } = result.location
                            window.open(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`, '_blank')
                          }
                        }}
                        className="flex-1 bg-blue-600 text-white px-4 py-3 sm:py-2 text-sm hover:bg-blue-700 transition-colors rounded-lg"
                      >
                        Open in Maps
                      </button>
                      <button
                        onClick={() => {
                          setResult(null)
                          setPreviewImage(null)
                          setShowVerify(false)
                        }}
                        className="flex-1 bg-gray-100 dark:bg-stone-800 text-gray-900 dark:text-white px-4 py-3 sm:py-2 text-sm hover:bg-gray-200 dark:hover:bg-stone-700 transition-colors rounded-lg"
                      >
                        New Search
                      </button>
                    </div>
                    
                    {/* Share Buttons */}
                    <div className="border-t border-stone-200 dark:border-stone-800 pt-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-stone-300 mb-3 flex items-center gap-2">
                        <Share2 className="w-4 h-4" />
                        Share Location
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const text = `Found: ${result.name || 'Unknown location'}\n${result.address || ''}\n\nDiscovered using Pic2Nav AI!\nTry it: pic2nav.com`
                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
                          }}
                          className="flex-1 bg-green-500 text-white px-3 py-2 text-xs hover:bg-green-600 transition-colors rounded flex items-center justify-center gap-1"
                        >
                          WhatsApp
                        </button>
                        <button
                          onClick={() => {
                            const text = `Just discovered: ${result.name || 'this location'} using Pic2Nav AI! #Pic2Nav #AI #LocationDiscovery`
                            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=pic2nav.com`, '_blank')
                          }}
                          className="flex-1 bg-blue-500 text-white px-3 py-2 text-xs hover:bg-blue-600 transition-colors rounded flex items-center justify-center gap-1"
                        >
                          Twitter
                        </button>
                        <button
                          onClick={() => {
                            const text = `Just discovered: ${result.name || 'this amazing location'} using Pic2Nav AI! Try it at pic2nav.com #AI #LocationDiscovery`
                            window.open(`https://www.facebook.com/sharer/sharer.php?u=pic2nav.com&quote=${encodeURIComponent(text)}`, '_blank')
                          }}
                          className="flex-1 bg-blue-700 text-white px-3 py-2 text-xs hover:bg-blue-800 transition-colors rounded flex items-center justify-center gap-1"
                        >
                          Facebook
                        </button>
                      </div>
                    </div>
                    
                    {result.location && (
                      <div className="space-y-3 text-sm border-t border-stone-200 dark:border-stone-800 pt-4">
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-stone-400">Latitude</span>
                          <span className="font-mono text-gray-900 dark:text-white">{result.location.latitude.toFixed(6)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-stone-400">Longitude</span>
                          <span className="font-mono text-gray-900 dark:text-white">{result.location.longitude.toFixed(6)}</span>
                        </div>
                        {result.confidence && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-stone-400">Confidence</span>
                            <span className="font-semibold text-green-600">{Math.round(result.confidence * 100)}%</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {(result.deviceAnalysis || result.historicalData) && (
                    <div className="bg-white dark:bg-stone-900 p-6">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Photo Details</h4>
                      <div className="space-y-3 text-sm">
                        {result.deviceAnalysis?.camera?.make && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-stone-400">Camera</span>
                            <span className="text-gray-900 dark:text-white text-right">{result.deviceAnalysis.camera.make} {result.deviceAnalysis.camera.model}</span>
                          </div>
                        )}
                        {result.historicalData?.photoTakenDate && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-stone-400">Date</span>
                            <span className="text-gray-900 dark:text-white">{new Date(result.historicalData.photoTakenDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {result.historicalData?.photoAge && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-stone-400">Age</span>
                            <span className="text-gray-900 dark:text-white">{result.historicalData.photoAge}</span>
                          </div>
                        )}
                        {result.deviceAnalysis?.image?.width && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-stone-400">Resolution</span>
                            <span className="text-gray-900 dark:text-white">{result.deviceAnalysis.image.width}×{result.deviceAnalysis.image.height}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {result.weather && (
                    <div className="bg-white dark:bg-stone-900 p-6">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Weather</h4>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{result.weather.temperature}°C</p>
                      {result.weather.condition && <p className="text-sm text-gray-600 dark:text-stone-400">{result.weather.condition}</p>}
                    </div>
                  )}
                  
                  {result.transit && result.transit.length > 0 && (
                    <div className="bg-white dark:bg-stone-900 p-6">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Transit</h4>
                      <div className="space-y-2">
                        {result.transit.slice(0, 3).map((station: any, idx: number) => (
                          <div key={idx} className="text-sm">
                            <p className="text-gray-900 dark:text-white font-medium">{station.name}</p>
                            <p className="text-xs text-gray-500 dark:text-stone-400">{station.distance}m away</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-stone-900 p-12 text-center">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Location not found</h3>
                <p className="text-gray-600 dark:text-stone-400 mb-6">{result.error || "Unable to identify this location"}</p>
                <button
                  onClick={() => {
                    setResult(null)
                    setPreviewImage(null)
                  }}
                  className="bg-blue-600 text-white px-6 py-2 hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
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
