'use client'

import { useState } from 'react'
import Link from "next/link"
import {
  Navigation,
  Shield,
  Globe,
  Users,
  Menu,
  ChevronRight,
  Star,
  ArrowRight,
  Play,
  Compass,
  MapPin,
  Github,
  Twitter,
  Linkedin
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const features = [
  {
    icon: Navigation,
    title: "Smart AI Navigation",
    description: "Personalized routes that adapt to your preferences and real-time conditions"
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-grade encryption and compliance with global privacy standards"
  },
  {
    icon: Globe,
    title: "Global Coverage",
    description: "High-definition maps and seamless navigation across every continent"
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Share routes, locations, and insights in real-time with your team"
  },
  {
    icon: Compass,
    title: "Offline Maps",
    description: "Full functionality even in remote areas with no connection"
  },
  {
    icon: MapPin,
    title: "Smart Markers",
    description: "Rich, interactive waypoints with photos, notes, and team sharing"
  }
]

// Interactive map with animated paths and markers
const MapDisplay = () => {
  return (
    <div className="relative w-full h-full bg-gray-50/50 rounded-3xl overflow-hidden backdrop-blur-sm">
      {/* Grid background */}
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, rgba(59, 130, 246, 0.15) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-2 h-2 bg-blue-400/10 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`
            }}
          />
        ))}
      </div>
      
      <div className="absolute inset-0">
        {/* Original city markers */}
        {[
          { x: 25, y: 35, name: "New York" },
          { x: 75, y: 45, name: "London" },
          { x: 45, y: 65, name: "Tokyo" }
        ].map((city, i) => (
          <div key={i} className="absolute animate-pulse" style={{
            left: `${city.x}%`,
            top: `${city.y}%`,
            transform: 'translate(-50%, -50%)',
            animation: `pulse ${1 + i * 0.2}s cubic-bezier(0.4, 0, 0.6, 1) infinite`
          }}>
            {/* Outer ring */}
            <div className="absolute w-6 h-6 bg-blue-500/10 rounded-full animate-ping" 
                 style={{ animationDuration: '2s' }} />
            {/* Main marker */}
            <div className="w-4 h-4 bg-blue-500/20 rounded-full">
              <div className="w-2 h-2 bg-blue-600 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            {/* City label */}
            <div className="mt-2 px-3 py-1 bg-white/90 rounded-full shadow-sm">
              <span className="text-xs font-medium text-gray-700">{city.name}</span>
            </div>
          </div>
        ))}

        {/* Compass rose */}
        <div className="absolute top-4 right-4 w-16 h-16 opacity-30">
          <div className="absolute inset-0 animate-spin-slow">
            <div className="absolute top-0 left-1/2 w-0.5 h-8 bg-blue-600/20 -translate-x-1/2" />
            <div className="absolute bottom-0 left-1/2 w-0.5 h-8 bg-blue-600/20 -translate-x-1/2" />
            <div className="absolute left-0 top-1/2 h-0.5 w-8 bg-blue-600/20 -translate-y-1/2" />
            <div className="absolute right-0 top-1/2 h-0.5 w-8 bg-blue-600/20 -translate-y-1/2" />
          </div>
          <div className="absolute inset-0 animate-spin-slow" style={{ animationDelay: '-1s' }}>
            <div className="absolute top-1 left-1/2 w-0.5 h-7 bg-blue-600/10 -translate-x-1/2 rotate-45" />
            <div className="absolute bottom-1 left-1/2 w-0.5 h-7 bg-blue-600/10 -translate-x-1/2 rotate-45" />
            <div className="absolute left-1 top-1/2 h-0.5 w-7 bg-blue-600/10 -translate-y-1/2 rotate-45" />
            <div className="absolute right-1 top-1/2 h-0.5 w-7 bg-blue-600/10 -translate-y-1/2 rotate-45" />
          </div>
        </div>

        {/* Connection paths */}
        <svg className="absolute inset-0 w-full h-full">
          {/* Background glow effect */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Main path */}
          <path
            d="M25 35 Q50 20 75 45 T45 65"
            stroke="url(#blue-gradient)"
            strokeWidth="2"
            fill="none"
            className="animate-dash"
            filter="url(#glow)"
          />
          
          {/* Secondary paths */}
          <path
            d="M25 35 Q40 40 45 65"
            stroke="url(#blue-gradient)"
            strokeWidth="1"
            fill="none"
            className="animate-dash"
            style={{ animationDelay: '0.5s' }}
            opacity="0.3"
          />
          
          <defs>
            <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.2)" />
              <stop offset="100%" stopColor="rgba(99, 102, 241, 0.2)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Central marker */}
        <div className="absolute animate-bounce" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
          <div className="w-6 h-6">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
            <div className="absolute inset-0 bg-blue-600/90 rounded-full transform scale-50" />
          </div>
        </div>

        {/* Scale indicators */}
        <div className="absolute bottom-4 left-4 flex space-x-1 opacity-30">
          {[...Array(3)].map((_, i) => (
            <div
              key={`scale-${i}`}
              className="h-4"
              style={{
                width: `${(i + 1) * 12}px`,
                backgroundColor: 'rgba(59, 130, 246, 0.2)'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

const Home = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-blue-50">
      {/* Navbar */}
      <header className="fixed w-full bg-white/80 backdrop-blur-xl border-b border-gray-100/50 z-50">
        <nav className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Navigation className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">
                Sabi<span className="text-blue-600">Road</span>
              </span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Features</a>
              <a href="#enterprise" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Enterprise</a>
              <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Pricing</a>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" className="font-medium">Log in</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 font-medium">Start Free</Button>
          </div>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-4">
                <Button variant="ghost" className="justify-start" onClick={() => setMobileMenuOpen(false)}>
                  Features
                </Button>
                <Button variant="ghost" className="justify-start" onClick={() => setMobileMenuOpen(false)}>
                  Enterprise
                </Button>
                <Button variant="ghost" className="justify-start" onClick={() => setMobileMenuOpen(false)}>
                  Pricing
                </Button>
                <div className="mt-4 pt-4 border-t">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">Start Free</Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative z-10 max-w-2xl">
              <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 font-medium text-sm">
                <Star className="w-4 h-4" />
                New: AI-powered route optimization
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight bg-gradient-to-br from-gray-900 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Navigate Smarter, Journey Further
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Experience the future of navigation with AI-powered routing and real-time updates. Perfect for teams and adventurers who demand more from their journey.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-12">
                <Link href="/journey">
                  <Button 
                    size="lg" 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 w-full sm:w-auto"
                  >
                    Start Free Trial
                  </Button>
                </Link>
              
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="font-medium px-8 w-full sm:w-auto"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Watch Demo
                </Button>
              </div>

              <div className="flex items-center gap-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span>Bank-grade security</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>100k+ active users</span>
                </div>
              </div>
            </div>

            <div className="relative aspect-square w-full max-w-2xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-3xl transform rotate-3" />
              <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/5 to-indigo-500/5 rounded-3xl transform -rotate-3" />
              
              <div className="relative h-full rounded-3xl overflow-hidden shadow-2xl">
                <MapDisplay />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-20">
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Everything you need for seamless navigation
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features designed to transform every journey into an adventure
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:scale-105 transition-all duration-300 border-none bg-white/50 backdrop-blur-sm">
                <div className="p-8">
                  <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                    <feature.icon className="w-7 h-7 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-blue-600 to-indigo-600">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-bold mb-8 text-white">
              Ready to transform your journey?
            </h2>
            <p className="text-xl mb-12 text-blue-100 leading-relaxed">
              Join thousands of adventurers who have revolutionized their navigation experience.
            </p>
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-lg font-medium px-8">
              Start Your Adventure <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <Link href="/" className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">
                  Sabi<span className="text-blue-600">Road</span>
                </span>
              </Link>
              <p className="text-gray-600 leading-relaxed mb-6">
                Redefining navigation with AI-powered intelligence for the modern explorer.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-6">Product</h3>
              <ul className="space-y-4">
                {['Features', 'Enterprise', 'Security', 'Pricing', 'API'].map(link => (
                  <li key={link}>
                    <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-6">Company</h3>
              <ul className="space-y-4">
                {['About', 'Blog', 'Careers', 'Press', 'Partners'].map(link => (
                  <li key={link}>
                    <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-6">Legal</h3>
              <ul className="space-y-4">
                {['Privacy', 'Terms', 'Security', 'Cookies', 'Compliance'].map(link => (
                  <li key={link}>
                    <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-600 text-sm">
                © 2025 SabiRoad. All rights reserved.
              </p>
              <div className="flex items-center gap-6 mt-4 md:mt-0">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                  Privacy Policy
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                  Terms of Service
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                  Cookie Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Add a style tag for custom animations */}
      <style jsx global>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
        .animate-dash {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: dash 3s ease-out forwards infinite;
        }
      `}</style>
    </div>
  )
}

export default Home;