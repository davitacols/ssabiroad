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
    router.push("/signin")
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

  // Replace the entire component with a more visually appealing design with modern animations
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 overflow-hidden">
      <AnimatePresence mode="wait">
        {isLoading ? (
          // Enhanced Loading Screen with more dynamic animations
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
            className="flex flex-col items-center justify-center min-h-screen p-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="relative w-28 h-28 mb-10"
            >
              {/* Animated rings */}
              <motion.div
                animate={{
                  rotate: 360,
                  boxShadow: [
                    "0 0 20px rgba(20,184,166,0.3)",
                    "0 0 30px rgba(20,184,166,0.6)",
                    "0 0 20px rgba(20,184,166,0.3)",
                  ],
                }}
                transition={{
                  rotate: { duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                  boxShadow: { duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" },
                }}
                className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-500/20 to-cyan-500/20"
              />
              <motion.div
                animate={{
                  rotate: -360,
                  boxShadow: [
                    "0 0 15px rgba(6,182,212,0.3)",
                    "0 0 25px rgba(6,182,212,0.6)",
                    "0 0 15px rgba(6,182,212,0.3)",
                  ],
                }}
                transition={{
                  rotate: { duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                  boxShadow: { duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse", delay: 0.5 },
                }}
                className="absolute inset-3 rounded-full bg-gradient-to-r from-cyan-500/20 to-teal-500/20"
              />
              <motion.div
                animate={{
                  rotate: 180,
                  boxShadow: [
                    "0 0 10px rgba(8,145,178,0.3)",
                    "0 0 20px rgba(8,145,178,0.6)",
                    "0 0 10px rgba(8,145,178,0.3)",
                  ],
                }}
                transition={{
                  rotate: { duration: 7, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                  boxShadow: { duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse", delay: 1 },
                }}
                className="absolute inset-6 rounded-full bg-gradient-to-r from-cyan-600/20 to-teal-600/20"
              />
              {/* Center logo */}
              <div className="absolute inset-9 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                <Navigation className="h-8 w-8 text-white" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-4xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent"
            >
              Pic2Nav
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-4 text-sm text-slate-500 dark:text-slate-400"
            >
              Navigate the world through your lens
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="mt-16"
            >
              <div className="flex space-x-3">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [0.8, 1.2, 0.8],
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: i * 0.3,
                      ease: "easeInOut",
                    }}
                    className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500"
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          // Enhanced Content Screen with more dynamic elements
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col min-h-screen relative"
          >
            {/* Animated background elements */}
            <motion.div
              animate={{
                y: [10, -10, 10],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 15,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="absolute top-1/4 left-0 w-40 h-40 rounded-full bg-teal-500/10 blur-3xl"
            />
            <motion.div
              animate={{
                y: [-10, 10, -10],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 18,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="absolute bottom-1/4 right-0 w-60 h-60 rounded-full bg-cyan-500/10 blur-3xl"
            />

            {/* Enhanced Header with floating effect */}
            <motion.header
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="pt-12 px-6 flex items-center justify-between relative z-10"
            >
              <div className="flex items-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center mr-3 shadow-md"
                >
                  <Navigation className="h-6 w-6 text-white" />
                </motion.div>
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="text-2xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent"
                >
                  Pic2Nav
                </motion.span>
              </div>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-md"
              >
                <Menu className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </motion.button>
            </motion.header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col px-6 pt-8 relative z-10">
              {/* Enhanced App Tagline with staggered animation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-center mb-10"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Badge className="mb-4 px-4 py-1.5 bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400 border-0 rounded-full font-medium shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Visual Navigation
                  </Badge>
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="text-3xl font-bold mb-3 leading-tight"
                >
                  Explore the world <br /> through your lens
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  className="text-sm text-slate-600 dark:text-slate-300 max-w-xs mx-auto"
                >
                  Instantly recognize places and navigate to them with a single photo
                </motion.p>
              </motion.div>

              {/* Enhanced App Preview with 3D effect */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="relative mx-auto mb-12 w-full max-w-xs aspect-[9/16]"
                whileHover={{
                  rotateY: 5,
                  rotateX: -5,
                  scale: 1.02,
                  transition: { duration: 0.3 },
                }}
              >
                <div className="absolute inset-0 rounded-3xl overflow-hidden border-[12px] border-slate-100 dark:border-slate-800 shadow-2xl">
                  {/* Phone background with gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800"></div>

                  {/* Animated overlay effects */}
                  <motion.div
                    animate={{
                      opacity: [0.4, 0.6, 0.4],
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY }}
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
                    <div className="absolute inset-0 bg-[url('/placeholder.svg?height=500&width=300')] bg-cover bg-center opacity-30 blur-sm"></div>

                    {/* Map elements */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                        className="w-24 h-24 rounded-full bg-slate-200/50 dark:bg-slate-700/50 backdrop-blur-md"
                      ></motion.div>
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.5 }}
                        className="absolute w-16 h-16 rounded-full bg-slate-200/80 dark:bg-slate-700/80 backdrop-blur-md"
                      ></motion.div>
                      <motion.div
                        animate={{
                          scale: [1, 1.15, 1],
                          boxShadow: [
                            "0 0 0 rgba(20,184,166,0.4)",
                            "0 0 20px rgba(20,184,166,0.6)",
                            "0 0 0 rgba(20,184,166,0.4)",
                          ],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                          boxShadow: { duration: 3, repeat: Number.POSITIVE_INFINITY },
                        }}
                        className="absolute w-12 h-12 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg"
                      >
                        <MapPin className="h-6 w-6 text-white" />
                      </motion.div>
                    </div>

                    {/* Animated pulse indicators */}
                    <motion.div
                      animate={{
                        scale: [1, 2, 1],
                        opacity: [0.7, 0, 0.7],
                      }}
                      transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeOut" }}
                      className="absolute top-1/3 left-1/4 w-6 h-6 rounded-full bg-teal-500/30"
                    ></motion.div>

                    <motion.div
                      animate={{
                        scale: [1, 2, 1],
                        opacity: [0.7, 0, 0.7],
                      }}
                      transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeOut", delay: 1 }}
                      className="absolute bottom-1/3 right-1/4 w-4 h-4 rounded-full bg-cyan-500/30"
                    ></motion.div>

                    {/* Enhanced Info Cards with hover effect */}
                    <motion.div
                      initial={{ opacity: 0, y: 10, x: 5 }}
                      animate={{ opacity: 1, y: 0, x: 0 }}
                      transition={{ delay: 1.2, duration: 0.6 }}
                      whileHover={{
                        scale: 1.05,
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                      }}
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
                        <div className="text-[10px] bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-full">
                          12 min
                        </div>
                      </div>
                    </motion.div>

                    {/* Navigation path with animation */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 80 }}
                      transition={{ delay: 1.4, duration: 0.8, ease: "easeOut" }}
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
                      animate={{ scale: [1, 1.3, 1], opacity: 1 }}
                      transition={{
                        scale: { delay: 2, duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
                        opacity: { delay: 2, duration: 0.5 },
                      }}
                      className="absolute bottom-[25%] left-[40%] w-4 h-4 -ml-[6px] -mt-[6px] rounded-full bg-cyan-500 border-2 border-white dark:border-slate-800 shadow-lg shadow-cyan-500/30"
                    ></motion.div>
                  </div>

                  {/* Enhanced Bottom Navigation */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-around px-4">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center shadow-md shadow-teal-500/20">
                        <Camera className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-[10px] mt-1 font-medium">Camera</span>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                      </div>
                      <span className="text-[10px] mt-1 font-medium">Places</span>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        <Navigation className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                      </div>
                      <span className="text-[10px] mt-1 font-medium">Routes</span>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Enhanced Intro Steps with more dynamic transitions */}
              <div className="mb-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-center"
                  >
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{
                        scale: 1,
                        opacity: 1,
                        boxShadow: [
                          "0 0 0 rgba(20,184,166,0.3)",
                          "0 0 20px rgba(20,184,166,0.5)",
                          "0 0 0 rgba(20,184,166,0.3)",
                        ],
                      }}
                      transition={{
                        duration: 0.6,
                        boxShadow: { duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" },
                      }}
                      className="w-16 h-16 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center mx-auto mb-5 shadow-lg"
                    >
                      {React.createElement(introSteps[currentStep].icon, { className: "h-8 w-8 text-white" })}
                    </motion.div>
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.6 }}
                      className="text-2xl font-bold mb-3"
                    >
                      {introSteps[currentStep].title}
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      className="text-sm text-slate-600 dark:text-slate-300 max-w-xs mx-auto"
                    >
                      {introSteps[currentStep].description}
                    </motion.p>
                  </motion.div>
                </AnimatePresence>

                <div className="flex justify-center mt-8 gap-2">
                  {introSteps.map((_, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      className={`relative h-2.5 transition-all duration-300 ${
                        index === currentStep
                          ? "w-10 bg-gradient-to-r from-teal-500 to-cyan-500"
                          : "w-2.5 bg-slate-300 dark:bg-slate-600"
                      } rounded-full`}
                    >
                      {index === currentStep && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Enhanced Call to Action Buttons with hover effects */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="flex flex-col gap-4 mb-8 px-4"
              >
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white border-0 h-14 w-full rounded-full shadow-lg shadow-teal-500/20 transition-all duration-300"
                    onClick={handleTakePhoto}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                      className="flex items-center"
                    >
                      <Camera className="mr-2 h-5 w-5" />
                      <span className="font-medium">Take a Photo Now</span>
                    </motion.div>
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 h-14 w-full rounded-full shadow-md transition-all duration-300"
                    onClick={handleGetStarted}
                  >
                    <ArrowRight className="mr-2 h-5 w-5" />
                    <span className="font-medium">Get Started</span>
                  </Button>
                </motion.div>
              </motion.div>
            </main>

            {/* Enhanced Footer with fade-in animation */}
            <motion.footer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="py-6 px-6 text-center relative z-10"
            >
              <p className="text-xs text-slate-500 dark:text-slate-400">
                By continuing, you agree to our{" "}
                <a href="#" className="text-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                  Terms
                </a>{" "}
                and{" "}
                <a href="#" className="text-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
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

