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
      <nav className="relative z-50 border-b border-stone-200/50 dark:border-stone-800/50 bg-white/50 dark:bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-40 w-auto object-contain drop-shadow-lg" />
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" className="hidden md:inline-flex rounded-full" asChild>
              <Link href="/analytics">Analytics</Link>
            </Button>
            <Button className="rounded-full bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 dark:text-stone-900" asChild>
              <Link href="/camera">Try Now</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-8 mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">AI-Powered Recognition</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="text-stone-900 dark:text-white">Turn photos into</span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">locations instantly</span>
            </h1>
            
            <p className="text-xl text-stone-600 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed">
              Upload any image and discover where it was taken. Our AI extracts GPS data, identifies landmarks, and provides rich location details.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="rounded-full h-14 px-8 text-base bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 dark:text-stone-900 shadow-lg shadow-stone-900/10" asChild>
                <Link href="/camera">
                  <Camera className="mr-2 h-5 w-5" />
                  Start Scanning
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-base border-2 border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-900" asChild>
                <Link href="/dashboard">
                  View Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto mb-20">
            {[
              { value: "10K+", label: "Photos Scanned" },
              { value: "95%", label: "Accuracy" },
              { value: "<3s", label: "Speed" },
              { value: "Free", label: "Forever" }
            ].map((stat, i) => (
              <div key={i} className="text-center p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
                <div className="text-3xl font-bold text-stone-900 dark:text-white mb-1">{stat.value}</div>
                <div className="text-sm text-stone-600 dark:text-stone-400">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Demo Preview */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-[3rem] blur-2xl"></div>
            <div className="relative rounded-[2rem] overflow-hidden border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xl">
              <div className="bg-stone-100 dark:bg-stone-800 px-6 py-4 flex items-center gap-3 border-b border-stone-200 dark:border-stone-700">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="text-sm text-stone-600 dark:text-stone-400">pic2nav.app</div>
              </div>
              <div className="aspect-[16/10] bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-900 dark:to-stone-950 flex items-center justify-center p-12">
                <div className="text-center space-y-4">
                  <div className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl">
                    <Camera className="h-12 w-12 text-white" />
                  </div>
                  <p className="text-stone-600 dark:text-stone-400">Interactive Demo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-32 px-6 bg-white dark:bg-stone-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-stone-900 dark:text-white mb-4">
              Simple, powerful, instant
            </h2>
            <p className="text-xl text-stone-600 dark:text-stone-400">
              Three steps to discover any location
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Upload, title: "Upload", desc: "Drop any photo or take one with your camera", color: "from-blue-500 to-cyan-500" },
              { icon: AnalyzeIcon, title: "Analyze", desc: "AI processes GPS data and visual landmarks", color: "from-purple-500 to-pink-500" },
              { icon: DiscoverIcon, title: "Discover", desc: "Get location, weather, and nearby places", color: "from-orange-500 to-red-500" }
            ].map((feature, i) => (
              <div key={i} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl blur-xl" style={{ background: `linear-gradient(to bottom right, ${feature.color})` }}></div>
                <div className="relative p-8 rounded-3xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 transition-all">
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} mb-6 shadow-lg`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-stone-900 dark:text-white mb-3">{feature.title}</h3>
                  <p className="text-stone-600 dark:text-stone-400 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-[3rem] blur-3xl opacity-20"></div>
            <div className="relative p-16 rounded-[3rem] bg-gradient-to-br from-stone-900 to-stone-800 dark:from-stone-100 dark:to-stone-50">
              <h2 className="text-4xl sm:text-5xl font-bold text-white dark:text-stone-900 mb-6">
                Ready to explore?
              </h2>
              <p className="text-xl text-stone-300 dark:text-stone-600 mb-10 max-w-2xl mx-auto">
                Join thousands discovering locations from their photos every day
              </p>
              <Button size="lg" className="rounded-full h-14 px-10 text-base bg-white hover:bg-stone-100 text-stone-900 dark:bg-stone-900 dark:hover:bg-stone-800 dark:text-white shadow-xl" asChild>
                <Link href="/camera">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-stone-200 dark:border-stone-800 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="/pic2nav.png" alt="Pic2Nav" className="h-24 w-auto object-contain drop-shadow-lg" />
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-stone-600 dark:text-stone-400">
              <Link href="/about" className="hover:text-stone-900 dark:hover:text-stone-100">About</Link>
              <Link href="/docs" className="hover:text-stone-900 dark:hover:text-stone-100">Docs</Link>
              <Link href="/blog" className="hover:text-stone-900 dark:hover:text-stone-100">Blog</Link>
              <Link href="/api-doc" className="hover:text-stone-900 dark:hover:text-stone-100">API</Link>
            </div>
            <p className="text-sm text-stone-500">© 2024 Pic2Nav</p>
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
