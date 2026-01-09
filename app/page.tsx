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
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-3">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-7 sm:h-9" />
            <span className="text-sm sm:text-base font-mono tracking-wide text-stone-900 hidden sm:inline">
              Pic2Nav Research
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8 xl:gap-12 text-sm font-medium">
            <Link href="/blog" className="text-stone-700 hover:text-stone-900 transition-colors">Publications</Link>
            <Link href="/datasets" className="text-stone-700 hover:text-stone-900 transition-colors">Datasets</Link>
            <Link href="/research" className="text-stone-700 hover:text-stone-900 transition-colors">Research</Link>
          </div>

          <Button
            variant="outline"
            className="border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white transition-all font-medium text-sm px-3 sm:px-4"
            asChild
          >
            <Link href="/camera">Run Model</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 sm:py-24 lg:py-32 bg-gradient-to-b from-white to-stone-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-stone-500 mb-4 sm:mb-6 font-mono">
            Computer Vision &amp; Geospatial AI
          </p>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] font-bold text-stone-900 mb-4 sm:mb-6 tracking-tight">
            Inferring Geographic Location from Visual Data
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-stone-600 leading-relaxed mb-8 sm:mb-10 max-w-[700px]">
            Pic2Nav is a research system for extracting geographic, architectural,
            and environmental signals from single images using multimodal AI models.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-base sm:text-lg items-start sm:items-center">
            <Link href="/camera" className="group inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white hover:bg-stone-800 transition-colors w-full sm:w-auto justify-center">
              Run interactive demo
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link href="/blog" className="text-stone-700 hover:text-stone-900 underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900 transition-colors">
              Read publications
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 lg:py-32 border-t border-stone-200 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-8 sm:mb-12 lg:mb-16 tracking-tight text-stone-900">
            Research Capabilities
          </h2>

          <ul className="space-y-8 sm:space-y-12">
            <li className="group">
              <div className="flex items-start gap-3 sm:gap-6">
                <span className="font-mono text-xs text-stone-400 mt-1 min-w-[2rem] sm:min-w-[3rem]">01</span>
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-3 text-stone-900 group-hover:text-stone-600 transition-colors">Visual Geolocation</h3>
                  <p className="text-stone-600 text-base sm:text-lg lg:text-xl leading-relaxed">
                    Predict latitude and longitude from architectural and environmental cues using deep learning models trained on global imagery datasets.
                  </p>
                </div>
              </div>
            </li>

            <li className="group">
              <div className="flex items-start gap-3 sm:gap-6">
                <span className="font-mono text-xs text-stone-400 mt-1 min-w-[2rem] sm:min-w-[3rem]">02</span>
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-3 text-stone-900 group-hover:text-stone-600 transition-colors">Landmark Recognition</h3>
                  <p className="text-stone-600 text-base sm:text-lg lg:text-xl leading-relaxed">
                    Identify known and unknown landmarks using contrastive vision models with zero-shot classification capabilities.
                  </p>
                </div>
              </div>
            </li>

            <li className="group">
              <div className="flex items-start gap-3 sm:gap-6">
                <span className="font-mono text-xs text-stone-400 mt-1 min-w-[2rem] sm:min-w-[3rem]">03</span>
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-3 text-stone-900 group-hover:text-stone-600 transition-colors">Urban &amp; Environmental Signals</h3>
                  <p className="text-stone-600 text-base sm:text-lg lg:text-xl leading-relaxed">
                    Infer walkability, density, and terrain characteristics from visual context through multi-task learning frameworks.
                  </p>
                </div>
              </div>
            </li>

            <li className="group">
              <div className="flex items-start gap-3 sm:gap-6">
                <span className="font-mono text-xs text-stone-400 mt-1 min-w-[2rem] sm:min-w-[3rem]">04</span>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-stone-900 group-hover:text-stone-600 transition-colors">NaviSense Model</h3>
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs sm:text-sm font-medium rounded-full inline-block w-fit">In Training</span>
                  </div>
                  <p className="text-stone-600 text-base sm:text-lg lg:text-xl leading-relaxed">
                    Our proprietary transformer-based architecture currently in development that combines visual embeddings with geospatial priors for enhanced location prediction accuracy and semantic understanding of built environments.
                  </p>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-16 sm:py-24 lg:py-32 border-t border-stone-200 bg-stone-50">
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
      <section className="py-16 sm:py-24 lg:py-32 border-t border-stone-200 bg-white">
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
      <footer className="relative border-t border-stone-200 py-12 sm:py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-stone-900 mb-3 sm:mb-4">Product</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li><Link href="/camera" className="text-sm sm:text-base text-stone-600 hover:text-stone-900">Features</Link></li>
                <li><Link href="/api-access" className="text-sm sm:text-base text-stone-600 hover:text-stone-900">Pricing</Link></li>
                <li><Link href="/contribute" className="text-sm sm:text-base text-stone-600 hover:text-stone-900">Solutions</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-stone-900 mb-3 sm:mb-4">Resources</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li><Link href="/docs" className="text-sm sm:text-base text-stone-600 hover:text-stone-900">Documentation</Link></li>
                <li><Link href="/api-access" className="text-sm sm:text-base text-stone-600 hover:text-stone-900">API Reference</Link></li>
                <li><Link href="/blog" className="text-sm sm:text-base text-stone-600 hover:text-stone-900">Insights</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-stone-900 mb-3 sm:mb-4">Company</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li><Link href="/about" className="text-sm sm:text-base text-stone-600 hover:text-stone-900">About</Link></li>
                <li><Link href="/blog" className="text-sm sm:text-base text-stone-600 hover:text-stone-900">Blog</Link></li>
                <li><Link href="/contribute" className="text-sm sm:text-base text-stone-600 hover:text-stone-900">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-stone-900 mb-3 sm:mb-4">Legal</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li><Link href="/privacy" className="text-sm sm:text-base text-stone-600 hover:text-stone-900">Privacy</Link></li>
                <li><Link href="/terms" className="text-sm sm:text-base text-stone-600 hover:text-stone-900">Terms</Link></li>
                <li><Link href="/cookies" className="text-sm sm:text-base text-stone-600 hover:text-stone-900">Cookies</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-6 sm:pt-8 border-t border-stone-200 flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-8 sm:h-10 w-auto" />
            <p className="text-sm sm:text-base text-stone-600 text-center">© {new Date().getFullYear()} Pic2Nav. All rights reserved.</p>
          </div>
        </div>
      </footer>

      </div>
      <CookieConsent />
    </>
  )
}
