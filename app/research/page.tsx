"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, FileText, Database, Cpu } from "lucide-react"

export default function ResearchPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-9" />
            <span className="text-base font-mono tracking-wide text-stone-900">
              Pic2Nav Research
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-12 text-sm font-medium">
            <Link href="/blog" className="text-stone-700 hover:text-stone-900 transition-colors">Publications</Link>
            <Link href="/datasets" className="text-stone-700 hover:text-stone-900 transition-colors">Datasets</Link>
            <Link href="/research" className="text-stone-900">Research</Link>
          </div>

          <Button
            variant="outline"
            className="border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white transition-all font-medium"
            asChild
          >
            <Link href="/camera">Run Model</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-32 bg-gradient-to-b from-white to-stone-50">
        <div className="max-w-[1400px] mx-auto px-6">
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500 mb-6 font-mono">
            Research Overview
          </p>

          <h1 className="text-6xl leading-[1.1] font-bold text-stone-900 mb-6 tracking-tight max-w-[900px]">
            Advancing Visual Geolocation Through AI Research
          </h1>

          <p className="text-xl text-stone-600 leading-relaxed mb-10 max-w-[800px]">
            Our research focuses on developing novel computer vision and machine learning techniques for geographic location inference from visual data.
          </p>
        </div>
      </section>

      {/* NaviSense Model */}
      <section className="py-32 border-t border-stone-200 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="inline-block px-4 py-2 bg-stone-100 text-stone-900 text-sm font-mono">
                  Core Technology
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Training Active</span>
              </div>
              <h2 className="text-5xl font-bold mb-6 tracking-tight text-stone-900">
                NaviSense Model
              </h2>
              <p className="text-lg text-stone-600 leading-relaxed mb-8">
                NaviSense is our proprietary transformer-based architecture that combines visual embeddings with geospatial priors. The model achieves state-of-the-art performance in location prediction by learning hierarchical representations of architectural styles, environmental features, and urban patterns. Recent infrastructure improvements have enabled continuous training on live user data.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-stone-900 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold text-stone-900 mb-1">Multi-Scale Feature Extraction</h3>
                    <p className="text-stone-600">Captures both fine-grained architectural details and broad environmental context</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-stone-900 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold text-stone-900 mb-1">Geospatial Attention Mechanism</h3>
                    <p className="text-stone-600">Learns spatial relationships between visual features and geographic coordinates</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-stone-900 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold text-stone-900 mb-1">Continuous Learning Pipeline</h3>
                    <p className="text-stone-600">Real-time model updates from user interactions and location recognitions</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-stone-100 p-12 rounded-lg">
              <div className="space-y-6">
                <div className="bg-white p-6 border border-stone-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Cpu className="h-6 w-6 text-stone-900" />
                    <h3 className="font-semibold text-stone-900">Model Architecture</h3>
                  </div>
                  <div className="space-y-2 text-sm text-stone-600 font-mono">
                    <div>Input: 224×224 RGB Image</div>
                    <div>Backbone: Vision Transformer (ViT-L/16)</div>
                    <div>Embedding Dim: 1024</div>
                    <div>Attention Heads: 16</div>
                    <div>Layers: 24</div>
                    <div>Parameters: 307M</div>
                    <div>Output: Lat/Lng + Confidence</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Research Areas */}
      <section className="py-32 border-t border-stone-200 bg-stone-50">
        <div className="max-w-[1400px] mx-auto px-6">
          <h2 className="text-4xl font-bold mb-16 tracking-tight text-stone-900">
            Research Focus Areas
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white border border-stone-200 p-8 hover:border-stone-400 transition-all">
              <FileText className="h-10 w-10 text-stone-900 mb-6" />
              <h3 className="text-2xl font-semibold mb-4 text-stone-900">Visual Geolocation</h3>
              <p className="text-stone-600 leading-relaxed mb-6">
                Developing algorithms that predict geographic coordinates from single images using deep learning and computer vision techniques.
              </p>
              <ul className="space-y-2 text-sm text-stone-600">
                <li>• Street-level localization</li>
                <li>• Cross-view geo-localization</li>
                <li>• Uncertainty quantification</li>
              </ul>
            </div>

            <div className="bg-white border border-stone-200 p-8 hover:border-stone-400 transition-all">
              <Database className="h-10 w-10 text-stone-900 mb-6" />
              <h3 className="text-2xl font-semibold mb-4 text-stone-900">Dataset Curation</h3>
              <p className="text-stone-600 leading-relaxed mb-6">
                Building large-scale, diverse datasets of geotagged imagery for training and evaluating location recognition models.
              </p>
              <ul className="space-y-2 text-sm text-stone-600">
                <li>• Global coverage datasets</li>
                <li>• Temporal consistency</li>
                <li>• Privacy-preserving collection</li>
              </ul>
            </div>

            <div className="bg-white border border-stone-200 p-8 hover:border-stone-400 transition-all">
              <Cpu className="h-10 w-10 text-stone-900 mb-6" />
              <h3 className="text-2xl font-semibold mb-4 text-stone-900">Model Optimization</h3>
              <p className="text-stone-600 leading-relaxed mb-6">
                Improving model efficiency, accuracy, and robustness through novel architectures and training strategies.
              </p>
              <ul className="space-y-2 text-sm text-stone-600">
                <li>• Efficient transformers</li>
                <li>• Few-shot learning</li>
                <li>• Domain adaptation</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Publications */}
      <section className="py-32 border-t border-stone-200 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <h2 className="text-4xl font-bold mb-16 tracking-tight text-stone-900">
            Recent Publications
          </h2>

          <div className="space-y-8">
            <div className="border-l-4 border-stone-900 pl-8 py-4">
              <h3 className="text-xl font-semibold text-stone-900 mb-2">
                NaviSense: Transformer-Based Visual Geolocation with Spatial Priors
              </h3>
              <p className="text-stone-600 mb-3">
                A novel architecture combining vision transformers with geospatial attention mechanisms for improved location prediction accuracy.
              </p>
              <div className="flex items-center gap-4 text-sm text-stone-500">
                <span className="font-mono">2024</span>
                <span>•</span>
                <span>Computer Vision and Pattern Recognition</span>
              </div>
            </div>

            <div className="border-l-4 border-stone-300 pl-8 py-4">
              <h3 className="text-xl font-semibold text-stone-900 mb-2">
                Large-Scale Geotagged Image Dataset for Urban Environment Analysis
              </h3>
              <p className="text-stone-600 mb-3">
                Introducing a comprehensive dataset of 10M+ geotagged images spanning 195 countries for training location recognition models.
              </p>
              <div className="flex items-center gap-4 text-sm text-stone-500">
                <span className="font-mono">2024</span>
                <span>•</span>
                <span>International Conference on Computer Vision</span>
              </div>
            </div>

            <div className="border-l-4 border-stone-300 pl-8 py-4">
              <h3 className="text-xl font-semibold text-stone-900 mb-2">
                Zero-Shot Landmark Recognition via Contrastive Learning
              </h3>
              <p className="text-stone-600 mb-3">
                Enabling landmark identification without explicit training through contrastive vision-language models.
              </p>
              <div className="flex items-center gap-4 text-sm text-stone-500">
                <span className="font-mono">2023</span>
                <span>•</span>
                <span>Neural Information Processing Systems</span>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <Link href="/blog" className="inline-flex items-center gap-2 text-stone-900 hover:text-stone-600 transition-colors font-medium">
              View all publications
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 border-t border-stone-200 bg-stone-50">
        <div className="max-w-[1400px] mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6 tracking-tight text-stone-900">
            Collaborate With Us
          </h2>
          <p className="text-stone-600 text-lg mb-12 max-w-[600px] mx-auto">
            Interested in research collaboration or accessing our datasets? Get in touch with our team.
          </p>

          <div className="flex gap-4 justify-center">
            <Link href="/camera" className="group inline-flex items-center gap-3 px-8 py-4 bg-stone-900 text-white hover:bg-stone-800 transition-all text-lg font-medium">
              Try the demo
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link href="/api-access" className="inline-flex items-center gap-3 px-8 py-4 border-2 border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white transition-all text-lg font-medium">
              Access datasets
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-16 px-6 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-10 w-auto" />
            <p className="text-base text-stone-600">© {new Date().getFullYear()} Pic2Nav Research. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
