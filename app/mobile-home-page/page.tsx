"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Camera, Navigation, MapPin, ArrowRight, Sparkles, Menu } from "lucide-react"

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
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  // Auto-advance through intro steps
  useEffect(() => {
    if (isLoading) return

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < 2 ? prev + 1 : prev))
    }, 4000)

    return () => clearInterval(interval)
  }, [isLoading])

  // Handle navigation to main app
  const handleGetStarted = () => {
    router.push("/dashboard")
  }

  // Handle camera access
  const handleTakePhoto = () => {
    router.push("/camera")
  }

  // Intro steps content
  const introSteps = [
    {
      icon: Camera,
      title: "Capture Any Location",
      description: "Point your camera at any landmark or place you want to explore",
    },
    {
      icon: Sparkles,
      title: "Instant AI Recognition",
      description: "Our advanced AI identifies the location in milliseconds",
    },
    {
      icon: Navigation,
      title: "Smart Navigation",
      description: "Get personalized routes and real-time guidance",
    },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <AnimatePresence mode="wait">
        {isLoading ? (
          // Enhanced Loading Screen
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="flex flex-col items-center justify-center min-h-screen p-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative w-24 h-24 mb-8"
            >
              <motion.div
                animate={{ 
                  rotate: 360,
                  boxShadow: ["0 0 15px rgba(20,184,166,0.3)", "0 0 25px rgba(20,184,166,0.6)", "0 0 15px rgba(20,184,166,0.3)"]
                }}
                transition={{ 
                  rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                  boxShadow: { duration: 2, repeat: Infinity, repeatType: "reverse" }
                }}
                className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-500/20 to-cyan-500/20"
              />
              <motion.div
                animate={{ 
                  rotate: -360,
                  boxShadow: ["0 0 15px rgba(6,182,212,0.3)", "0 0 25px rgba(6,182,212,0.6)", "0 0 15px rgba(6,182,212,0.3)"]
                }}
                transition={{ 
                  rotate: { duration: 12, repeat: Infinity, ease: "linear" },
                  boxShadow: { duration: 2, repeat: Infinity, repeatType: "reverse", delay: 0.5 }
                }}
                className="absolute inset-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-teal-500/20"
              />
              <div className="absolute inset-4 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                <Navigation className="h-8 w-8 text-white" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-3xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent"
            >
              Pic2Nav
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-4 text-sm text-slate-500 dark:text-slate-400"
            >
              Discover the world through your camera
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ delay: 0.8, duration: 2, repeat: Infinity }}
              className="mt-12"
            >
              <div className="flex space-x-2">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [0.8, 1, 0.8] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    className="w-2 h-2 rounded-full bg-teal-500"
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          // Enhanced Content Screen
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col min-h-screen"
          >
            {/* Enhanced Header */}
            <header className="pt-12 px-6 flex items-center justify-between">
              <div className="flex items-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-10 h-10 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center mr-3 shadow-md"
                >
                  <Navigation className="h-5 w-5 text-white" />
                </motion.div>
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent"
                >
                  Pic2Nav
                </motion.span>
              </div>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
              >
                <Menu className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              </motion.button>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col px-6 pt-8">
              {/* Enhanced App Tagline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-center mb-10"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <Badge className="mb-4 px-3 py-1.5 bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400 border-0 rounded-full font-medium">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Visual Navigation
                  </Badge>
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="text-3xl font-bold mb-3 leading-tight"
                >
                  Explore the world <br /> through your lens
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="text-sm text-slate-600 dark:text-slate-300 max-w-xs mx-auto"
                >
                  Instantly recognize places and navigate to them with a single photo
                </motion.p>
              </motion.div>

              {/* Enhanced App Preview */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.7 }}
                className="relative mx-auto mb-12 w-full max-w-xs aspect-[9/16]"
              >
                <div className="absolute inset-0 rounded-3xl overflow-hidden border-[12px] border-slate-100 dark:border-slate-800 shadow-2xl">
                  {/* Phone background with gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800"></div>
                  
                  {/* Animated overlay effects */}
                  <motion.div
                    animate={{ 
                      opacity: [0.4, 0.6, 0.4],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-300/10 via-transparent to-transparent"
                  ></motion.div>
                  
                  {/* Status bar */}
                  <div className="absolute top-0 left-0 right-0 h-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md flex items-center justify-between px-4 z-10">
                    <div className="text-[8px] font-medium">09:41</div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                      <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                      <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                    </div>
                  </div>

                  {/* Mockup scene with depth */}
                  <div className="absolute inset-0 mt-6">
                    {/* Blurred background image */}
                    <div className="absolute inset-0 bg-[url('/api/placeholder/300/500')] bg-cover bg-center opacity-30 blur-sm"></div>
                    
                    {/* Map elements */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-slate-200/50 dark:bg-slate-700/50 backdrop-blur-md"></div>
                      <div className="absolute w-16 h-16 rounded-full bg-slate-200/80 dark:bg-slate-700/80 backdrop-blur-md"></div>
                      <div className="absolute w-10 h-10 rounded-full bg-teal-500/90 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-white" />
                      </div>
                    </div>

                    {/* Animated pulse indicators */}
                    <motion.div
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.8, 0, 0.8],
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute top-1/3 left-1/4 w-6 h-6 rounded-full bg-teal-500/30"
                    ></motion.div>
                    
                    <motion.div
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.8, 0, 0.8],
                      }}
                      transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                      className="absolute bottom-1/3 right-1/4 w-4 h-4 rounded-full bg-cyan-500/30"
                    ></motion.div>

                    {/* Enhanced Info Cards */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2, duration: 0.5 }}
                      className="absolute top-[30%] left-[10%] w-36 p-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700/50"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                          <MapPin className="h-4 w-4 text-teal-500" />
                        </div>
                        <div>
                          <div className="font-bold text-xs">Eiffel Tower</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">Paris, France</div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">2.7 km away</div>
                        <div className="text-[10px] bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-full">12 min</div>
                      </div>
                    </motion.div>

                    {/* Navigation path with animation */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 80 }}
                      transition={{ delay: 1.4, duration: 0.8 }}
                      className="absolute top-[45%] left-[40%] w-1.5 bg-gradient-to-b from-teal-500 to-cyan-500 rounded-full"
                    ></motion.div>
                    
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 1.4, duration: 0.5 }}
                      className="absolute top-[45%] left-[40%] w-4 h-4 -ml-[6px] -mt-[6px] rounded-full bg-teal-500 border-2 border-white dark:border-slate-800"
                    ></motion.div>
                    
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                      transition={{ 
                        scale: { delay: 2, duration: 1.5, repeat: Infinity },
                        opacity: { delay: 2, duration: 0.5 }
                      }}
                      className="absolute bottom-[25%] left-[40%] w-4 h-4 -ml-[6px] -mt-[6px] rounded-full bg-cyan-500 border-2 border-white dark:border-slate-800"
                    ></motion.div>
                  </div>

                  {/* Enhanced Bottom Navigation */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-around px-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center">
                        <Camera className="h-5 w-5 text-teal-500" />
                      </div>
                      <span className="text-[10px] mt-1 font-medium">Camera</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                      </div>
                      <span className="text-[10px] mt-1 font-medium">Places</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        <Navigation className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                      </div>
                      <span className="text-[10px] mt-1 font-medium">Routes</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Enhanced Intro Steps */}
              <div className="mb-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                  >
                    <div className="w-14 h-14 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-md">
                      {React.createElement(introSteps[currentStep].icon, { className: "h-7 w-7 text-white" })}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{introSteps[currentStep].title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                      {introSteps[currentStep].description}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div className="flex justify-center mt-8 gap-2">
                  {introSteps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`relative h-2 transition-all duration-300 ${
                        index === currentStep ? "w-8 bg-gradient-to-r from-teal-500 to-cyan-500" : "w-2 bg-slate-300 dark:bg-slate-600"
                      } rounded-full`}
                    />
                  ))}
                </div>
              </div>

              {/* Enhanced Call to Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="flex flex-col gap-3 mb-8 px-4"
              >
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white border-0 h-14 rounded-full shadow-md shadow-teal-500/20 transition-all duration-300"
                  onClick={handleTakePhoto}
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex items-center"
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    <span className="font-medium">Take a Photo Now</span>
                  </motion.div>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 h-14 rounded-full shadow-sm transition-all duration-300"
                  onClick={handleGetStarted}
                >
                  <ArrowRight className="mr-2 h-5 w-5" />
                  <span className="font-medium">Get Started</span>
                </Button>
              </motion.div>
            </main>

            {/* Enhanced Footer */}
            <motion.footer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="py-6 px-6 text-center"
            >
              <p className="text-xs text-slate-500 dark:text-slate-400">
                By continuing, you agree to our{" "}
                <a href="#" className="text-teal-500 hover:underline">
                  Terms
                </a>{" "}
                and{" "}
                <a href="#" className="text-teal-500 hover:underline">
                  Privacy Policy
                </a>
              </p>
            </motion.footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}