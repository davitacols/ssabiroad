"use client"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { BrandLogo } from "@/components/ui/brand-logo"
import { Camera, MapPin, ArrowRight, Zap, Globe2, Upload, Zap as AnalyzeIcon, MapPin as DiscoverIcon, Sparkles } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0a0a0a]">
      {/* Organic blob backgrounds */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-pink-400/20 dark:bg-pink-600/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-stone-200/50 dark:border-stone-800/50 bg-white/50 dark:bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-12 sm:h-14 md:h-16 w-auto object-contain drop-shadow-lg" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" className="hidden md:inline-flex rounded-full" asChild>
              <Link href="/api-access">API</Link>
            </Button>
            <Button className="rounded-full bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 dark:text-stone-900 text-sm sm:text-base px-3 sm:px-4" asChild>
              <Link href="/camera">Try Now</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-8 sm:pt-12 md:pt-16 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 sm:space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">AI-Powered Recognition</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
                <span className="text-stone-900 dark:text-white">Turn photos into</span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">locations</span>
                <br />
                <span className="text-stone-900 dark:text-white">instantly</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-stone-600 dark:text-stone-400 leading-relaxed max-w-xl">
                Upload any image and discover where it was taken. Our AI extracts GPS data, identifies landmarks, and provides rich location details.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button size="lg" className="rounded-full h-14 px-8 text-base bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 dark:text-stone-900 shadow-lg shadow-stone-900/10" asChild>
                  <Link href="/camera">
                    <Camera className="mr-2 h-5 w-5" />
                    Start Scanning
                  </Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 pt-4">
                {[
                  { value: "10K+", label: "Scanned" },
                  { value: "95%", label: "Accuracy" },
                  { value: "<3s", label: "Speed" },
                  { value: "Free", label: "Forever" }
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white mb-1">{stat.value}</div>
                    <div className="text-xs text-stone-600 dark:text-stone-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Video */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl"></div>
              <div className="relative rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xl">
                <div className="bg-stone-100 dark:bg-stone-800 px-4 py-3 flex items-center gap-2 border-b border-stone-200 dark:border-stone-700">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-sm text-stone-600 dark:text-stone-400">pic2nav.app</div>
                </div>
                <div className="aspect-[16/10] bg-black">
                  <video 
                    className="w-full h-full object-cover"
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                  >
                    <source src="/demo.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 bg-white dark:bg-stone-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-stone-900 dark:text-white mb-3 sm:mb-4 px-2">
              Simple, powerful, instant
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-stone-600 dark:text-stone-400 px-4">
              Three steps to discover any location
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {[
              { icon: Upload, title: "Upload", desc: "Drop any photo or take one with your camera", color: "from-blue-500 to-cyan-500" },
              { icon: AnalyzeIcon, title: "Analyze", desc: "AI processes GPS data and visual landmarks", color: "from-purple-500 to-pink-500" },
              { icon: DiscoverIcon, title: "Discover", desc: "Get location, weather, and nearby places", color: "from-orange-500 to-red-500" }
            ].map((feature, i) => (
              <div key={i} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl sm:rounded-3xl blur-xl" style={{ background: `linear-gradient(to bottom right, ${feature.color})` }}></div>
                <div className="relative p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 transition-all">
                  <div className={`inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br ${feature.color} mb-4 sm:mb-6 shadow-lg`}>
                    <feature.icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-stone-900 dark:text-white mb-2 sm:mb-3">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl sm:rounded-[3rem] blur-3xl opacity-20"></div>
            <div className="relative p-8 sm:p-12 md:p-16 rounded-2xl sm:rounded-[3rem] bg-gradient-to-br from-stone-900 to-stone-800 dark:from-stone-100 dark:to-stone-50">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white dark:text-stone-900 mb-4 sm:mb-6 px-2">
                Ready to explore?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-stone-300 dark:text-stone-600 mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto px-4">
                Join thousands discovering locations from their photos every day
              </p>
              <Button size="lg" className="rounded-full h-12 sm:h-14 px-6 sm:px-10 text-sm sm:text-base bg-white hover:bg-stone-100 text-stone-900 dark:bg-stone-900 dark:hover:bg-stone-800 dark:text-white shadow-xl" asChild>
                <Link href="/camera">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-stone-200 dark:border-stone-800 py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <img src="/pic2nav.png" alt="Pic2Nav" className="h-10 sm:h-12 md:h-14 w-auto object-contain drop-shadow-lg" />
            </div>
            <p className="text-xs sm:text-sm text-stone-500">© 2024 Pic2Nav</p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
