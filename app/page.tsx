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

      {/* Video Background */}
      <div className="fixed top-0 left-0 w-full h-screen pointer-events-none z-0">
        {/* Video by niko Jimsheleishvili from Pixabay */}
        <video autoPlay loop muted playsInline className="w-full h-full object-cover" preload="auto">
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-white"></div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-transparent backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 relative z-10">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-7 sm:h-9" />
            <span className="text-sm sm:text-base font-mono tracking-wide text-white font-bold hidden sm:inline">
              Pic2Nav Research
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8 xl:gap-12 text-sm font-bold relative z-10">
            <Link href="/blog" className="text-white hover:text-stone-200 transition-colors">Publications</Link>
            <Link href="/datasets" className="text-white hover:text-stone-200 transition-colors">Datasets</Link>
            <Link href="/research" className="text-white hover:text-stone-200 transition-colors">Research</Link>
          </div>

          <Button
            variant="outline"
            className="border-white text-white hover:bg-white hover:text-stone-900 transition-all font-bold text-sm px-3 sm:px-4 relative z-10"
            asChild
          >
            <Link href="/camera">Run Model</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center z-10">
        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 text-center py-20">
          <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-8">
            <p className="text-sm text-white font-semibold uppercase tracking-wider">
              Computer Vision • Geospatial AI
            </p>
          </div>

          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl leading-[1.05] font-black text-white mb-8 tracking-tight">
            Inferring Geographic
            <br />
            <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Location from Visual Data</span>
          </h1>

          <p className="text-xl sm:text-2xl lg:text-3xl text-white/90 leading-relaxed mb-12 max-w-[900px] mx-auto font-medium">
            Research system for extracting geographic, architectural, and environmental signals from images using multimodal AI
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link href="/camera" className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-stone-900 hover:bg-white/90 transition-all font-bold rounded-full shadow-2xl">
              Run Demo
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link href="/blog" className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all font-semibold rounded-full">
              Read Publications
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-24 sm:py-32 bg-white z-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-20 sm:mb-24">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 text-stone-900">
              Research Capabilities
            </h2>
            <p className="text-xl text-stone-600 max-w-[700px] mx-auto">
              Advanced AI models for visual geolocation and environmental analysis
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="group p-8 bg-stone-50 hover:bg-stone-100 transition-all rounded-2xl">
              <div className="text-sm font-bold text-stone-400 mb-3">01</div>
              <h3 className="text-2xl font-bold text-stone-900 mb-3">Visual Geolocation</h3>
              <p className="text-stone-600 leading-relaxed">
                Predict latitude and longitude from architectural and environmental cues using deep learning models trained on global imagery datasets.
              </p>
            </div>

            <div className="group p-8 bg-stone-50 hover:bg-stone-100 transition-all rounded-2xl">
              <div className="text-sm font-bold text-stone-400 mb-3">02</div>
              <h3 className="text-2xl font-bold text-stone-900 mb-3">Landmark Recognition</h3>
              <p className="text-stone-600 leading-relaxed">
                Identify known and unknown landmarks using contrastive vision models with zero-shot classification capabilities.
              </p>
            </div>

            <div className="group p-8 bg-stone-50 hover:bg-stone-100 transition-all rounded-2xl">
              <div className="text-sm font-bold text-stone-400 mb-3">03</div>
              <h3 className="text-2xl font-bold text-stone-900 mb-3">Urban &amp; Environmental Signals</h3>
              <p className="text-stone-600 leading-relaxed">
                Infer walkability, density, and terrain characteristics from visual context through multi-task learning frameworks.
              </p>
            </div>

            <div className="group p-8 bg-gradient-to-br from-stone-900 to-stone-800 hover:from-stone-800 hover:to-stone-700 transition-all rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-sm font-bold text-stone-400">04</div>
                <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">Training Active</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">NaviSense Model</h3>
              <p className="text-stone-300 leading-relaxed">
                Our proprietary transformer-based architecture that combines visual embeddings with geospatial priors for enhanced location prediction accuracy. Now actively training on live user data with continuous learning capabilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App */}
      <section className="relative py-24 sm:py-32 bg-gradient-to-br from-stone-900 to-stone-800 z-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                Take Pic2Nav Anywhere
              </h2>
              <p className="text-xl text-stone-300 mb-8 leading-relaxed">
                Download our mobile app and access powerful geolocation AI directly from your phone. Analyze locations, identify landmarks, and explore the world around you.
              </p>
              <a href="https://play.google.com/store/apps/details?id=com.ssabiroad.pic2nav" target="_blank" rel="noopener noreferrer" className="inline-block">
                <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" className="h-16 sm:h-20" />
              </a>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="grid grid-cols-3 gap-4">
                <img src="/images/app-screenshot-1.jpg" alt="App Screenshot" className="rounded-2xl shadow-2xl" />
                <img src="/images/app-screenshot-2.jpg" alt="App Screenshot" className="rounded-2xl shadow-2xl mt-8" />
                <img src="/images/app-screenshot-3.jpg" alt="App Screenshot" className="rounded-2xl shadow-2xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="relative py-16 sm:py-24 lg:py-32 bg-stone-50 z-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 tracking-tight text-stone-900">Publications</h2>
            <p className="text-stone-600 text-lg sm:text-xl">
              Technical articles, experiments, and system updates.
            </p>
          </div>

          {posts.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {posts.map((post) => (
                <Link key={post.id} href={'/blog/' + post.slug} className="group block">
                  <article className="bg-white border border-stone-200 hover:border-stone-400 transition-all duration-300 h-full">
                    {post.coverImage && (
                      <div className="aspect-[16/10] overflow-hidden relative bg-stone-100">
                        <img 
                          src={post.coverImage} 
                          alt={post.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-lg sm:text-xl font-semibold text-stone-900 mb-2 line-clamp-2 group-hover:text-stone-600 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-base sm:text-lg text-stone-600 line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-stone-600 text-lg mb-4">No insights available yet</p>
              <Button variant="outline" className="rounded-xl border-2 border-stone-300 text-stone-700 hover:bg-stone-50 font-semibold" asChild>
                <Link href="/blog">View All Articles</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-16 sm:py-24 lg:py-32 border-t border-stone-200 bg-white z-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 tracking-tight text-stone-900">
            Explore the System
          </h2>
          <p className="text-stone-600 text-lg sm:text-xl mb-8 sm:mb-12 max-w-[600px] mx-auto px-4">
            Access the demo or integrate the research API into your workflow.
          </p>

          <Link href="/camera" className="group inline-flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-stone-900 text-white hover:bg-stone-800 transition-all text-base sm:text-lg font-medium">
            Launch interactive demo
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-stone-900 py-16 sm:py-20 px-4 sm:px-6 z-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Product</h3>
              <ul className="space-y-3">
                <li><Link href="/camera" className="text-stone-400 hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/api-access" className="text-stone-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/contribute" className="text-stone-400 hover:text-white transition-colors">Solutions</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Resources</h3>
              <ul className="space-y-3">
                <li><Link href="/docs" className="text-stone-400 hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/api-access" className="text-stone-400 hover:text-white transition-colors">API Reference</Link></li>
                <li><Link href="/blog" className="text-stone-400 hover:text-white transition-colors">Insights</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Company</h3>
              <ul className="space-y-3">
                <li><Link href="/about" className="text-stone-400 hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="text-stone-400 hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/contribute" className="text-stone-400 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Legal</h3>
              <ul className="space-y-3">
                <li><Link href="/privacy" className="text-stone-400 hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="text-stone-400 hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="/cookies" className="text-stone-400 hover:text-white transition-colors">Cookies</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img src="/pic2nav.png" alt="Pic2Nav" className="h-8" />
              <span className="text-stone-400 text-sm">© {new Date().getFullYear()} Pic2Nav Research</span>
            </div>
            <p className="text-stone-500 text-sm">All rights reserved.</p>
          </div>
        </div>
      </footer>

      </div>
      <CookieConsent />
    </>
  )
}
