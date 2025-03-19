"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Camera, Navigation, MapPin, ArrowRight, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function MobileSplashScreen() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // Auto-advance through intro steps
  useEffect(() => {
    if (isLoading) return

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < 2 ? prev + 1 : prev))
    }, 3000)

    return () => clearInterval(interval)
  }, [isLoading])

  // Handle navigation to main app
  const handleGetStarted = () => {
    router.push("/dashboard")
  }

  // Handle camera access
  const handleTakePhoto = () => {
    // In a real app, this would request camera permissions
    // and open the camera interface
    router.push("/camera")
  }

  // Intro steps content
  const introSteps = [
    {
      icon: Camera,
      title: "Take a photo of any place",
      description: "Snap a picture of a landmark, building, or storefront",
    },
    {
      icon: Sparkles,
      title: "AI identifies the location",
      description: "Our technology recognizes the place instantly",
    },
    {
      icon: Navigation,
      title: "Get turn-by-turn directions",
      description: "Navigate to the location with precise guidance",
    },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <AnimatePresence>
        {isLoading ? (
          // Loading Screen
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-screen p-6"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <Navigation className="h-10 w-10 text-white" />
            </div>

            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
              }}
              className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400 bg-clip-text text-transparent"
            >
              Pic2Nav
            </motion.div>

            <div className="mt-8 flex justify-center">
              <div className="w-8 h-8 relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-transparent border-t-teal-500 border-r-teal-500"
                />
              </div>
            </div>
          </motion.div>
        ) : (
          // Splash Screen Content
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col min-h-screen"
          >
            {/* Header with Logo */}
            <header className="pt-12 pb-6 px-6">
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center mr-3 shadow-md">
                  <Navigation className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  Pic2Nav
                </span>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col px-6">
              {/* App Tagline */}
              <div className="text-center mb-8">
                <Badge className="mb-3 px-3 py-1 bg-teal-500/10 text-teal-600 dark:text-teal-400 font-medium">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Image-Based Navigation
                </Badge>
                <h1 className="text-2xl font-bold mb-2">Navigate to any place from a photo</h1>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                  Identify landmarks, buildings, and locations with just a picture
                </p>
              </div>

              {/* App Preview Illustration */}
              <div className="relative mx-auto mb-8 w-full max-w-xs aspect-[9/16]">
                <div className="absolute inset-0 rounded-3xl overflow-hidden border-8 border-slate-200 dark:border-slate-700 shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-cyan-500/20"></div>

                  {/* Mock UI Elements */}
                  <div className="absolute top-0 left-0 right-0 h-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm flex items-center px-4">
                    <div className="w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center">
                      <Navigation className="h-2 w-2 text-white" />
                    </div>
                    <span className="ml-2 text-xs font-medium">Pic2Nav</span>
                  </div>

                  {/* AR Overlay Elements */}
                  <div className="absolute top-1/4 left-1/4 h-8 w-8 rounded-full bg-teal-500/30 animate-pulse shadow-[0_0_20px_rgba(20,184,166,0.5)]"></div>
                  <div className="absolute top-1/2 right-1/3 h-6 w-6 rounded-full bg-amber-500/40 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.6)]"></div>

                  {/* Information Card */}
                  <div className="absolute top-[30%] left-[20%] w-32 p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 text-xs">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-teal-500" />
                      <span className="font-bold text-[10px]">Eiffel Tower</span>
                    </div>
                    <div className="mt-1 text-[8px] text-slate-500 dark:text-slate-400">Navigate • 2.7 km away</div>
                  </div>

                  {/* Navigation Path */}
                  <div className="absolute top-[45%] left-[40%] w-1 h-20 bg-teal-500/50 rounded-full"></div>
                  <div className="absolute top-[45%] left-[40%] w-4 h-4 rounded-full bg-teal-500 border-2 border-white"></div>
                  <div className="absolute bottom-[25%] left-[40%] w-4 h-4 rounded-full bg-red-500 border-2 border-white animate-pulse"></div>

                  {/* Bottom Controls */}
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 flex items-center justify-around px-4">
                    <div className="flex flex-col items-center">
                      <Camera className="h-4 w-4 text-teal-500" />
                      <span className="text-[8px] mt-0.5">Camera</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="text-[8px] mt-0.5">Places</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Navigation className="h-4 w-4 text-slate-400" />
                      <span className="text-[8px] mt-0.5">Navigate</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Intro Steps */}
              <div className="mb-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                      {React.createElement(introSteps[currentStep].icon, { className: "h-6 w-6 text-white" })}
                    </div>
                    <h3 className="text-lg font-bold mb-2">{introSteps[currentStep].title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                      {introSteps[currentStep].description}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div className="flex justify-center mt-6 gap-2">
                  {introSteps.map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentStep ? "bg-teal-500" : "bg-slate-300 dark:bg-slate-600"
                      }`}
                      onClick={() => setCurrentStep(index)}
                    />
                  ))}
                </div>
              </div>

              {/* Call to Action Buttons */}
              <div className="flex flex-col gap-3 mb-8 px-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white border-0 h-12 rounded-full"
                  onClick={handleTakePhoto}
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Take a Photo Now
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 h-12 rounded-full"
                  onClick={handleGetStarted}
                >
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Get Started
                </Button>
              </div>
            </main>

            {/* Footer */}
            <footer className="py-6 px-6 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                By continuing, you agree to our{" "}
                <a href="#" className="underline">
                  Terms
                </a>{" "}
                and{" "}
                <a href="#" className="underline">
                  Privacy Policy
                </a>
              </p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

