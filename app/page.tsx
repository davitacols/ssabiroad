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
      <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* Announcement Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-2.5 px-4 text-center text-sm font-medium">
        <span className="font-bold">New:</span> Satellite imagery integration coming soon <Link href="/camera" className="underline ml-2 font-semibold hover:text-blue-100">Learn More →</Link>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-8 w-auto" />
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/blog" className="text-sm text-gray-700 hover:text-gray-900 font-medium">Insights</Link>
            <Link href="/contribute" className="text-sm text-gray-700 hover:text-gray-900 font-medium">Solutions</Link>
            <Link href="/api-access" className="text-sm text-gray-700 hover:text-gray-900 font-medium">API</Link>
          </div>
          
          <div className="flex items-center">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2" asChild>
              <Link href="/camera">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519302959554-a75be0afc82a?w=1920&h=1080&fit=crop')] bg-cover bg-center opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent"></div>
        
        <div className="max-w-[1400px] mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">Enterprise-Grade • SOC 2 Compliant • 99.9% SLA</span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-cyan-700 bg-clip-text text-transparent">
                  Geospatial Intelligence
                </span>
                <br />
                <span className="text-gray-900">At Scale</span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
                Transform visual data into actionable location intelligence. Enterprise-grade AI platform delivering GPS coordinates, address verification, and geospatial analytics with 99.9% uptime.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="h-14 px-8 text-base border-2 border-gray-300 text-gray-700 hover:bg-gray-50 backdrop-blur-sm" 
                  asChild
                >
                  <Link href="/camera">
                    Try Free Tier
                  </Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-6 pt-8">
                {[
                  { value: "10M+", label: "API Calls" },
                  { value: "500+", label: "Enterprises" },
                  { value: "<2s", label: "Response" },
                  { value: "99.9%", label: "Uptime" }
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-1">{stat.value}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative mt-6 lg:mt-0">
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50 backdrop-blur-xl shadow-2xl shadow-blue-500/10">
                <div className="bg-white/80 backdrop-blur-sm px-4 py-3 flex items-center gap-3 border-b border-gray-200">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-md border border-gray-200">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-gray-700">pic2nav.app</span>
                    </div>
                  </div>
                </div>
                <div className="aspect-[16/10] bg-gradient-to-br from-blue-50 to-white">
                  <video 
                    className="w-full h-full object-cover mix-blend-multiply"
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                  >
                    <source src="/demo.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur-3xl opacity-20 -z-10"></div>
            </div>
          </div>
        </div>
      </section>



      {/* Blog Posts */}
      <section className="relative py-24 px-4 sm:px-6 bg-gradient-to-b from-white via-blue-50 to-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center justify-between mb-16">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Latest Insights
              </h2>
              <p className="text-xl text-gray-600">
                Industry trends and technical deep-dives
              </p>
            </div>
            <Button variant="outline" className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-50" asChild>
              <Link href="/blog">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link key={post.id} href={'/blog/' + post.slug} className="group">
                <article className="h-full rounded-xl bg-white border border-gray-200 overflow-hidden hover:border-blue-400 hover:shadow-lg transition-all backdrop-blur-sm">
                  {post.coverImage && (
                    <div className="aspect-video overflow-hidden relative">
                      <img 
                        src={post.coverImage} 
                        alt={post.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-blue-100 rounded-full text-xs font-medium text-blue-700 border border-blue-200">
                        {post.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
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
      <section className="py-24 bg-gradient-to-br from-blue-50 via-white to-cyan-50 border-y border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                <BookOpen className="h-6 w-6 text-blue-600" />
                <span className="text-sm font-medium text-blue-600 uppercase tracking-wider">Latest Insights</span>
              </div>
              <h2 className="text-4xl font-bold mb-4 text-gray-900">
                Geospatial Intelligence Resources
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Technical guides, industry insights, and best practices for location intelligence platforms.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 border-0" asChild>
                  <Link href="/blog">
                    Explore Resources
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50" asChild>
                  <Link href="/blog/pic2nav-photo-location-scanner-professionals">
                    Platform Overview
                  </Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-6">
              <div className="bg-white backdrop-blur-sm rounded-2xl p-8 border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Pic2Nav API</h3>
                  <p className="text-sm text-gray-600">Enterprise Location Intelligence</p>
                </div>
                <div className="space-y-2 mb-6 text-sm text-gray-700">
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div><span>GPS extraction from imagery</span></div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div><span>Building & landmark recognition</span></div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div><span>Real-time geospatial analytics</span></div>
                </div>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 border-0" asChild>
                  <Link href="/camera">Try Platform</Link>
                </Button>
              </div>
              <div className="bg-white backdrop-blur-sm rounded-2xl p-8 border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Transit Intelligence</h3>
                  <p className="text-sm text-gray-600">Multi-Modal Route Planning</p>
                </div>
                <div className="space-y-2 mb-6 text-sm text-gray-700">
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-600"></div><span>Real-time transit directions</span></div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-600"></div><span>Multi-modal optimization</span></div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-600"></div><span>Live vehicle tracking</span></div>
                </div>
                <Button className="w-full border-gray-300 text-gray-700 hover:bg-gray-50" variant="outline" asChild>
                  <Link href="/transit">Plan Route</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="relative py-32 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Stay Ahead of Geospatial Innovation
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Get technical insights, product updates, and industry trends delivered monthly
          </p>
          <div className="flex justify-center">
            <NewsletterSignup />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 px-4 sm:px-6 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519302959554-a75be0afc82a?w=1920&h=1080&fit=crop')] bg-cover bg-center opacity-20"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl font-bold text-white mb-6">
            Ready to Scale Your Location Intelligence?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join 500+ enterprises processing millions of location requests with 99.9% uptime
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="h-14 px-8 text-base bg-white hover:bg-gray-100 text-blue-600 border-0 shadow-xl" asChild>
              <Link href="/api-access">
                Schedule Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-base border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm" asChild>
              <Link href="/camera">Start Free Trial</Link>
            </Button>
          </div>
          <p className="mt-8 text-sm text-blue-100">Enterprise SLA • Dedicated Support • Custom Integration • SOC 2 Compliant</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-gray-200 py-12 px-4 sm:px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="/pic2nav.png" alt="Pic2Nav" className="h-14 w-auto object-contain drop-shadow-lg" />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-gray-600">
              <div className="flex gap-6">
                <Link href="/blog" className="hover:text-gray-900 transition-colors">Insights</Link>
                <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
                <Link href="/cookies" className="hover:text-gray-900 transition-colors">Cookies</Link>
              </div>
              <p>© 2026 Pic2Nav. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>

      </div>
      <CookieConsent />
    </>
  )
}