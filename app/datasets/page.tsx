"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Download, Database, MapPin, Image, FileText } from "lucide-react"

export default function DatasetsPage() {
  const datasets = [
    {
      name: "GeoVision-10M",
      description: "Large-scale geotagged image dataset spanning 195 countries with precise GPS coordinates and metadata.",
      size: "10M+ images",
      format: "JPEG, JSON metadata",
      license: "Research Use",
      status: "Coming Soon",
      features: ["GPS coordinates", "Timestamps", "Camera metadata", "Location labels"]
    },
    {
      name: "Urban-Arch-5K",
      description: "Curated collection of architectural images from urban environments with detailed annotations.",
      size: "5,000 images",
      format: "PNG, CSV annotations",
      license: "CC BY-NC 4.0",
      status: "Coming Soon",
      features: ["Building types", "Architectural styles", "Material labels", "Urban density scores"]
    },
    {
      name: "Landmark-Recognition-50K",
      description: "Diverse landmark dataset covering famous and local landmarks across multiple continents. Integrated with Google Vision API for real-time landmark detection. ML training pipeline now fully operational after recent infrastructure fixes.",
      size: "50,000+ images",
      format: "JPEG, JSON",
      license: "Research Use",
      status: "Active Training",
      features: ["Landmark names", "Geographic regions", "GPS coordinates", "Visual features", "API Integration", "Auto ML Training"]
    }
  ]

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
            <Link href="/datasets" className="text-stone-900">Datasets</Link>
            <Link href="/research" className="text-stone-700 hover:text-stone-900 transition-colors">Research</Link>
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
            Research Datasets
          </p>

          <h1 className="text-6xl leading-[1.1] font-bold text-stone-900 mb-6 tracking-tight max-w-[900px]">
            Open Datasets for Visual Geolocation Research
          </h1>

          <p className="text-xl text-stone-600 leading-relaxed mb-10 max-w-[800px]">
            We are currently curating datasets of geotagged imagery, architectural annotations, and landmark collections. Sign up below to be notified when they become available.
          </p>
        </div>
      </section>

      {/* Datasets Grid */}
      <section className="py-32 border-t border-stone-200 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="space-y-8">
            {datasets.map((dataset, index) => (
              <div key={index} className="bg-white border-2 border-stone-200 hover:border-stone-400 transition-all p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h2 className="text-3xl font-bold text-stone-900">{dataset.name}</h2>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        dataset.status === "Available" 
                          ? "bg-green-100 text-green-800" 
                          : dataset.status === "Active Training"
                          ? "bg-green-100 text-green-800"
                          : dataset.status === "In Collection"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {dataset.status}
                      </span>
                    </div>
                    <p className="text-lg text-stone-600 leading-relaxed mb-6">
                      {dataset.description}
                    </p>
                  </div>
                  {dataset.status === "Available" && (
                    <Button className="bg-stone-900 hover:bg-stone-800 text-white font-medium ml-6">
                      <Download className="h-4 w-4 mr-2" />
                      Request Access
                    </Button>
                  )}
                  {dataset.status === "Coming Soon" && dataset.name === "GeoVision-10M" && (
                    <Button variant="outline" className="border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white font-medium ml-6" asChild>
                      <Link href="/geovision-10m">View Progress</Link>
                    </Button>
                  )}
                  {dataset.status === "Active Training" && (
                    <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-600 hover:text-white font-medium ml-6" asChild>
                      <Link href="/camera">View Live System</Link>
                    </Button>
                  )}
                  {dataset.status === "Coming Soon" && dataset.name === "Landmark-Recognition-50K" && (
                    <Button variant="outline" className="border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white font-medium ml-6" asChild>
                      <Link href="/landmark-recognition-50k">Contribute</Link>
                    </Button>
                  )}
                  {dataset.status === "Coming Soon" && dataset.name !== "GeoVision-10M" && dataset.name !== "Landmark-Recognition-50K" && (
                    <Button disabled className="bg-stone-200 text-stone-500 font-medium ml-6 cursor-not-allowed">
                      Coming Soon
                    </Button>
                  )}
                </div>

                <div className="grid md:grid-cols-4 gap-6 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-4 w-4 text-stone-500" />
                      <span className="text-sm font-semibold text-stone-900">Size</span>
                    </div>
                    <p className="text-stone-600">{dataset.size}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-stone-500" />
                      <span className="text-sm font-semibold text-stone-900">Format</span>
                    </div>
                    <p className="text-stone-600">{dataset.format}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Image className="h-4 w-4 text-stone-500" />
                      <span className="text-sm font-semibold text-stone-900">License</span>
                    </div>
                    <p className="text-stone-600">{dataset.license}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-stone-900 mb-3">Features & Annotations</h3>
                  <div className="flex flex-wrap gap-2">
                    {dataset.features.map((feature, i) => (
                      <span key={i} className="px-3 py-1 bg-stone-100 text-stone-700 text-sm rounded-full">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Usage Guidelines */}
      <section className="py-32 border-t border-stone-200 bg-stone-50">
        <div className="max-w-[1400px] mx-auto px-6">
          <h2 className="text-4xl font-bold mb-16 tracking-tight text-stone-900">
            Usage Guidelines
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border border-stone-200 p-8">
              <h3 className="text-2xl font-semibold mb-4 text-stone-900">Academic Research</h3>
              <p className="text-stone-600 leading-relaxed mb-4">
                Our datasets are freely available for academic and non-commercial research purposes. We encourage researchers to cite our work in publications.
              </p>
              <ul className="space-y-2 text-stone-600">
                <li>• Free access for academic institutions</li>
                <li>• Citation required in publications</li>
                <li>• No redistribution without permission</li>
              </ul>
            </div>

            <div className="bg-white border border-stone-200 p-8">
              <h3 className="text-2xl font-semibold mb-4 text-stone-900">Commercial Use</h3>
              <p className="text-stone-600 leading-relaxed mb-4">
                For commercial applications, please contact us to discuss licensing options and terms of use.
              </p>
              <ul className="space-y-2 text-stone-600">
                <li>• Custom licensing available</li>
                <li>• Enterprise support included</li>
                <li>• API access options</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Request Access */}
      <section className="py-32 border-t border-stone-200 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="max-w-[800px] mx-auto">
            <h2 className="text-4xl font-bold mb-6 tracking-tight text-stone-900 text-center">
              Get Notified When Datasets Launch
            </h2>
            <p className="text-stone-600 text-lg mb-12 text-center">
              Sign up to receive updates when our research datasets become available. We'll notify you as soon as they're ready for access.
            </p>

            <div className="bg-stone-50 border border-stone-200 p-8">
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-2">Full Name</label>
                  <input type="text" className="w-full px-4 py-3 border border-stone-300 focus:border-stone-900 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-2">Email Address</label>
                  <input type="email" className="w-full px-4 py-3 border border-stone-300 focus:border-stone-900 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-2">Institution/Organization</label>
                  <input type="text" className="w-full px-4 py-3 border border-stone-300 focus:border-stone-900 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-2">Research Interest</label>
                  <textarea rows={4} className="w-full px-4 py-3 border border-stone-300 focus:border-stone-900 focus:outline-none" placeholder="Tell us about your research interests and how you plan to use the datasets..."></textarea>
                </div>
                <Button className="w-full bg-stone-900 hover:bg-stone-800 text-white font-medium py-4 text-lg">
                  Notify Me When Available
                </Button>
              </form>
            </div>
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
