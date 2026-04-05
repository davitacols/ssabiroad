"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  Camera,
  CloudSun,
  Crosshair,
  ExternalLink,
  Globe2,
  Image as ImageIcon,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  RotateCcw,
  Route,
  Search,
  Sparkles,
  Upload,
  X,
} from "lucide-react"
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

interface Suggestion {
  place_id: string
  description: string
}

interface RecognitionResult {
  success: boolean
  name?: string
  address?: string
  location?: Location
  confidence?: number
  method?: string
  error?: string
  nearbyPlaces?: NearbyPlace[]
  weather?: {
    temperature?: number
    humidity?: number
    condition?: string
  }
  recognitionId?: string
}

const scanTips = [
  {
    icon: ImageIcon,
    title: "Readable text helps most",
    text: "Signs, addresses, and phone numbers give OCR and geocoding a strong anchor.",
  },
  {
    icon: Navigation,
    title: "Keep some context",
    text: "A slightly wider frame helps the route read the building and the clue together.",
  },
  {
    icon: Globe2,
    title: "Search if you already know part of it",
    text: "Manual verification beats repeating weak scans when you have a likely place.",
  },
] as const

function getConfidenceLabel(confidence?: number) {
  if (typeof confidence !== "number") return "Needs review"
  if (confidence >= 0.92) return "High confidence"
  if (confidence >= 0.75) return "Strong lead"
  if (confidence >= 0.55) return "Probable match"
  return "Low confidence"
}

function getConfidenceSummary(confidence?: number) {
  if (typeof confidence !== "number") return "Review the image and map together before confirming."
  if (confidence >= 0.92) return "This result is strong enough to validate directly against the map and nearby context."
  if (confidence >= 0.75) return "This is a strong lead. Check the address and surrounding context before confirming."
  if (confidence >= 0.55) return "Treat this as a probable match and use nearby context or manual search to verify it."
  return "This result needs manual review before it should be trusted."
}

function getMethodLabel(method?: string) {
  if (!method) return "Hybrid route analysis"
  const normalized = method.toLowerCase()
  if (normalized.includes("exif") || normalized.includes("gps")) return "Metadata recovery"
  if (normalized.includes("landmark")) return "Landmark resolution"
  if (normalized.includes("claude")) return "Claude-assisted validation"
  if (normalized.includes("vision")) return "Vision-led detection"
  if (normalized.includes("navisense")) return "NaviSense retrieval"
  if (normalized.includes("address")) return "Address validation"
  return method.replace(/-/g, " ")
}

function getMethodAnalysis(method?: string) {
  if (!method) return "The route combined available evidence and guardrails before returning this result."
  const normalized = method.toLowerCase()
  if (normalized.includes("exif") || normalized.includes("gps")) return "The result came from embedded coordinates, which is usually the most direct evidence path."
  if (normalized.includes("landmark")) return "The route recognized a landmark cue and validated it into a location result."
  if (normalized.includes("claude")) return "The route used scene reasoning and address or place validation to turn weak evidence into a grounded match."
  if (normalized.includes("vision")) return "The route relied on OCR, labels, or landmark signals from computer vision before validating the result."
  if (normalized.includes("navisense")) return "The result came through the retrieval stack and was accepted only after confidence and geographic checks."
  return "This result came through a routed analysis path and passed the platform’s acceptance checks."
}

