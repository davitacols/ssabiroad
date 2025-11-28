"use client"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { BrandLogo } from "@/components/ui/brand-logo"
import { SimpleMap } from "@/components/ui/simple-map"
import { CookieConsent } from "@/components/CookieConsent"
import { Camera, MapPin, ArrowRight, Zap, Globe2, Upload, Zap as AnalyzeIcon, MapPin as DiscoverIcon, Sparkles, BookOpen } from "lucide-react"
import Link from "next/link"
import { seoConfig } from "@/lib/seo-config"
import { useEffect, useState } from "react"

export default function HomePage() {
  const [posts, setPosts] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/blog?page=1&limit=3')
      .then(res => res.json())
      .then(data => setPosts(data.posts || []))
      .catch(() => setPosts([]))
  }, [])
  const structuredDataArray = [
    seoConfig.webApplicationSchema,
    seoConfig.organizationSchema,
    seoConfig.faqSchema,
    {
      "@context": "https://schema.org",
      "@type": "GovernmentService",
      "name": "Pic2Nav Crime Reporting",
      "description": "Report crimes to Nigerian Police Force with AI-powered location detection",
      "provider": {
        "@type": "GovernmentOrganization",
        "name": "Nigerian Police Force"
      },
      "areaServed": "Nigeria",
      "availableChannel": {
        "@type": "ServiceChannel",
        "serviceUrl": "https://pic2nav.com/report-crime"
      }
    }
  ]

  return (
    <>
      {structuredDataArray.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
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
              <Link href="/blog">Blog</Link>
            </Button>
            <Button variant="ghost" className="hidden md:inline-flex rounded-full" asChild>
              <Link href="/api-access">API</Link>
            </Button>
            <Button variant="ghost" className="rounded-full text-red-600 hover:text-red-700 text-xs sm:text-sm px-2 sm:px-4" asChild>
              <Link href="/report-crime">Report Crime</Link>
            </Button>
            <Button className="rounded-full bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 dark:text-stone-900 text-sm sm:text-base px-3 sm:px-4" asChild>
              <Link href="/camera">Try Now</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-4 sm:pt-8 md:pt-12 lg:pt-16 pb-8 sm:pb-12 md:pb-16 lg:pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                <span className="text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-300">AI-Powered Recognition</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold tracking-tight leading-tight">
                <span className="text-stone-900 dark:text-white">Find Location from Photo - Identify Buildings & Landmarks</span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Worldwide</span>
                <br />
                <span className="text-stone-900 dark:text-white">with AI</span>
              </h1>
              
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-stone-600 dark:text-stone-400 leading-relaxed max-w-xl">
                Upload any photo to discover its location using AI. Extract GPS coordinates, identify buildings & landmarks globally, analyze architecture. In Nigeria? Report crimes to Nigerian Police Force. Free forever.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                <Button size="lg" className="rounded-full h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 dark:text-stone-900 shadow-lg shadow-stone-900/10" asChild>
                  <Link href="/camera">
                    <Camera className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Start Scanning
                  </Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2 sm:pt-4">
                {[
                  { value: "10K+", label: "Scanned" },
                  { value: "95%", label: "Accuracy" },
                  { value: "<3s", label: "Speed" },
                  { value: "Free", label: "Forever" }
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-stone-900 dark:text-white mb-1">{stat.value}</div>
                    <div className="text-xs text-stone-600 dark:text-stone-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Video */}
            <div className="relative mt-6 lg:mt-0">
              <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl sm:rounded-3xl blur-xl sm:blur-2xl"></div>
              <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xl sm:shadow-2xl">
                <div className="bg-stone-100 dark:bg-stone-800 px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 border-b border-stone-200 dark:border-stone-700">
                  <div className="flex gap-1 sm:gap-1.5">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">pic2nav.app</div>
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

      {/* Interactive Map Section */}
      <section className="relative py-8 sm:py-16 md:py-24 lg:py-32 px-4 sm:px-6 bg-stone-50 dark:bg-stone-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-12 md:mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-stone-900 dark:text-white mb-2 sm:mb-3 md:mb-4 px-2">
              Explore your world
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-stone-600 dark:text-stone-400 px-4">
              See your current location and discover nearby places of interest
            </p>
          </div>
          
          <div className="relative">
            <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-xl sm:rounded-3xl blur-xl sm:blur-2xl"></div>
            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-xl sm:shadow-2xl">
              <SimpleMap 
                height="100%" 
                className="w-full h-[300px] sm:h-[400px] md:h-[500px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 bg-stone-50 dark:bg-stone-900">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-12 sm:mb-16">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-stone-900 dark:text-white mb-3 sm:mb-4">
                Latest from our blog
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-stone-600 dark:text-stone-400">
                Tips, guides, and insights
              </p>
            </div>
            <Button variant="outline" className="rounded-full" asChild>
              <Link href="/blog">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                <article className="h-full rounded-2xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 overflow-hidden hover:shadow-xl transition-all">
                  {post.coverImage && (
                    <div className="aspect-video overflow-hidden">
                      <img 
                        src={post.coverImage} 
                        alt={post.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-stone-100 dark:bg-stone-800 rounded-full text-xs font-medium">
                        {post.category}
                      </span>
                      <span className="text-xs text-stone-500">
                        {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2">
                      {post.excerpt}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
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
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs sm:text-sm text-stone-500">
              <div className="flex gap-4">
                <Link href="/blog" className="hover:text-stone-700 dark:hover:text-stone-300">Blog</Link>
                <Link href="/privacy" className="hover:text-stone-700 dark:hover:text-stone-300">Privacy</Link>
                <Link href="/cookies" className="hover:text-stone-700 dark:hover:text-stone-300">Cookies</Link>
              </div>
              <p>© 2024 Pic2Nav</p>
            </div>
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
      <CookieConsent />
    </>
  )
}
