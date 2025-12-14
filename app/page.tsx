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
import { NewsletterSignup } from "@/components/newsletter-signup"
import { BlogCTA } from "@/components/blog-cta"

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
      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 dark:from-stone-950 dark:via-stone-950 dark:to-blue-950/20 pointer-events-none"></div>

      {/* Announcement Banner */}
      <div className="bg-blue-600 text-white py-2.5 px-4 text-center text-sm">
        <span className="font-medium">🚀 New:</span> AI-powered location detection now available <Link href="/camera" className="underline ml-2 font-semibold hover:text-blue-100">Try it →</Link>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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
            <Button className="rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm px-6" asChild>
              <Link href="/camera">Get Started</Link>
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">AI-Powered • 95% Accurate</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                <span className="text-stone-900 dark:text-white">Find Any Location</span>
                <br />
                <span className="text-stone-900 dark:text-white">From a </span>
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Photo</span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-stone-600 dark:text-stone-400 leading-relaxed max-w-xl">
                Upload any building photo and get its exact location in 3 seconds. Perfect for delivery, real estate, and travel. Works worldwide, even without addresses.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button 
                  size="lg" 
                  className="rounded-full h-14 px-8 text-base bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20" 
                  asChild
                  onClick={() => {
                    if (typeof window !== 'undefined' && (window as any).gtag) {
                      (window as any).gtag('event', 'cta_click', { location: 'hero', action: 'start_scanning' })
                    }
                  }}
                >
                  <Link href="/camera">
                    <Camera className="mr-2 h-5 w-5" />
                    Try It Free
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="rounded-full h-14 px-8 text-base border-2" 
                  asChild
                >
                  <Link href="#how-it-works">
                    See How It Works
                  </Link>
                </Button>
              </div>

              {/* Trust Signals */}
              <div className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-white dark:border-stone-900" />
                    ))}
                  </div>
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    <span className="font-bold text-stone-900 dark:text-white">10,000+</span> users
                  </p>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-yellow-500">★★★★★</span>
                  <span className="font-semibold text-stone-900 dark:text-white ml-1">4.9/5</span>
                  <span className="text-stone-500">rating</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 pt-6">
                {[
                  { value: "10K+", label: "Photos" },
                  { value: "195", label: "Countries" },
                  { value: "3s", label: "Speed" },
                  { value: "95%", label: "Accuracy" }
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white mb-1">{stat.value}</div>
                    <div className="text-xs text-stone-500 dark:text-stone-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Video */}
            <div className="relative mt-6 lg:mt-0 group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xl">
                <div className="bg-gradient-to-r from-stone-50 to-stone-100 dark:from-stone-800 dark:to-stone-900 px-4 py-3 flex items-center gap-3 border-b border-stone-200 dark:border-stone-700">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-stone-600 dark:text-stone-400">pic2nav.app</span>
                    </div>
                  </div>
                </div>
                <div className="aspect-[16/10] bg-gradient-to-br from-stone-900 to-stone-800">
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

      {/* Use Cases */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 bg-white dark:bg-stone-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-white mb-4">
              Perfect For
            </h2>
            <p className="text-lg text-stone-600 dark:text-stone-400">
              Trusted by professionals worldwide
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', title: 'Delivery Riders', desc: 'Find addresses 10x faster', color: 'from-orange-500 to-red-500' },
              { image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop', title: 'Real Estate', desc: 'Show exact property locations', color: 'from-blue-500 to-cyan-500' },
              { image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop', title: 'Travelers', desc: 'Never get lost anywhere', color: 'from-purple-500 to-pink-500' },
              { image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=300&fit=crop', title: 'Photographers', desc: 'Track photo locations', color: 'from-green-500 to-emerald-500' },
              { image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop', title: 'Construction', desc: 'Document site locations', color: 'from-yellow-500 to-orange-500' },
              { image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop', title: 'Emergency', desc: 'Report incidents with location', color: 'from-red-500 to-rose-500' }
            ].map((use, i) => (
              <div key={i} className="group relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${use.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity`}></div>
                <div className="relative rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-700 transition-all overflow-hidden">
                  <div className="aspect-video overflow-hidden">
                    <img src={use.image} alt={use.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">{use.title}</h3>
                    <p className="text-stone-600 dark:text-stone-400">{use.desc}</p>
                  </div>
                </div>
              </div>
            ))}
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
              <Link key={post.id} href={'/blog/' + post.slug} className="group">
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

      {/* Blog CTA */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/20 dark:to-indigo-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Blog Promotion */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                <BookOpen className="h-6 w-6 text-blue-600" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">LATEST INSIGHTS</span>
              </div>
              <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                Discover Location Technology Insights
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                Explore our blog for tutorials, guides, and insights about navigation technology, 
                photo location analysis, and building recognition.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button size="lg" asChild>
                  <Link href="/blog" className="flex items-center gap-2">
                    Read Our Blog
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/blog/pic2nav-photo-location-scanner-professionals">
                    Learn About Pic2Nav
                  </Link>
                </Button>
              </div>
            </div>

            {/* Pic2Nav Promotion */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Pic2Nav</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Photo Location Analysis Tool</p>
              </div>
              
              <div className="space-y-2 mb-4 text-sm text-gray-700 dark:text-gray-300">
                <div>• Extract GPS coordinates from photos</div>
                <div>• Identify buildings and landmarks</div>
                <div>• Get weather and location data</div>
              </div>

              <div className="flex items-center justify-between mb-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Free tool</span>
                <span>No signup required</span>
              </div>

              <Button className="w-full" variant="default" asChild>
                <Link href="/camera">
                  Try Tool
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="relative py-16 px-4 sm:px-6 bg-stone-50 dark:bg-stone-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-8 rounded-2xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
              <div className="text-5xl font-bold text-blue-600 mb-2">10K+</div>
              <div className="text-stone-600 dark:text-stone-400">Photos Analyzed</div>
            </div>
            <div className="p-8 rounded-2xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
              <div className="text-5xl font-bold text-purple-600 mb-2">195</div>
              <div className="text-stone-600 dark:text-stone-400">Countries Supported</div>
            </div>
            <div className="p-8 rounded-2xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
              <div className="text-5xl font-bold text-green-600 mb-2">95%</div>
              <div className="text-stone-600 dark:text-stone-400">Accuracy Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 bg-white dark:bg-stone-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-stone-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-stone-600 dark:text-stone-400">
              Three simple steps to find any location
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Upload, num: '01', title: "Upload Photo", desc: "Take or upload any building photo", color: "from-blue-500 to-cyan-500" },
              { icon: AnalyzeIcon, num: '02', title: "AI Analysis", desc: "Our AI extracts GPS and visual data", color: "from-purple-500 to-pink-500" },
              { icon: DiscoverIcon, num: '03', title: "Get Location", desc: "Receive exact address and map", color: "from-orange-500 to-red-500" }
            ].map((feature, i) => (
              <div key={i} className="relative group">
                <div className="relative p-8 rounded-2xl bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={'flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ' + feature.color + ' flex items-center justify-center shadow-lg'}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-5xl font-bold text-stone-200 dark:text-stone-800">{feature.num}</div>
                  </div>
                  <h3 className="text-2xl font-bold text-stone-900 dark:text-white mb-3">{feature.title}</h3>
                  <p className="text-stone-600 dark:text-stone-400 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 bg-stone-50 dark:bg-stone-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-stone-900 dark:text-white mb-4">
            Stay updated with our newsletter
          </h2>
          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 mb-8">
            Get the latest blog posts, tips, and updates delivered to your inbox
          </p>
          <div className="flex justify-center">
            <NewsletterSignup />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-4 sm:px-6 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Start Finding Locations Today
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join 10,000+ users discovering exact locations from photos in seconds
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="rounded-full h-14 px-8 text-base bg-white hover:bg-stone-100 text-blue-600 shadow-xl" asChild>
              <Link href="/camera">
                <Camera className="mr-2 h-5 w-5" />
                Try It Free
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-base border-2 border-white text-white hover:bg-white/10" asChild>
              <Link href="/transit">
                Explore Transit
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-blue-200">No credit card required • Free forever • 195 countries</p>
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

      </div>
      <CookieConsent />
    </>
  )
}