export function CameraMinimalV3() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<RecognitionResult | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [isStartingCamera, setIsStartingCamera] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewUrlRef = useRef<string | null>(null)
  const { toast } = useToast()

  const resetWorkspace = useCallback(() => {
    setResult(null)
    setPreviewImage((current) => {
      if (current?.startsWith("blob:")) URL.revokeObjectURL(current)
      return null
    })
    previewUrlRef.current = null
    setSearchQuery("")
    setSuggestions([])
    setShowSuggestions(false)
  }, [])

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
    setIsStartingCamera(false)
  }, [])

  useEffect(() => stopCamera, [stopCamera])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  const processImage = useCallback(async (file: File) => {
    setIsProcessing(true)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append("image", file)
      const response = await fetch("/api/location-recognition-v2", { method: "POST", body: formData })
      if (!response.ok) throw new Error(`API error: ${response.status}`)
      const data = (await response.json()) as RecognitionResult
      setResult(data)
      if (data.success && data.location) {
        toast({ title: "Recognition complete", description: data.name || data.address || "Location identified" })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Recognition failed"
      setResult({ success: false, error: errorMessage })
      toast({ title: "Recognition failed", description: errorMessage, variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }, [toast])

  const handleFileSelect = useCallback((file: File) => {
    if (!file) return
    setPreviewImage((current) => {
      if (current?.startsWith("blob:")) URL.revokeObjectURL(current)
      return current
    })
    const nextUrl = URL.createObjectURL(file)
    previewUrlRef.current = nextUrl
    setPreviewImage(nextUrl)
    processImage(file)
  }, [processImage])

  const startCamera = useCallback(async () => {
    setIsStartingCamera(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)
    } catch {
      toast({ title: "Camera unavailable", description: "We could not access your camera on this device.", variant: "destructive" })
      stopCamera()
    } finally {
      setIsStartingCamera(false)
    }
  }, [stopCamera, toast])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext("2d")
    if (!context) return
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) return
      handleFileSelect(new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" }))
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
      const nextSuggestions = (data.predictions || []) as Suggestion[]
      setSuggestions(nextSuggestions.slice(0, 5))
      setShowSuggestions(nextSuggestions.length > 0)
    } catch (error) {
      console.error("Autocomplete error:", error)
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [])

  const handleSearch = useCallback(async (query?: string) => {
    const searchText = (query || searchQuery).trim()
    if (!searchText) return
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
          confidence: 1,
        })
        setPreviewImage((current) => {
          if (current?.startsWith("blob:")) URL.revokeObjectURL(current)
          return null
        })
        previewUrlRef.current = null
        toast({ title: "Location found", description: data.formatted_address })
      } else {
        toast({ title: "Location not found", description: data.error || "We could not resolve that search.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Search failed", description: "There was a problem geocoding this location.", variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }, [searchQuery, toast])

  const confidenceLabel = getConfidenceLabel(result?.confidence)
  const confidenceSummary = getConfidenceSummary(result?.confidence)
  const methodLabel = getMethodLabel(result?.method)
  const methodAnalysis = getMethodAnalysis(result?.method)
  const stageLabel = isProcessing ? "Analyzing image" : result?.success ? "Recognition complete" : result && !result.success ? "Needs another pass" : previewImage ? "Preview ready" : "Field console"
  const confidenceValue = typeof result?.confidence === "number" ? `${Math.round(result.confidence * 100)}%` : "--"
  const nearbyCount = result?.nearbyPlaces?.length || 0
  const hasWeather = Boolean(result?.weather)

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f6f6f1] text-slate-900">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(148,163,184,0.14),transparent_32%),radial-gradient(circle_at_84%_14%,rgba(59,130,246,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,246,241,0.98))]" />
      </div>

      {cameraActive && (
        <div className="fixed inset-0 z-[80] bg-[#020617] text-white">
          <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.72),transparent_24%,transparent_72%,rgba(0,0,0,0.84))]" />
          <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-5 py-5 sm:px-8">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/70">Live capture</p>
              <p className="mt-1 text-lg font-semibold">Center the strongest clue in the frame</p>
            </div>
            <button onClick={stopCamera} className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-white/10">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-8">
            <div className="relative h-[50vh] w-full max-w-4xl rounded-[2.6rem] border border-white/12 bg-white/5">
              <div className="absolute left-6 top-6 h-16 w-16 border-l-4 border-t-4 border-white/95" />
              <div className="absolute right-6 top-6 h-16 w-16 border-r-4 border-t-4 border-white/95" />
              <div className="absolute bottom-6 left-6 h-16 w-16 border-b-4 border-l-4 border-white/95" />
              <div className="absolute bottom-6 right-6 h-16 w-16 border-b-4 border-r-4 border-white/95" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-6 sm:px-8">
            <div className="mx-auto flex max-w-4xl items-center justify-between rounded-[2rem] border border-white/15 bg-black/35 px-5 py-4 backdrop-blur-xl">
              <div className="text-sm text-white/90">
                <Crosshair className="mb-2 h-4 w-4" />
                Center the clue
              </div>
              <button onClick={capturePhoto} className="inline-flex h-24 w-24 items-center justify-center rounded-full border-[10px] border-white/30 bg-white">
                <span className="h-16 w-16 rounded-full bg-[#0f172a]" />
              </button>
              <div className="text-sm text-white/90">
                <Camera className="mb-2 h-4 w-4" />
                Tap to capture
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 border-b border-slate-900/8 bg-white/86 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-11 w-auto sm:h-12" />
            <div className="hidden sm:block">
              <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Pic2Nav</p>
              <p className="text-sm font-semibold text-slate-900">Field console</p>
            </div>
          </Link>
          <button onClick={resetWorkspace} className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm">
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </header>

      <main className="relative mx-auto max-w-[1500px] px-4 py-8 sm:px-6 sm:py-10">
        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2.4rem] border border-slate-900/10 bg-white p-7 shadow-[0_22px_80px_rgba(15,23,42,0.06)] sm:p-9">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-slate-50 px-4 py-2 text-sm text-slate-700">
              <Sparkles className="h-4 w-4 text-slate-700" />
              Camera workflow
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.02] text-slate-950 sm:text-5xl xl:text-6xl">
              Capture evidence. Review the place. Decide with context.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Upload a still image, open the live camera, or verify a suspected location. The workflow keeps the image, the confidence readout, the map, and the feedback loop together.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-950 px-6 py-4 text-base font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] disabled:opacity-50"
                style={{ backgroundColor: "#0f172a", color: "#ffffff" }}
              >
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                Upload image
              </button>
              <button onClick={startCamera} disabled={isProcessing || isStartingCamera || cameraActive} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-900/10 bg-white px-6 py-4 text-base font-semibold text-slate-900 disabled:opacity-50">
                {isStartingCamera ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                Open camera
              </button>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-slate-900/10 bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Capture</p>
                <p className="mt-3 text-sm leading-6 text-slate-700">Frame signage, landmarks, gates, and other readable clues.</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-900/10 bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Rank</p>
                <p className="mt-3 text-sm leading-6 text-slate-700">The route checks GPS, OCR, model leads, and map plausibility.</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-900/10 bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Review</p>
                <p className="mt-3 text-sm leading-6 text-slate-700">Image, map, confidence, and feedback stay in one workflow.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-900/10 bg-[#fbfbf8] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)] sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Status board</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">One workspace, multiple evidence lanes</h2>
              </div>
              <div className="rounded-full border border-slate-900/10 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
                {confidenceLabel}
              </div>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-4">
                <div className="rounded-[1.6rem] border border-slate-900/10 bg-white px-5 py-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Current stage</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{stageLabel}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {isProcessing ? "OCR, GPS, business clues, and map candidates are being checked." : result?.success ? "A location is ready for review, validation, and feedback." : result && !result.success ? "The evidence was too weak or conflicting for a confident result." : previewImage ? "Your frame is loaded and ready for the recognition pipeline." : "Upload, capture, or search to start a recognition pass."}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.4rem] border border-slate-900/10 bg-white px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Confidence</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{confidenceValue}</p>
                  </div>
                  <div className="rounded-[1.4rem] border border-slate-900/10 bg-white px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Mode</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{previewImage ? "Image" : result?.success ? "Search" : "Idle"}</p>
                  </div>
                </div>
              </div>
                <div className="overflow-hidden rounded-[1.8rem] border border-slate-900/10 bg-[#0f172a]">
                  <div className="h-[260px]">
                    <InteractiveGlobe />
                  </div>
                  <div className="grid gap-3 border-t border-white/10 bg-slate-950/60 p-4 text-sm text-white">
                    <div className="rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3">GPS, OCR, retrieval, and reasoning are checked before a result is accepted.</div>
                    <div className="rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3">Search can validate a suspected location faster than another weak scan.</div>
                  </div>
                </div>
              </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_390px]">
          <div className="rounded-[2.3rem] border border-slate-900/10 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.05)] sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-slate-500">{stageLabel}</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Recognition workspace</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                <LocateFixed className="h-4 w-4" />
                Image, map, confidence, feedback
              </div>
            </div>

            {result?.success && result.location ? (
              <div className="space-y-5">
                <div className="rounded-[1.9rem] border border-emerald-200 bg-[linear-gradient(180deg,#f6fff9,#ffffff)] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-3xl">
                      <p className="text-xs uppercase tracking-[0.28em] text-emerald-700">Resolved location</p>
                      <h3 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">{result.name || "Location found"}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{result.address || "Address unavailable"}</p>
                      <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-700">{confidenceSummary}</p>
                    </div>
                    <div className="rounded-[1.4rem] border border-emerald-200 bg-white px-5 py-4 text-right shadow-sm">
                      <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">{confidenceLabel}</p>
                      <p className="mt-1 text-3xl font-black text-emerald-900">{confidenceValue}</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.3rem] border border-slate-900/10 bg-white px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Recommendation</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">Verify on the map, then confirm or correct.</p>
                    </div>
                    <div className="rounded-[1.3rem] border border-slate-900/10 bg-white px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Latitude</p>
                      <p className="mt-2 font-mono text-sm font-bold text-slate-900">{result.location.latitude.toFixed(6)}</p>
                    </div>
                    <div className="rounded-[1.3rem] border border-slate-900/10 bg-white px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Longitude</p>
                      <p className="mt-2 font-mono text-sm font-bold text-slate-900">{result.location.longitude.toFixed(6)}</p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-5 xl:grid-cols-[0.94fr_1.06fr]">
                  <div className="space-y-5">
                    <div className="overflow-hidden rounded-[1.9rem] border border-slate-900/10 bg-slate-100">
                      {previewImage ? (
                        <img src={previewImage} alt="Recognition preview" className="h-[360px] w-full object-cover" />
                      ) : (
                        <div className="flex h-[360px] items-center justify-center px-8 text-center text-slate-500">No image preview is available for this result.</div>
                      )}
                    </div>
                    <div className="rounded-[1.9rem] border border-slate-900/10 bg-[#fafaf7] p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Recognition</p>
                          <h3 className="mt-2 text-2xl font-bold text-slate-900">{result.name || "Location found"}</h3>
                          <p className="mt-3 text-sm leading-6 text-slate-600">{result.address || "Address unavailable"}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-right">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Decision state</p>
                          <p className="mt-1 text-lg font-bold text-slate-900">Ready for review</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[1.9rem] border border-slate-900/10 bg-white p-5">
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Analysis</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[1.3rem] border border-slate-900/10 bg-[#fafaf7] px-4 py-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Resolution path</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{methodLabel}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{methodAnalysis}</p>
                        </div>
                        <div className="rounded-[1.3rem] border border-slate-900/10 bg-[#fafaf7] px-4 py-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Evidence available</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {previewImage ? "Image preview present" : "Map-led result"}
                            {result.address ? " + address" : ""}
                            {hasWeather ? " + weather" : ""}
                            {nearbyCount > 0 ? ` + ${nearbyCount} nearby places` : ""}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">Use the image, address, and local context together before confirming the result.</p>
                        </div>
                        <div className="rounded-[1.3rem] border border-slate-900/10 bg-[#fafaf7] px-4 py-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Confidence read</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{confidenceLabel}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{confidenceSummary}</p>
                        </div>
                        <div className="rounded-[1.3rem] border border-slate-900/10 bg-[#fafaf7] px-4 py-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Verification flow</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">Map first, feedback second</p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">Open the pin in Google Maps, compare the scene, then confirm or correct the result in the feedback panel.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="overflow-hidden rounded-[1.9rem] border border-slate-900/10 bg-slate-100">
                      <iframe
                        src={`https://www.google.com/maps?q=${result.location.latitude},${result.location.longitude}&output=embed`}
                        className="h-[360px] w-full border-0"
                        loading="lazy"
                        title="Recognition map"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[1.6rem] border border-slate-900/10 bg-white px-4 py-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Latitude</p>
                        <p className="mt-2 font-mono text-lg font-bold text-slate-900">{result.location.latitude.toFixed(6)}</p>
                      </div>
                      <div className="rounded-[1.6rem] border border-slate-900/10 bg-white px-4 py-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Longitude</p>
                        <p className="mt-2 font-mono text-lg font-bold text-slate-900">{result.location.longitude.toFixed(6)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : previewImage ? (
              <div className="overflow-hidden rounded-[1.9rem] border border-slate-900/10 bg-slate-100">
                <div className="relative">
                  <img src={previewImage} alt="Preview" className="h-[540px] w-full object-cover" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(15,23,42,0.42))]" />
                </div>
              </div>
            ) : isProcessing ? (
              <div className="flex min-h-[540px] flex-col items-center justify-center rounded-[1.9rem] border border-dashed border-slate-300 bg-[linear-gradient(180deg,#ffffff,#f7f7f3)] px-8 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-950 text-white shadow-lg">
                  <Loader2 className="h-9 w-9 animate-spin" />
                </div>
                <h3 className="mt-6 text-3xl font-black text-slate-900">Reading the image across the full stack</h3>
                <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">The recognizer is checking GPS, OCR, business clues, landmark hints, and map candidates before it assembles a final result.</p>
              </div>
            ) : result && !result.success ? (
              <div className="flex min-h-[540px] flex-col justify-center rounded-[1.9rem] border border-rose-200 bg-rose-50/70 px-8 py-10">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                  <X className="h-9 w-9" />
                </div>
                <h3 className="mt-6 text-3xl font-black text-slate-900">We could not confidently identify this location</h3>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">{result.error || "Try a clearer angle, a wider shot, or verify the place manually in the search rail."}</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1.3rem] border border-rose-200 bg-white px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-rose-600">Try again</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">Capture a wider frame with the strongest clue centered.</p>
                  </div>
                  <div className="rounded-[1.3rem] border border-rose-200 bg-white px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-rose-600">Improve evidence</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">Include readable text, a landmark, or nearby street context.</p>
                  </div>
                  <div className="rounded-[1.3rem] border border-rose-200 bg-white px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-rose-600">Manual route</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">Use the search rail if you already know part of the place.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid min-h-[540px] place-items-center rounded-[1.9rem] border border-dashed border-slate-300 bg-[linear-gradient(180deg,#ffffff,#f7f7f3)] px-8 py-10 text-center">
                <div className="max-w-2xl">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-950 text-white shadow-lg">
                    <Camera className="h-9 w-9" />
                  </div>
                  <h3 className="mt-6 text-3xl font-black text-slate-900 sm:text-4xl">Frame the clue and let the workflow build the case</h3>
                  <p className="mt-4 text-base leading-7 text-slate-600">This workspace is tuned for signs, landmarks, gates, phone numbers, and other clues that can anchor a confident location result.</p>
                </div>
              </div>
            )}
          </div>
          <aside className="space-y-6">
            <div className="rounded-[2.1rem] border border-slate-900/10 bg-[#fafaf7] p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] sm:p-6">
              <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Command rail</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Search, upload, or capture</h2>
              <div className="relative mt-5">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search an address, business, or coordinates"
                    value={searchQuery}
                    onChange={(event) => {
                      const nextValue = event.target.value
                      setSearchQuery(nextValue)
                      fetchSuggestions(nextValue)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        handleSearch()
                      }
                    }}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    className="w-full rounded-[1.4rem] border border-slate-900/10 bg-white px-5 py-4 pr-14 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-[#c77d2b] focus:ring-2 focus:ring-[#f2c184]"
                  />
                  <button onClick={() => handleSearch()} disabled={isProcessing} className="absolute right-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950 text-white disabled:opacity-50">
                    {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                  </button>
                </div>
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-[1.4rem] border border-slate-900/10 bg-white shadow-xl">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.place_id}
                        onClick={() => {
                          setSearchQuery(suggestion.description)
                          setShowSuggestions(false)
                          handleSearch(suggestion.description)
                        }}
                        className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-4 text-left last:border-b-0"
                      >
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <span className="text-sm leading-6 text-slate-700">{suggestion.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-5 grid gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="inline-flex items-center justify-between rounded-[1.5rem] border border-slate-950 px-5 py-4 text-left text-white shadow-[0_14px_30px_rgba(15,23,42,0.14)] disabled:opacity-50"
                  style={{ backgroundColor: "#0f172a", color: "#ffffff" }}
                >
                  <span>
                    <span className="block text-xs uppercase tracking-[0.28em] text-white/90">Upload</span>
                    <span className="mt-1 block text-base font-semibold">Send an image for recognition</span>
                  </span>
                  {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                </button>
                <button onClick={startCamera} disabled={isProcessing || isStartingCamera || cameraActive} className="inline-flex items-center justify-between rounded-[1.5rem] border border-slate-900/10 bg-white px-5 py-4 text-left disabled:opacity-50">
                  <span>
                    <span className="block text-xs uppercase tracking-[0.28em] text-slate-500">Camera</span>
                    <span className="mt-1 block text-base font-semibold text-slate-900">Open live capture mode</span>
                  </span>
                  {isStartingCamera ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5 text-slate-700" />}
                </button>
              </div>
            </div>

            {result?.success && result.location ? (
              <>
                <div className="rounded-[2.1rem] border border-slate-900/10 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Result actions</p>
                      <h3 className="mt-2 text-xl font-bold text-slate-900">Confirm or continue</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">Open the map, confirm the address, or send correction feedback if the match is close but not exact.</p>
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{confidenceLabel}</div>
                  </div>
                  <div className="mt-5 grid gap-3">
                    <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${result.location?.latitude},${result.location?.longitude}`, "_blank")} className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
                      <ExternalLink className="h-4 w-4" />
                      Open in Google Maps
                    </button>
                    <button onClick={resetWorkspace} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-900/10 bg-white px-5 py-3 text-sm font-semibold text-slate-900">
                      <RotateCcw className="h-4 w-4" />
                      Scan another image
                    </button>
                    <ResultFeedback recognitionId={result.recognitionId} address={result.address} />
                  </div>
                </div>

                {(result.weather || result.nearbyPlaces?.length) && (
                  <div className="rounded-[2.1rem] border border-slate-900/10 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] sm:p-6">
                    <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Context layers</p>
                    {result.weather && (
                      <div className="mt-4 rounded-[1.4rem] border border-slate-900/10 bg-[#eff8ff] p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <CloudSun className="h-4 w-4" />
                          Weather snapshot
                        </div>
                        <div className="mt-3 flex items-end justify-between gap-4">
                          <p className="text-4xl font-black text-slate-900">{typeof result.weather.temperature === "number" ? `${result.weather.temperature} deg` : "--"}</p>
                          <div className="text-right text-sm text-slate-600">
                            <p>{result.weather.condition || "Condition unavailable"}</p>
                            <p>{typeof result.weather.humidity === "number" ? `Humidity ${result.weather.humidity}%` : "Humidity unavailable"}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {result.nearbyPlaces && result.nearbyPlaces.length > 0 && (
                      <div className="mt-4 rounded-[1.4rem] border border-slate-900/10 bg-[#f8fafc] p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <Route className="h-4 w-4" />
                          Nearby places
                        </div>
                        <div className="mt-3 space-y-3">
                          {result.nearbyPlaces.slice(0, 4).map((place) => (
                            <div key={`${place.name}-${place.distance}`} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">{place.name}</p>
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{place.type}</p>
                              </div>
                              <div className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{place.distance}m</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-[2.1rem] border border-slate-900/10 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] sm:p-6">
                <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Field guide</p>
                <div className="mt-4 space-y-3">
                  {scanTips.map((item) => (
                    <div key={item.title} className="flex gap-3 rounded-[1.4rem] bg-[#fafaf7] px-4 py-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-[1.6rem] border border-slate-900/10 bg-slate-950 p-5 text-white">
                  <p className="text-xs uppercase tracking-[0.28em] text-white/70">Need a faster route?</p>
                  <p className="mt-3 text-sm leading-6 text-slate-200">If you already know part of the address or business name, use the search rail instead of repeating weak scans.</p>
                  <Link href="/" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/90">
                    Back to homepage
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}
          </aside>
        </section>
      </main>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => {
        const file = event.target.files?.[0]
        if (file) handleFileSelect(file)
        event.currentTarget.value = ""
      }} />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
