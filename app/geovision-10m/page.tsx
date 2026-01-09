"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Database, MapPin, Image, Download, CheckCircle2 } from "lucide-react"

export default function GeoVision10MPage() {
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
            <Link href="/research" className="text-stone-700 hover:text-stone-900 transition-colors">Research</Link>
          </div>

          <Button variant="outline" className="border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white transition-all font-medium" asChild>
            <Link href="/camera">Run Model</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-32 bg-gradient-to-b from-white to-stone-50">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center gap-3 mb-6">
            <p className="text-sm uppercase tracking-[0.2em] text-stone-500 font-mono">
              Dataset
            </p>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
              In Development
            </span>
          </div>

          <h1 className="text-6xl leading-[1.1] font-bold text-stone-900 mb-6 tracking-tight">
            GeoVision-10M
          </h1>

          <p className="text-xl text-stone-600 leading-relaxed mb-10 max-w-[800px]">
            A large-scale geotagged image dataset spanning 195 countries with precise GPS coordinates, timestamps, and comprehensive metadata for training visual geolocation models.
          </p>

          <div className="flex gap-4">
            <Button disabled className="bg-stone-200 text-stone-500 cursor-not-allowed">
              <Download className="h-4 w-4 mr-2" />
              Coming Soon
            </Button>
            <Button variant="outline" className="border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white" asChild>
              <Link href="/contribute">Contribute Data</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Dataset Overview */}
      <section className="py-32 border-t border-stone-200 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <h2 className="text-4xl font-bold mb-16 tracking-tight text-stone-900">
            Dataset Overview
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-stone-50 border border-stone-200 p-8">
              <Database className="h-10 w-10 text-stone-900 mb-4" />
              <h3 className="text-2xl font-bold text-stone-900 mb-2">10M+</h3>
              <p className="text-stone-600">Geotagged Images</p>
            </div>
            <div className="bg-stone-50 border border-stone-200 p-8">
              <MapPin className="h-10 w-10 text-stone-900 mb-4" />
              <h3 className="text-2xl font-bold text-stone-900 mb-2">195</h3>
              <p className="text-stone-600">Countries Covered</p>
            </div>
            <div className="bg-stone-50 border border-stone-200 p-8">
              <Image className="h-10 w-10 text-stone-900 mb-4" />
              <h3 className="text-2xl font-bold text-stone-900 mb-2">JPEG</h3>
              <p className="text-stone-600">High-Quality Format</p>
            </div>
          </div>

          <div className="prose max-w-none">
            <p className="text-lg text-stone-600 leading-relaxed mb-6">
              GeoVision-10M is designed to advance research in visual geolocation, landmark recognition, and urban environment analysis. Each image includes precise GPS coordinates extracted from EXIF data, along with temporal information and camera metadata.
            </p>
          </div>
        </div>
      </section>

      {/* Data Structure */}
      <section className="py-32 border-t border-stone-200 bg-stone-50">
        <div className="max-w-[1400px] mx-auto px-6">
          <h2 className="text-4xl font-bold mb-16 tracking-tight text-stone-900">
            Data Structure
          </h2>

          <div className="bg-white border border-stone-200 p-8 mb-8">
            <h3 className="text-xl font-semibold text-stone-900 mb-4">Image Metadata (JSON)</h3>
            <pre className="bg-stone-900 text-stone-100 p-6 overflow-x-auto text-sm font-mono">
{`{
  "image_id": "geo_0000001",
  "filename": "geo_0000001.jpg",
  "gps": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "altitude": 10.5,
    "accuracy": "high"
  },
  "timestamp": "2024-01-15T14:30:00Z",
  "camera": {
    "make": "Canon",
    "model": "EOS R5",
    "focal_length": 24,
    "iso": 100
  },
  "location": {
    "country": "United States",
    "region": "New York",
    "city": "New York City"
  },
  "annotations": {
    "building_type": "commercial",
    "architectural_style": "modern",
    "environment": "urban"
  }
}`}
            </pre>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border border-stone-200 p-6">
              <h4 className="font-semibold text-stone-900 mb-4">Included Fields</h4>
              <ul className="space-y-2 text-sm text-stone-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>GPS coordinates (lat/lng/altitude)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Timestamp and timezone information</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Camera make, model, and settings</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Geographic location labels</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Architectural annotations</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border border-stone-200 p-6">
              <h4 className="font-semibold text-stone-900 mb-4">Data Quality</h4>
              <ul className="space-y-2 text-sm text-stone-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>GPS accuracy validation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Duplicate detection and removal</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Privacy-preserving processing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Balanced geographic distribution</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Manual quality verification</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Collection Progress */}
      <section className="py-32 border-t border-stone-200 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <h2 className="text-4xl font-bold mb-16 tracking-tight text-stone-900">
            Collection Progress
          </h2>

          <div className="bg-stone-50 border border-stone-200 p-8 mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-stone-900">Images Collected</span>
              <span className="text-2xl font-bold text-stone-900">2.3M / 10M</span>
            </div>
            <div className="w-full bg-stone-200 h-4 rounded-full overflow-hidden">
              <div className="bg-stone-900 h-full" style={{ width: '23%' }}></div>
            </div>
            <p className="text-sm text-stone-600 mt-4">
              We're actively collecting and processing images. Help us reach our goal by contributing your geotagged photos.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-stone-200 p-6">
              <h4 className="font-semibold text-stone-900 mb-2">Phase 1: Collection</h4>
              <p className="text-sm text-stone-600 mb-3">Gathering geotagged images from contributors</p>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">In Progress</span>
            </div>
            <div className="border border-stone-200 p-6">
              <h4 className="font-semibold text-stone-900 mb-2">Phase 2: Processing</h4>
              <p className="text-sm text-stone-600 mb-3">Validation, annotation, and quality control</p>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">Ongoing</span>
            </div>
            <div className="border border-stone-200 p-6">
              <h4 className="font-semibold text-stone-900 mb-2">Phase 3: Release</h4>
              <p className="text-sm text-stone-600 mb-3">Public dataset release for research</p>
              <span className="px-3 py-1 bg-stone-200 text-stone-600 text-xs font-semibold rounded-full">Planned</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 border-t border-stone-200 bg-stone-50">
        <div className="max-w-[1400px] mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6 tracking-tight text-stone-900">
            Help Build GeoVision-10M
          </h2>
          <p className="text-stone-600 text-lg mb-12 max-w-[600px] mx-auto">
            Contribute your geotagged photos to help create the world's largest open visual geolocation dataset.
          </p>

          <div className="flex gap-4 justify-center">
            <Button className="bg-stone-900 hover:bg-stone-800 text-white font-medium" asChild>
              <Link href="/contribute">Start Contributing</Link>
            </Button>
            <Button variant="outline" className="border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white" asChild>
              <Link href="/datasets">View All Datasets</Link>
            </Button>
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
