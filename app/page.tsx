"use client"

import React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import * as LucideIcons from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlacesAutocomplete } from "@/components/places-autocomplete"
import { AppNavbar } from "@/components/app-navbar"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  const [activeFeature, setActiveFeature] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const featuredServices = [
    {
      id: 1,
      name: "Google Lens",
      provider: "Google",
      category: "Mobile & Web",
      image: "/placeholder.svg?height=600&width=800&text=Google+Lens",
      rating: 4.8,
      reviewCount: 1243,
      description:
        "Identify landmarks, storefronts, and places from photos and live camera view, then navigate with Google Maps.",
      tags: ["AI-Powered", "Global Coverage", "Free"],
    },
    {
      id: 2,
      name: "Visual Look Up",
      provider: "Apple",
      category: "iOS/iPadOS",
      image: "/placeholder.svg?height=600&width=800&text=Apple+Visual+Look+Up",
      rating: 4.7,
      reviewCount: 987,
      description:
        "Built into Photos app, recognizes landmarks and provides directions via Apple Maps with a single tap.",
      tags: ["On-Device AI", "Privacy-Focused", "Integrated"],
    },
    {
      id: 3,
      name: "Drive to a Photo",
      provider: "TomTom GO",
      category: "Mobile App",
      image: "/placeholder.svg?height=600&width=800&text=TomTom+GO",
      rating: 4.6,
      reviewCount: 756,
      description: "Navigate to locations from your photos by extracting GPS coordinates from image metadata.",
      tags: ["Subscription", "Offline Maps", "CarPlay/Android Auto"],
    },
  ]

  const keyFeatures = [
    {
      icon: "Camera",
      title: "Image Recognition",
      description:
        "Upload or take a photo of any landmark, building, or location and get instant identification with detailed information.",
    },
    {
      icon: "Navigation",
      title: "Turn-by-Turn Directions",
      description:
        "After identifying a location from your image, get precise navigation instructions to reach your destination.",
    },
    {
      icon: "MapPin",
      title: "Location Intelligence",
      description:
        "Access comprehensive data about identified places including historical context, opening hours, and crowd levels.",
    },
    {
      icon: "Compass",
      title: "AR Navigation",
      description:
        "Use augmented reality to overlay directional guidance on your camera view for intuitive on-foot navigation.",
    },
    {
      icon: "Database",
      title: "Offline Capabilities",
      description:
        "Download maps and visual recognition data for areas you plan to visit, enabling navigation without internet connection.",
    },
    {
      icon: "Globe",
      title: "Global Coverage",
      description:
        "Identify and navigate to locations worldwide, with best performance for well-known landmarks and points of interest.",
    },
  ]

  const partnerLogos = [
    { name: "Google", logo: "/logos/google.png" },
    { name: "Apple", logo: "/logos/apple.png" },
    { name: "Microsoft Bing", logo: "/logos/microsoft.png" },
    { name: "TomTom", logo: "/logos/tomtom.png" },
    { name: "Garmin", logo: "/logos/garmin.png" },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <AppNavbar />

      {/* Hero Section with Animated Illustration */}
      <section className="relative overflow-hidden pt-24 md:pt-32 pb-16 md:pb-20">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 md:grid-cols-2 md:gap-10 items-center">
            <div className="flex flex-col gap-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Badge className="mb-4 px-3 py-1 bg-teal-500/10 text-teal-600 dark:text-teal-400 font-medium">
                  <LucideIcons.Sparkles className="w-3 h-3 mr-1" />
                  Image-Based Navigation
                </Badge>
              </motion.div>

              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Navigate to any place from a photo
              </motion.h1>

              <motion.p
                className="text-xl text-slate-600 dark:text-slate-300 md:text-2xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Pic2Nav helps you identify and navigate to any location using just a photo of a landmark, storefront, or
                building.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-3 mt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white border-0"
                >
                  <LucideIcons.Upload className="mr-2 h-5 w-5" />
                  Upload a Photo
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <LucideIcons.Play className="mr-2 h-5 w-5" />
                  See How It Works
                </Button>
              </motion.div>

              <motion.div
                className="mt-6 flex items-center space-x-3 text-sm text-slate-500 dark:text-slate-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="flex -space-x-1.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-7 w-7 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-medium"
                    >
                      {i}
                    </div>
                  ))}
                </div>
                <div>Trusted by 500K+ travelers worldwide</div>
              </motion.div>
            </div>

            <motion.div
              className="relative z-10"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl">
                <div className="absolute inset-0">
                  {/* This would be a dynamic illustration in production */}
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-cyan-500/20"></div>
                  <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-px opacity-20">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div key={i} className="bg-white/20"></div>
                    ))}
                  </div>

                  {/* AR Overlay Elements */}
                  <div className="absolute top-1/4 left-1/4 h-12 w-12 rounded-full bg-teal-500/30 animate-pulse shadow-[0_0_20px_rgba(20,184,166,0.5)]"></div>
                  <div className="absolute top-1/2 right-1/3 h-8 w-8 rounded-full bg-amber-500/40 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.6)]"></div>
                  <div className="absolute bottom-1/3 right-1/4 h-10 w-10 rounded-full bg-emerald-500/30 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>

                  {/* Information Cards */}
                  <div className="absolute top-[15%] left-[20%] w-48 p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 text-xs">
                    <div className="flex items-center gap-2">
                      <LucideIcons.Building className="h-4 w-4 text-teal-500" />
                      <span className="font-bold">Eiffel Tower</span>
                    </div>
                    <div className="mt-1 text-slate-500 dark:text-slate-400">Identified with 98% confidence</div>
                    <div className="mt-1 text-xs">Tap to navigate</div>
                  </div>

                  <div className="absolute bottom-[20%] right-[15%] w-40 p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 text-xs">
                    <div className="flex items-center gap-2">
                      <LucideIcons.Navigation className="h-4 w-4 text-amber-500" />
                      <span className="font-bold">Route Ready</span>
                    </div>
                    <div className="mt-1 text-slate-500 dark:text-slate-400">2.7 km away</div>
                    <div className="mt-1 text-xs">15 min by car</div>
                  </div>

                  {/* Path Indicators */}
                  <div className="absolute left-[40%] top-[30%] right-[30%] bottom-[40%] border-2 border-dashed border-teal-500/50 rounded-lg"></div>

                  {/* AR Icons */}
                  <div className="absolute top-[45%] left-[35%] p-1.5 bg-teal-500 rounded-full">
                    <LucideIcons.Info className="h-3 w-3 text-white" />
                  </div>
                  <div className="absolute top-[30%] right-[25%] p-1.5 bg-amber-500 rounded-full">
                    <LucideIcons.Camera className="h-3 w-3 text-white" />
                  </div>
                  <div className="absolute bottom-[35%] left-[30%] p-1.5 bg-emerald-500 rounded-full">
                    <LucideIcons.MapPin className="h-3 w-3 text-white" />
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LucideIcons.Camera className="h-4 w-4 text-teal-500" />
                      <span className="font-medium text-sm">Photo Recognition Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <LucideIcons.CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">Landmark identified</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Search Bar */}
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-5/6 md:w-2/3 transition-all duration-300">
                <div className="relative rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg p-1.5 hover:shadow-xl focus-within:shadow-xl transition-shadow">
                  {/* Search Icon */}
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <LucideIcons.Search className="h-4 w-4 text-slate-400" />
                  </div>

                  {/* Search Input (Google Maps Redirect on Selection or Enter) */}
                  <PlacesAutocomplete
                    placeholder="Search or upload a photo of a place..."
                    className="pl-10 pr-20 h-11 w-full rounded-full bg-transparent text-sm border-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 transition-all duration-300"
                    onPlaceSelect={(place) => {
                      if (place) {
                        const encodedPlace = encodeURIComponent(place)
                        window.open(`https://www.google.com/maps/search/?api=1&query=${encodedPlace}`, "_blank")
                      }
                    }}
                    renderInput={(props) => (
                      <input
                        {...props}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && props.value.trim()) {
                            const encodedPlace = encodeURIComponent(props.value.trim())
                            window.open(`https://www.google.com/maps/search/?api=1&query=${encodedPlace}`, "_blank")
                          }
                        }}
                      />
                    )}
                  />

                  {/* Upload Button */}
                  <div className="absolute inset-y-0 right-1.5 flex items-center">
                    <Button
                      size="sm"
                      className="h-8 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white border-0 transition-all duration-200"
                      onClick={() => console.log("Upload button clicked!")}
                    >
                      <LucideIcons.Camera className="h-4 w-4 mr-1" />
                      <span className="sr-only md:not-sr-only md:inline-block">Upload</span>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Background decorative elements */}
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl"></div>
      </section>

      {/* Featured Navigation Services */}
      <section className="py-12 md:py-20 bg-white dark:bg-slate-900">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4 mb-12">
            <Badge
              className="mb-2 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
              variant="outline"
            >
              Featured Services
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400">
              Top Image Navigation Tools
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg md:text-xl max-w-[800px]">
              Discover the best platforms for identifying and navigating to places from photos
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredServices.map((service) => (
              <Card
                key={service.id}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LucideIcons.Star className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium">{service.rating}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        ({service.reviewCount} reviews)
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                    >
                      {service.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <LucideIcons.Camera className="h-5 w-5 text-teal-500" />
                    <span className="font-medium">{service.name}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{service.description}</p>
                </CardContent>
                <CardFooter>
                  <div className="flex items-center gap-2">
                    {service.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-20 bg-slate-50 dark:bg-slate-800">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4 mb-12">
            <Badge
              className="mb-2 bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600"
              variant="outline"
            >
              Process
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400">
              How Image Navigation Works
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg md:text-xl max-w-[800px]">
              From photo to destination in three simple steps
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-3 max-w-5xl mx-auto">
            {[
              {
                step: 1,
                title: "Upload or Take a Photo",
                description:
                  "Capture or select an image of a landmark, building, storefront, or any location you want to visit.",
                icon: "Camera",
              },
              {
                step: 2,
                title: "AI Identifies the Location",
                description:
                  "Our technology recognizes the place in your image, even without GPS data, providing details about it.",
                icon: "Cpu",
              },
              {
                step: 3,
                title: "Get Turn-by-Turn Directions",
                description:
                  "Navigate to the identified location with precise directions via your preferred maps service.",
                icon: "Navigation",
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mb-4 relative shadow-lg">
                  {LucideIcons[item.icon] &&
                    React.createElement(LucideIcons[item.icon], {
                      className: "h-8 w-8 text-white",
                    })}
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 text-sm flex items-center justify-center font-medium border border-teal-200 dark:border-teal-800 shadow-sm">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-white">{item.title}</h3>
                <p className="text-slate-600 dark:text-slate-300">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="relative mt-16 max-w-4xl mx-auto">
            <div className="h-0.5 bg-gradient-to-r from-teal-500 to-cyan-500 absolute top-1/2 left-0 right-0 -z-10"></div>
            <div className="flex justify-between">
              {["Upload Photo", "Processing", "Location Identified", "Navigation Options", "Start Journey"].map(
                (step, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div
                      className={`w-4 h-4 rounded-full ${idx <= 3 ? "bg-gradient-to-r from-teal-500 to-cyan-500" : "bg-slate-300 dark:bg-slate-600"} mb-2`}
                    ></div>
                    <span className="text-xs text-slate-600 dark:text-slate-300 text-center max-w-[80px]">{step}</span>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-12 md:py-20 bg-white dark:bg-slate-900">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4 mb-12">
            <Badge
              className="mb-2 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
              variant="outline"
            >
              Key Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400">
              Advanced Navigation Capabilities
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg md:text-xl max-w-[800px]">
              Combining AI image recognition with precise navigation technology
            </p>
          </div>

          <Tabs defaultValue="tab1" className="max-w-5xl mx-auto">
            <TabsList className="grid grid-cols-3 mb-8 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <TabsTrigger
                value="tab1"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-400 rounded-md"
              >
                Recognition
              </TabsTrigger>
              <TabsTrigger
                value="tab2"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-400 rounded-md"
              >
                Navigation
              </TabsTrigger>
              <TabsTrigger
                value="tab3"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-400 rounded-md"
              >
                Experience
              </TabsTrigger>
            </TabsList>
            <AnimatePresence mode="wait">
              <TabsContent value="tab1">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                >
                  {keyFeatures.slice(0, 3).map((feature) => (
                    <Card
                      key={feature.title}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-shadow"
                    >
                      <CardHeader>
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                          {LucideIcons[feature.icon] &&
                            React.createElement(LucideIcons[feature.icon], {
                              className: "h-6 w-6 text-teal-500",
                            })}
                        </div>
                        <CardTitle className="text-slate-800 dark:text-white">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-600 dark:text-slate-300">{feature.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </motion.div>
              </TabsContent>
              <TabsContent value="tab2">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                >
                  {keyFeatures.slice(1, 4).map((feature) => (
                    <Card
                      key={feature.title}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-shadow"
                    >
                      <CardHeader>
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                          {LucideIcons[feature.icon] &&
                            React.createElement(LucideIcons[feature.icon], {
                              className: "h-6 w-6 text-teal-500",
                            })}
                        </div>
                        <CardTitle className="text-slate-800 dark:text-white">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-600 dark:text-slate-300">{feature.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </motion.div>
              </TabsContent>
              <TabsContent value="tab3">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                >
                  {keyFeatures.slice(3, 6).map((feature) => (
                    <Card
                      key={feature.title}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-shadow"
                    >
                      <CardHeader>
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                          {LucideIcons[feature.icon] &&
                            React.createElement(LucideIcons[feature.icon], {
                              className: "h-6 w-6 text-teal-500",
                            })}
                        </div>
                        <CardTitle className="text-slate-800 dark:text-white">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-600 dark:text-slate-300">{feature.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </div>
      </section>

      {/* Service Comparison */}
      <section className="py-12 md:py-20 bg-slate-50 dark:bg-slate-800">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4 mb-12">
            <Badge
              className="mb-2 bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600"
              variant="outline"
            >
              Comparison
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400">
              Navigation Services Compared
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg md:text-xl max-w-[800px]">
              See how different image-based navigation solutions stack up
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left p-4 text-slate-800 dark:text-white">Service</th>
                  <th className="text-left p-4 text-slate-800 dark:text-white">Platform</th>
                  <th className="text-left p-4 text-slate-800 dark:text-white">Recognition Method</th>
                  <th className="text-left p-4 text-slate-800 dark:text-white">Best For</th>
                  <th className="text-left p-4 text-slate-800 dark:text-white">Limitations</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <td className="p-4 font-medium text-slate-800 dark:text-white">Google Lens</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">Android, iOS, Web</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">AI visual recognition</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">Famous landmarks, businesses</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">
                    Requires internet, less effective for generic places
                  </td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <td className="p-4 font-medium text-slate-800 dark:text-white">Apple Visual Look Up</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">iOS/iPadOS</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">On-device AI + Siri Knowledge</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">
                    Privacy-focused users, seamless Apple Maps integration
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">
                    Apple devices only, focuses on notable landmarks
                  </td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <td className="p-4 font-medium text-slate-800 dark:text-white">TomTom GO</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">Android, iOS</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">GPS metadata from photos</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">Navigating to your own photos' locations</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">
                    Requires geotagged photos, subscription-based
                  </td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <td className="p-4 font-medium text-slate-800 dark:text-white">Microsoft Bing Visual Search</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">Web, Mobile apps</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">AI visual recognition</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">
                    Cross-platform users, integrated with Microsoft products
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">
                    Best for known landmarks, requires manual navigation after identification
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-slate-800 dark:text-white">FindPicLocation/Picarta</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">Web-based</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">AI image analysis</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">
                    Finding locations of photos without metadata
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">
                    Limited free searches, accuracy varies with image uniqueness
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Pic2Nav integrates with multiple services to provide the best possible image-based navigation experience
            </p>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <LucideIcons.FileText className="h-4 w-4" />
              View Full Comparison Report
            </Button>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4 mb-12">
            <Badge
              className="mb-2 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
              variant="outline"
            >
              App Experience
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400">
              See It in Action
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg md:text-xl max-w-[800px]">
              A seamless experience across devices with powerful image recognition
            </p>
          </div>

          <div className="relative">
            <div className="flex justify-center items-center gap-6 lg:gap-8 overflow-x-hidden py-10">
              {[
                {
                  text: "Take a photo of landmark",
                  image: "/images/app-screenshot-3.jpg",
                },
                {
                  text: "AI identifies location",
                  image: "/images/app-screenshot-4.jpg",
                },
                {
                  text: "View place details",
                  image: "/images/app-screenshot-5.jpg",
                },
                {
                  text: "Choose navigation method",
                  image: "/images/app-screenshot-6.jpg",
                },
                {
                  text: "Follow turn-by-turn directions",
                  image: "/images/app-screenshot-7.jpg",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className={cn(
                    "relative rounded-xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700",
                    i === 2 ? "w-64 md:w-72 h-[500px] z-10" : "w-48 md:w-56 h-[400px] opacity-80",
                  )}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={`App screenshot: ${item.text}`}
                    className="object-cover w-full h-full"
                  />
                </motion.div>
              ))}
            </div>

            {/* Background glow effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl -z-10"></div>
          </div>

          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <LucideIcons.Apple className="h-8 w-8 mb-2 text-slate-800 dark:text-white" />
                <span className="text-sm font-medium text-slate-800 dark:text-white">iOS App</span>
              </div>
              <div className="flex flex-col items-center">
                <LucideIcons.Smartphone className="h-8 w-8 mb-2 text-slate-800 dark:text-white" />
                <span className="text-sm font-medium text-slate-800 dark:text-white">Android App</span>
              </div>
              <div className="flex flex-col items-center">
                <LucideIcons.Globe className="h-8 w-8 mb-2 text-slate-800 dark:text-white" />
                <span className="text-sm font-medium text-slate-800 dark:text-white">Web Version</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners & Integrations */}
      <section className="py-12 md:py-16 bg-slate-50 dark:bg-slate-800">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-10">
            <p className="text-slate-600 dark:text-slate-300">
              Powered by leading navigation and image recognition technologies
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {partnerLogos.map((partner) => (
              <div
                key={partner.name}
                className="grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
              >
                <img src={partner.logo || "/placeholder.svg"} alt={partner.name} className="h-10 w-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 md:py-20 bg-white dark:bg-slate-900">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4 mb-12">
            <Badge
              className="mb-2 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
              variant="outline"
            >
              Testimonials
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400">
              What Our Users Say
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg md:text-xl max-w-[800px]">
              Real stories from travelers who found their way with Pic2Nav
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {[
              {
                name: "Alice M.",
                location: "New York, USA",
                avatar: "/avatars/avatar1.jpg",
                rating: 5,
                review:
                  "I've been using Pic2Nav for a few months now and it's been a game-changer for my travel photography. I can easily find the locations of my shots and navigate back to them later.",
              },
              {
                name: "John D.",
                location: "London, UK",
                avatar: "/avatars/avatar3.jpg",
                rating: 4,
                review:
                  "The app is very intuitive and the recognition is surprisingly accurate. I've used it to find hidden gems around the city and it's been spot on every time.",
              },
              {
                name: "Maria S.",
                location: "Barcelona, Spain",
                avatar: "/avatars/avatar2.jpg",
                rating: 5,
                review:
                  "I travel a lot for work and Pic2Nav has made it so much easier to navigate new cities. I can take a photo of my hotel and find my way back from anywhere.",
              },
            ].map((testimonial, idx) => (
              <Card
                key={idx}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <img
                      src={testimonial.avatar || "/placeholder.svg"}
                      alt={testimonial.name}
                      className="h-8 w-8 rounded-full"
                    />
                    <div>
                      <div className="font-medium text-slate-800 dark:text-white">{testimonial.name}</div>
                      <div className="text-slate-500 dark:text-slate-400">{testimonial.location}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <LucideIcons.Star className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium text-slate-800 dark:text-white">{testimonial.rating}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-300">{testimonial.review}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-12 md:py-20 bg-slate-50 dark:bg-slate-800">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4 mb-12">
            <Badge
              className="mb-2 bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600"
              variant="outline"
            >
              Pricing
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400">
              Choose Your Plan
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg md:text-xl max-w-[800px]">
              Currently, only the Basic plan is available. More options coming soon!
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {[
              {
                name: "Basic",
                price: "Free",
                description: "Essential image navigation features",
                features: [
                  "5 image recognitions per day",
                  "Basic landmark identification",
                  "Standard navigation options",
                  "Ad-supported experience",
                ],
                cta: "Get Started",
                available: true,
              },
              {
                name: "Premium",
                price: "$4.99/mo",
                description: "Enhanced recognition and navigation (Coming Soon)",
                features: [
                  "Unlimited image recognitions",
                  "Advanced location intelligence",
                  "Multiple navigation providers",
                  "Offline maps for 10 regions",
                  "Ad-free experience",
                ],
                cta: "Unavailable",
                available: false,
              },
              {
                name: "Professional",
                price: "$9.99/mo",
                description: "Complete solution for frequent travelers (Coming Soon)",
                features: [
                  "Everything in Premium",
                  "Highest priority recognition",
                  "Global offline maps",
                  "Historical image analysis",
                  "Commercial usage rights",
                ],
                cta: "Unavailable",
                available: false,
              },
            ].map((plan, idx) => (
              <Card
                key={idx}
                className={cn(
                  "relative flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md",
                  !plan.available && "opacity-50 pointer-events-none",
                )}
              >
                <CardHeader>
                  <CardTitle className="text-slate-800 dark:text-white">{plan.name}</CardTitle>
                  <div className="flex items-baseline mt-2">
                    <span className="text-3xl font-bold text-slate-800 dark:text-white">{plan.price}</span>
                    {plan.price !== "Free" && <span className="text-slate-500 dark:text-slate-400 ml-1">/month</span>}
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <LucideIcons.Check className="h-4 w-4 text-teal-500 mr-2" />
                        <span className="text-sm text-slate-600 dark:text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white border-0"
                    disabled={!plan.available}
                  >
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 md:py-20 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 dark:from-teal-900/30 dark:to-cyan-900/30">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400">
                Ready to Navigate by Image?
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
                Download Pic2Nav today and discover how easy it is to find your way to any place from just a photo.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white border-0"
                >
                  <LucideIcons.Upload className="mr-2 h-5 w-5" />
                  Try It Now
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <LucideIcons.Download className="mr-2 h-5 w-5" />
                  Download App
                </Button>
              </div>
            </div>
            <div className="relative pl-6 hidden lg:block">
              <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-slate-300 dark:via-slate-700 to-transparent"></div>
              <div className="space-y-6">
                {[
                  {
                    icon: "Camera",
                    title: "Works with any photo",
                    description: "From famous landmarks to local storefronts and buildings",
                  },
                  {
                    icon: "Globe",
                    title: "Global coverage",
                    description: "Identify locations across 150+ countries worldwide",
                  },
                  {
                    icon: "Shield",
                    title: "Privacy focused",
                    description: "Your photos are processed securely and not stored without permission",
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center shrink-0">
                      {LucideIcons[item.icon] &&
                        React.createElement(LucideIcons[item.icon], {
                          className: "h-5 w-5 text-teal-500",
                        })}
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-800 dark:text-white">{item.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-100 dark:bg-slate-900 py-12 border-t border-slate-200 dark:border-slate-800">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center">
                  <LucideIcons.Navigation className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-xl text-slate-800 dark:text-white">Pic2Nav</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Transforming navigation with image recognition technology. Find your way to any place from just a photo.
              </p>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="text-slate-500 hover:text-teal-500 dark:text-slate-400 dark:hover:text-teal-400 transition-colors"
                >
                  <LucideIcons.Twitter className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="text-slate-500 hover:text-teal-500 dark:text-slate-400 dark:hover:text-teal-400 transition-colors"
                >
                  <LucideIcons.Instagram className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="text-slate-500 hover:text-teal-500 dark:text-slate-400 dark:hover:text-teal-400 transition-colors"
                >
                  <LucideIcons.Facebook className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="text-slate-500 hover:text-teal-500 dark:text-slate-400 dark:hover:text-teal-400 transition-colors"
                >
                  <LucideIcons.Youtube className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-4 text-slate-800 dark:text-white">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="#"
                    className="text-slate-600 hover:text-teal-500 dark:text-slate-300 dark:hover:text-teal-400 transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-slate-600 hover:text-teal-500 dark:text-slate-300 dark:hover:text-teal-400 transition-colors"
                  >
                    Supported Services
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-slate-600 hover:text-teal-500 dark:text-slate-300 dark:hover:text-teal-400 transition-colors"
                  >
                    Testimonials
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-slate-600 hover:text-teal-500 dark:text-slate-300 dark:hover:text-teal-400 transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-4 text-slate-800 dark:text-white">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="#"
                    className="text-slate-600 hover:text-teal-500 dark:text-slate-300 dark:hover:text-teal-400 transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-slate-600 hover:text-teal-500 dark:text-slate-300 dark:hover:text-teal-400 transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-slate-600 hover:text-teal-500 dark:text-slate-300 dark:hover:text-teal-400 transition-colors"
                  >
                    Research
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-slate-600 hover:text-teal-500 dark:text-slate-300 dark:hover:text-teal-400 transition-colors"
                  >
                    API
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-4 text-slate-800 dark:text-white">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="#"
                    className="text-slate-600 hover:text-teal-500 dark:text-slate-300 dark:hover:text-teal-400 transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-slate-600 hover:text-teal-500 dark:text-slate-300 dark:hover:text-teal-400 transition-colors"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-slate-600 hover:text-teal-500 dark:text-slate-300 dark:hover:text-teal-400 transition-colors"
                  >
                    Press
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-slate-600 hover:text-teal-500 dark:text-slate-300 dark:hover:text-teal-400 transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 md:mb-0">
              © {new Date().getFullYear()} Pic2Nav. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="#"
                className="text-sm text-slate-600 hover:text-teal-500 dark:text-slate-300 dark:hover:text-teal-400 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                className="text-sm text-slate-600 hover:text-teal-500 dark:text-slate-300 dark:hover:text-teal-400 transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="#"
                className="text-sm text-slate-600 hover:text-teal-500 dark:text-slate-300 dark:hover:text-teal-400 transition-colors"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

