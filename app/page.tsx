"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Camera, Navigation, MapPin, Upload, Play, Star, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlacesAutocomplete } from "@/components/places-autocomplete"
import { AppNavbar } from "@/components/app-navbar"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  const [searchValue, setSearchValue] = useState("")

  const features = [
    {
      icon: Camera,
      title: "Photo Recognition",
      description: "Upload any photo and instantly identify landmarks, buildings, or locations with 95% accuracy."
    },
    {
      icon: Navigation,
      title: "Smart Navigation",
      description: "Get turn-by-turn directions to identified locations using your preferred map service."
    },
    {
      icon: MapPin,
      title: "Global Coverage",
      description: "Works worldwide with millions of landmarks, businesses, and points of interest."
    }
  ]

  const steps = [
    { step: 1, title: "Upload Photo", description: "Take or upload a photo of any location" },
    { step: 2, title: "AI Analysis", description: "Our AI identifies the place instantly" },
    { step: 3, title: "Navigate", description: "Get directions to your destination" }
  ]

  const handleSearch = (place: string) => {
    if (place.trim()) {
      const encodedPlace = encodeURIComponent(place)
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedPlace}`, "_blank")
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <AppNavbar />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-6 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                AI-Powered Navigation
              </Badge>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Navigate from Photos
              </h1>
              
              <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
                Upload any photo and instantly get directions to that location. 
                AI-powered recognition works with landmarks, buildings, and places worldwide.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button size="lg" className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700">
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Photo
                </Button>
                <Button size="lg" variant="outline">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>
            </motion.div>
            
            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-2xl mx-auto"
            >
              <div className="relative">
                <PlacesAutocomplete
                  placeholder="Search for a place or upload a photo..."
                  className="w-full h-14 pl-12 pr-4 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-lg"
                  onPlaceSelect={handleSearch}
                  renderInput={(props) => (
                    <input
                      {...props}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSearch(props.value)
                      }}
                    />
                  )}
                />
                <Camera className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Background Elements */}
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Advanced AI technology makes photo-based navigation simple and accurate
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="text-center h-full border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 dark:text-slate-300">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Simple 3-Step Process
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              From photo to destination in seconds
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center max-w-xs">
                <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-slate-600 dark:text-slate-300">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute w-24 h-0.5 bg-gradient-to-r from-teal-500 to-cyan-500 transform translate-x-20 mt-8" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Start Navigating with Photos Today
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
            Join thousands of users who navigate smarter with AI-powered photo recognition.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700">
              <Upload className="mr-2 h-5 w-5" />
              Get Started Free
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
          
          <div className="mt-12 grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { icon: Star, text: "95% accuracy rate" },
              { icon: MapPin, text: "Global coverage" },
              { icon: Check, text: "Free to start" }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300">
                <item.icon className="h-5 w-5 text-teal-500" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-100 dark:bg-slate-900 py-8 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} Pic2Nav. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

