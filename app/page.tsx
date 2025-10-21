import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Camera, MapPin, Zap, Check, Shield, Image as ImageIcon, Globe, Sparkles, ArrowRight, Building2, Map, Github, Twitter, Mail } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation */}
      <nav className="border-b border-gray-100 dark:border-gray-900 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center">
              <Camera className="h-4 w-4 text-white dark:text-gray-900" />
            </div>
            <span className="font-semibold text-lg text-gray-900 dark:text-white">Pic2Nav</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
              <Link href="/analytics">Analytics</Link>
            </Button>
            <Button size="sm" className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 text-xs sm:text-sm" asChild>
              <Link href="/dashboard">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-gray-900 dark:text-white leading-tight">
                Find places from your photos
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto lg:mx-0">
                Upload a photo and discover where it was taken using AI-powered location recognition. Extract GPS data, identify landmarks, and explore nearby places instantly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100" asChild>
                  <Link href="/dashboard">
                    Start Exploring
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/analytics">View Analytics</Link>
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mt-8 sm:mt-12 max-w-md mx-auto lg:mx-0">
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">10K+</div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Photos analyzed</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">95%</div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Accuracy rate</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">&lt;5s</div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Avg response</div>
                </div>
              </div>
            </div>
            <div className="relative mt-8 lg:mt-0">
              <div className="relative w-full max-w-md mx-auto lg:max-w-lg">
                {/* Main showcase image */}
                <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xl">
                  <Image 
                    src="/images/app-screenshot-1.jpg" 
                    alt="Pic2Nav App Interface" 
                    fill
                    className="object-cover" 
                  />
                  {/* Floating elements */}
                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center animate-bounce">
                    <Camera className="h-6 w-6 text-gray-900 dark:text-white" />
                  </div>
                  <div className="absolute -bottom-4 -left-4 w-20 h-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-green-500" />
                      <span className="text-xs font-medium text-gray-900 dark:text-white">Found!</span>
                    </div>
                  </div>
                </div>
                {/* Background decoration */}
                <div className="absolute -z-10 top-8 left-8 w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features with Images */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Powerful location intelligence
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Advanced AI technology to extract location data from any photo
            </p>
          </div>

          {/* Feature 1 */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-16 sm:mb-20">
            <div className="order-2 lg:order-1">
              <div className="aspect-[4/3] bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-lg">
                <Image src="/images/app-screenshot-5.jpg" alt="AI Photo Analysis" width={600} height={450} className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white dark:text-gray-900" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">AI-Powered Photo Analysis</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                Our advanced AI analyzes text, signs, landmarks, and visual features in your photos to accurately identify locations. Using computer vision and machine learning, we can recognize buildings, businesses, and points of interest.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-gray-900 dark:text-white mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">Text and sign recognition from images</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-gray-900 dark:text-white mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">Landmark and building identification</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-gray-900 dark:text-white mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">Business and storefront detection</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-16 sm:mb-20">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-white dark:text-gray-900" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">GPS Data Extraction</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                Automatically extract GPS coordinates embedded in your photos' EXIF data. Get precise latitude and longitude information, along with nearby places, addresses, and points of interest.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-gray-900 dark:text-white mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">Extract EXIF GPS coordinates</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-gray-900 dark:text-white mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">Reverse geocoding to addresses</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-gray-900 dark:text-white mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">Discover nearby places and attractions</span>
                </li>
              </ul>
            </div>
            <div>
              <div className="aspect-[4/3] bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-lg">
                <Image src="/images/app-screenshot-6.jpg" alt="GPS Extraction" width={600} height={450} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="aspect-[4/3] bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-lg">
                <Image src="/images/app-screenshot-7.jpg" alt="Interactive Maps" width={600} height={450} className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center">
                  <Map className="h-5 w-5 text-white dark:text-gray-900" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Interactive Maps & Details</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                View detected locations on interactive maps with detailed information including business hours, ratings, reviews, and contact details. Save your favorite places and track your location history.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-gray-900 dark:text-white mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">Interactive map visualization</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-gray-900 dark:text-white mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">Detailed place information and reviews</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-gray-900 dark:text-white mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">Save and bookmark locations</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="px-4 sm:px-6 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Built for everyone
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
              From travelers to researchers, Pic2Nav helps you discover locations
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
              <Globe className="h-8 w-8 text-gray-900 dark:text-white mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Travelers</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Rediscover places from your travel photos and plan your next adventure with location insights.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
              <Building2 className="h-8 w-8 text-gray-900 dark:text-white mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Real Estate</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Identify property locations and gather neighborhood information from listing photos.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow sm:col-span-2 lg:col-span-1">
              <ImageIcon className="h-8 w-8 text-gray-900 dark:text-white mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Researchers</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Extract location metadata from image datasets for academic and research purposes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            Ready to discover locations?
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-8">
            Start exploring with Pic2Nav today. No credit card required.
          </p>
          <Button size="lg" className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100" asChild>
            <Link href="/dashboard">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-1 md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center">
                  <Camera className="h-4 w-4 text-white dark:text-gray-900" />
                </div>
                <span className="font-semibold text-lg text-gray-900 dark:text-white">Pic2Nav</span>
              </Link>
              <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
                AI-powered location discovery from photos. Extract GPS data, identify landmarks, and explore places instantly.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <Github className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/dashboard" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Dashboard</Link></li>
                <li><Link href="/analytics" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Analytics</Link></li>
                <li><Link href="/camera" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Camera</Link></li>
                <li><Link href="/map" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Map View</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">About</Link></li>
                <li><Link href="/blog" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Blog</Link></li>
                <li><Link href="/docs" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Documentation</Link></li>
                <li><Link href="/api-doc" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">API</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              © 2024 Pic2Nav. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}