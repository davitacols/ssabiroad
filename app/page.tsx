"use client"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { BrandLogo } from "@/components/ui/brand-logo"
import { SimpleMap } from "@/components/ui/simple-map"
import { CookieConsent } from "@/components/CookieConsent"
import { Camera, MapPin, ArrowRight, Zap, Globe2, Upload, Zap as AnalyzeIcon, MapPin as DiscoverIcon, Sparkles, BookOpen } from "lucide-react"
import Link from "next/link"
import Head from "next/head"
import { seoConfig } from "@/lib/seo-config"
import { useEffect, useState } from "react"
import { NewsletterSignup } from "@/components/newsletter-signup"
import { BlogCTA } from "@/components/blog-cta"

export default function HomePage() {
  const [posts, setPosts] = useState<any[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    fetch('/api/blog?page=1&limit=3')
      .then(res => res.json())
      .then(data => setPosts(data.posts || []))
      .catch(() => setPosts([]))
  }, [])

  const useCases = [
    { image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop', title: 'Financial Services', desc: 'Property valuation & risk assessment', color: 'from-orange-500 to-red-500' },
    { image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop', title: 'Real Estate', desc: 'Automated property intelligence', color: 'from-blue-500 to-cyan-500' },
    { image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop', title: 'Insurance', desc: 'Claims verification & fraud detection', color: 'from-purple-500 to-pink-500' },
    { image: 'https://images.unsplash.com/photo-1577415124269-fc1140a69e91?w=400&h=300&fit=crop', title: 'Logistics', desc: 'Fleet management & route optimization', color: 'from-green-500 to-emerald-500' },
    { image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop', title: 'Construction', desc: 'Site monitoring & compliance', color: 'from-yellow-500 to-orange-500' },
    { image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop', title: 'Government', desc: 'Public safety & infrastructure', color: 'from-red-500 to-rose-500' }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % useCases.length)
    }, 4000)
    return () => clearInterval(timer)
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
      <Head>
        <link rel="canonical" href="https://pic2nav.com" />
      </Head>
      {structuredDataArray.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <div className="min-h-screen bg-white overflow-x-hidden">

      {/* Announcement Banner */}
      <div className="bg-stone-900 text-white py-2.5 px-4 text-center text-sm">
        <span className="font-medium">🚀 New:</span> AI-powered location detection now available <Link href="/camera" className="underline ml-2 font-semibold hover:text-stone-300">Try it →</Link>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between relative">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-12 sm:h-14 md:h-16 w-auto object-contain drop-shadow-lg" />
          </Link>
          <div className="hidden lg:flex items-center gap-8">
            <Link href="/blog" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">Blog</Link>
            <Link href="/api-access" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">API</Link>
          </div>
          <div className="flex items-center gap-3">
            <Button className="bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold px-6" asChild>
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-50 border border-blue-200">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">SOC 2 Compliant • Enterprise SLA • 99.9% Uptime</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-stone-900">
                Enterprise Location Intelligence At Scale
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-stone-600 leading-relaxed max-w-xl">
                Transform visual data into actionable location intelligence. Our AI-powered platform delivers GPS coordinates, address verification, and geospatial analytics with enterprise-grade security and 99.9% SLA.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button 
                  size="lg" 
                  className="h-12 px-6 text-base bg-stone-900 hover:bg-stone-800 text-white" 
                  asChild
                  onClick={() => {
                    if (typeof window !== 'undefined' && (window as any).gtag) {
                      (window as any).gtag('event', 'cta_click', { location: 'hero', action: 'start_scanning' })
                    }
                  }}
                >
                  <Link href="/api-access">
                    Request Demo
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="h-12 px-6 text-base border-2 border-stone-300 text-stone-900 hover:bg-stone-50" 
                  asChild
                >
                  <Link href="/camera">
                    Try Free Tier
                  </Link>
                </Button>
              </div>



              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 pt-6">
                {[
                  { value: "10M+", label: "API Calls" },
                  { value: "500+", label: "Enterprises" },
                  { value: "<2s", label: "Response" },
                  { value: "99.9%", label: "Uptime" }
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-stone-900 mb-1">{stat.value}</div>
                    <div className="text-xs text-stone-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Video */}
            <div className="relative mt-6 lg:mt-0">
              <div className="rounded-lg overflow-hidden border border-stone-200 bg-white shadow-xl">
                <div className="bg-stone-50 px-4 py-3 flex items-center gap-3 border-b border-stone-200">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-md border border-stone-200">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs font-medium text-stone-600">pic2nav.app</span>
                    </div>
                  </div>
                </div>
                <div className="aspect-[16/10] bg-stone-100">
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



      {/* Blog Posts */}
      <section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-12 sm:mb-16">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-stone-900 mb-3 sm:mb-4">
                Latest from our blog
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-stone-600">
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
                <article className="h-full rounded-lg bg-white border border-stone-200 overflow-hidden hover:shadow-lg hover:border-stone-300 transition-all">
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
                      <span className="px-3 py-1 bg-stone-100 rounded-full text-xs font-medium text-stone-700">
                        {post.category}
                      </span>
                      <span className="text-xs text-stone-500">
                        {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-stone-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-stone-600 line-clamp-2">
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
      <section className="py-16 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Blog Promotion */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                <BookOpen className="h-6 w-6 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">LATEST INSIGHTS</span>
              </div>
              <h2 className="text-3xl font-bold mb-4 text-stone-900">
                Discover Location Technology Insights
              </h2>
              <p className="text-lg text-stone-600 mb-6">
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

            {/* Tools Grid */}
            <div className="grid gap-6">
              <div className="bg-white rounded-lg p-6 border border-stone-200 shadow-lg">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-stone-900 mb-1">Pic2Nav</h3>
                  <p className="text-sm text-stone-600">Photo Location Analysis Tool</p>
                </div>
                
                <div className="space-y-2 mb-4 text-sm text-stone-700">
                  <div>• Extract GPS coordinates from photos</div>
                  <div>• Identify buildings and landmarks</div>
                  <div>• Get weather and location data</div>
                </div>

                <Button className="w-full" variant="default" asChild>
                  <Link href="/camera">
                    Try Tool
                  </Link>
                </Button>
              </div>

              <div className="bg-white rounded-lg p-6 border border-stone-200 shadow-lg">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-stone-900 mb-1">Transit Planner</h3>
                  <p className="text-sm text-stone-600">Public Transport Journey Planning</p>
                </div>
                
                <div className="space-y-2 mb-4 text-sm text-stone-700">
                  <div>• Real-time transit directions</div>
                  <div>• Multi-modal route planning</div>
                  <div>• Live vehicle tracking</div>
                </div>

                <Button className="w-full" variant="outline" asChild>
                  <Link href="/transit">
                    Plan Journey
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="relative py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-8 rounded-lg bg-white border border-stone-200 hover:border-stone-300 transition-all shadow-sm hover:shadow-md">
              <div className="text-5xl font-bold text-stone-900 mb-2">10M+</div>
              <div className="text-stone-600">Monthly API Requests</div>
            </div>
            <div className="p-8 rounded-lg bg-white border border-stone-200 hover:border-stone-300 transition-all shadow-sm hover:shadow-md">
              <div className="text-5xl font-bold text-stone-900 mb-2">500+</div>
              <div className="text-stone-600">Enterprise Customers</div>
            </div>
            <div className="p-8 rounded-lg bg-white border border-stone-200 hover:border-stone-300 transition-all shadow-sm hover:shadow-md">
              <div className="text-5xl font-bold text-stone-900 mb-2">99.9%</div>
              <div className="text-stone-600">Guaranteed Uptime SLA</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 bg-stone-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-stone-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-stone-600">
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
                <div className="relative p-8 rounded-lg bg-white border border-stone-200 hover:border-stone-300 transition-all shadow-sm hover:shadow-md">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-stone-900 flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-5xl font-bold text-stone-200">{feature.num}</div>
                  </div>
                  <h3 className="text-2xl font-bold text-stone-900 mb-3">{feature.title}</h3>
                  <p className="text-stone-600 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-stone-900 mb-4">
            Stay updated with our newsletter
          </h2>
          <p className="text-base sm:text-lg text-stone-600 mb-8">
            Get the latest blog posts, tips, and updates delivered to your inbox
          </p>
          <div className="flex justify-center">
            <NewsletterSignup />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-4 sm:px-6 bg-stone-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Scale Your Location Intelligence?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join 500+ enterprises processing millions of location requests monthly
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="h-12 px-6 text-base bg-white hover:bg-stone-100 text-stone-900" asChild>
              <Link href="/api-access">
                Schedule Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-6 text-base border-2 border-white text-white hover:bg-white/10" asChild>
              <Link href="/camera">
                Start Free Trial
              </Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-blue-200">Enterprise SLA • Dedicated Support • Custom Integration</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-stone-200 py-8 sm:py-12 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <img src="/pic2nav.png" alt="Pic2Nav" className="h-10 sm:h-12 md:h-14 w-auto object-contain drop-shadow-lg" />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs sm:text-sm text-stone-600">
              <div className="flex gap-4">
                <Link href="/blog" className="hover:text-stone-900">Blog</Link>
                <Link href="/privacy" className="hover:text-stone-900">Privacy</Link>
                <Link href="/cookies" className="hover:text-stone-900">Cookies</Link>
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