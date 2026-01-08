"use client"

import { Button } from "@/components/ui/button"
import { SimpleMap } from "@/components/ui/simple-map"
import { CookieConsent } from "@/components/CookieConsent"
import { Camera, MapPin, ArrowRight, Zap, Globe2, Upload, Search, Heart, ShoppingCart, BookOpen } from "lucide-react"
import Link from "next/link"
import Head from "next/head"
import { seoConfig } from "@/lib/seo-config"
import { useEffect, useState } from "react"
import { NewsletterSignup } from "@/components/newsletter-signup"
import { InteractiveGlobe } from "@/components/ui/interactive-globe"

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
    seoConfig.faqSchema
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
      <div className="min-h-screen bg-white">

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-stone-200">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-10 w-auto" />
          </Link>
          
          <div className="hidden md:flex items-center space-x-12">
            <Link href="/blog" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">Insights</Link>
            <Link href="/contribute" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">Solutions</Link>
            <Link href="/api-access" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">API</Link>
          </div>
          
          <Button className="bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold px-6 py-2 rounded-lg" asChild>
            <Link href="/camera">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* Hero with Map Background */}
      <section className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-cover bg-center" style={{
        backgroundImage: 'url(/heroimage.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        <div className="absolute inset-0 bg-black/60" />
        
        {/* Globe Background - Top Left */}
        <div className="absolute top-10 left-10 opacity-30 pointer-events-none w-48 h-48">
          <InteractiveGlobe />
        </div>
        
        {/* Globe Background - Top Right */}
        <div className="absolute top-20 right-20 opacity-35 pointer-events-none w-64 h-64">
          <InteractiveGlobe />
        </div>
        
        {/* Globe Background - Bottom Left */}
        <div className="absolute bottom-10 left-20 opacity-25 pointer-events-none w-56 h-56">
          <InteractiveGlobe />
        </div>
        
        {/* Centered Content */}
        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-white">
              Analyze Buildings with AI-Powered Location Intelligence
            </h1>
            
            <p className="text-base sm:text-lg text-white/80 leading-relaxed font-normal">
              Upload a photo and instantly detect architectural styles, materials, GPS coordinates, and environmental insights.
            </p>
            
            <div className="pt-4">
              <Button 
                size="lg" 
                className="h-14 px-12 text-base font-semibold bg-white hover:bg-stone-100 text-stone-900 rounded-full shadow-lg" 
                asChild
              >
                <Link href="/camera">
                  <Camera className="mr-2 h-5 w-5" />
                  Analyze Now
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-16">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 mb-4">
              Powerful Capabilities
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl">
              Everything you need for location intelligence and building analysis
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Camera, title: 'GPS Extraction', desc: 'Extract precise coordinates from photos' },
              { icon: Globe2, title: 'Global Coverage', desc: 'Analyze locations across 195 countries' },
              { icon: Search, title: 'AI Recognition', desc: 'Identify landmarks using computer vision' },
              { icon: MapPin, title: 'Location Intel', desc: 'Walkability, transit, and environmental data' },
              { icon: Upload, title: 'Bulk Processing', desc: 'Process thousands of images at once' },
              { icon: Zap, title: 'Real-time API', desc: 'Sub-2s response times, 99.9% uptime' }
            ].map((feature, i) => (
              <div key={i} className="group bg-stone-50 rounded-xl p-6 hover:bg-stone-100 transition-colors">
                <div className="w-10 h-10 bg-stone-900 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-stone-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-stone-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upload. Analyse. Results. Section */}
      <section className="relative py-24 px-4 sm:px-6 bg-stone-50">
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-16">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 mb-4">
              Upload. Analyse. Results.
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl">
              Three simple steps to unlock location intelligence from any image
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              { icon: Upload, title: 'Upload', desc: 'Share your photo or select from your device' },
              { icon: Search, title: 'Analyse', desc: 'AI processes image for location and building data' },
              { icon: MapPin, title: 'Results', desc: 'Get instant insights and geographic intelligence' }
            ].map((step, i) => (
              <div key={i} className="bg-white rounded-xl p-8">
                <div className="w-12 h-12 bg-stone-900 rounded-lg flex items-center justify-center mb-6">
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-stone-900 mb-3">{step.title}</h3>
                <p className="text-stone-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-16 px-4 sm:px-6 bg-stone-50">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '1M+', label: 'Locations Analyzed' },
              { value: '195', label: 'Countries Covered' },
              { value: '99%', label: 'Accuracy Rate' },
              { value: '<2s', label: 'Response Time' }
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-5xl font-black text-stone-900 mb-2">{stat.value}</p>
                <p className="text-sm text-stone-600 font-semibold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="relative py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-16">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 mb-4">
              Latest Insights
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl">
              Industry trends and technical deep-dives
            </p>
          </div>

          {posts.length > 0 ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link key={post.id} href={'/blog/' + post.slug} className="group">
                  <article className="h-full rounded-xl bg-stone-50 overflow-hidden hover:bg-stone-100 transition-colors">
                    {post.coverImage && (
                      <div className="aspect-video overflow-hidden relative">
                        <img 
                          src={post.coverImage} 
                          alt={post.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-stone-900 mb-2 line-clamp-2">
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
          ) : (
            <div className="text-center py-12">
              <p className="text-stone-600 mb-4">No insights available yet</p>
              <Button variant="outline" className="rounded-xl border-2 border-stone-300 text-stone-700 hover:bg-stone-50 font-semibold" asChild>
                <Link href="/blog">View All Articles</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="relative py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 mb-4">
              Stay Ahead of Geospatial Innovation
            </h2>
            <p className="text-lg text-stone-600">
              Get technical insights, product updates, and industry trends delivered monthly
            </p>
          </div>
          <NewsletterSignup />
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 px-4 sm:px-6 bg-stone-900">
        <div className="max-w-[1600px] mx-auto text-center relative z-10">
          <h2 className="text-5xl font-black text-white mb-6">
            Ready to Scale Your Location Intelligence?
          </h2>
          <p className="text-xl text-stone-300 mb-10 max-w-2xl mx-auto">
            Join 500+ enterprises processing millions of location requests with 99.9% uptime
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="h-16 px-10 text-lg bg-white hover:bg-stone-100 text-stone-900 border-0 shadow-xl font-semibold rounded-xl" asChild>
              <Link href="/api-access">
                Schedule Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-16 px-10 text-lg border-2 border-white text-white hover:bg-white/10 font-semibold rounded-xl" asChild>
              <Link href="/camera">Start Free Trial</Link>
            </Button>
          </div>
          <p className="mt-8 text-sm text-stone-400">Enterprise SLA • Dedicated Support • Custom Integration • SOC 2 Compliant</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-stone-200 py-12 px-4 sm:px-6 bg-white">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="/pic2nav.png" alt="Pic2Nav" className="h-14 w-auto object-contain drop-shadow-lg" />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-stone-600">
              <div className="flex gap-6">
                <Link href="/blog" className="hover:text-stone-900 transition-colors">Insights</Link>
                <Link href="/privacy" className="hover:text-stone-900 transition-colors">Privacy</Link>
                <Link href="/cookies" className="hover:text-stone-900 transition-colors">Cookies</Link>
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
