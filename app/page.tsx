"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import * as LucideIcons from "lucide-react"

// 🚀 Define Features & Plans Data
const features = [
  { icon: "Architecture", title: "Instant Recognition", desc: "Identify buildings in real-time with high accuracy." },
  { icon: "Database", title: "Rich Information", desc: "Access detailed architectural and historical data." },
  { icon: "Globe", title: "Global Coverage", desc: "Supports buildings worldwide with local context." },
]

const plans = [
  { icon: "Building2", title: "Personal", price: "Free", features: ["Building Recognition", "Basic Info", "5 Scans/Day"] },
  { icon: "Landmark", title: "Professional", price: "Custom", features: ["Advanced Analytics", "Historical Data", "Unlimited Scans"] },
]

const ModernHome = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleGetStarted = useCallback(() => {
    router.push("/dashboard")
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      
      {/* 🔥 Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? "bg-white/90 backdrop-blur-xl shadow-sm dark:bg-gray-900/90" : "bg-transparent"}`}>
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <LucideIcons.Building className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                SabiRoad
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {["Features", "Solutions", "Pricing"].map((item) => (
                <Button key={item} variant="ghost" className="text-sm font-medium">{item}</Button>
              ))}
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90" onClick={handleGetStarted}>
                Get Started <LucideIcons.ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* 🔥 Hero Section */}
      <section className="pt-32 pb-20 text-center">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-8">
            <LucideIcons.Star className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">AI-Powered Building Detection</span>
          </div>

          <h1 className="text-6xl font-bold mb-6 leading-tight">
            Identify Buildings{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Instantly
            </span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10">
            Experience intelligent building recognition powered by AI. Get instant architectural insights.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 h-12 px-8" onClick={handleGetStarted}>
              Try Now <LucideIcons.Camera className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" className="h-12 px-8">Watch Demo</Button>
          </div>
        </div>
      </section>

      {/* 🔥 Features Section */}
      <section className="py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 grid md:grid-cols-3 gap-8">
          {features.map(({ icon, title, desc }, i) => {
            const IconComponent = LucideIcons[icon]
            return (
              <Card key={i} className="p-6 hover:shadow-lg transition-all border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                  {IconComponent ? <IconComponent className="w-6 h-6 text-white" /> : null}
                </div>
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{desc}</p>
              </Card>
            )
          })}
        </div>
      </section>

      {/* 🔥 Pricing Plans */}
      <section className="py-20">
        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-8">
          {plans.map(({ icon, title, price, features }, i) => {
            const PlanIcon = LucideIcons[icon]
            return (
              <Card key={i} className="p-8 hover:shadow-xl transition-all border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl flex items-center justify-center mb-4">
                      {PlanIcon ? <PlanIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" /> : null}
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{title}</h3>
                    <p className="text-4xl font-bold mb-6">{price}</p>
                    <ul className="space-y-2">
                      {features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <LucideIcons.Check className="w-4 h-4 text-blue-600" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90" onClick={handleGetStarted}>
                    Get Started
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default ModernHome
// Compare this snippet from app/api/process-image/index.ts:
// // app/api/process-image/index.ts