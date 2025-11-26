"use client"

import { Button } from "@/components/ui/button"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBook, faCamera, faBuilding, faMapMarkedAlt, faMobileAlt, faCode } from '@fortawesome/free-solid-svg-icons'
import Link from "next/link"

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-black">
      <nav className="sticky top-0 z-50 border-b border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-12 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/api-access" className="text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white font-medium">API</Link>
            <Button className="bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-black font-semibold rounded-lg" asChild>
              <Link href="/camera">Try Now</Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-stone-900 dark:text-white mb-3">Documentation</h1>
          <p className="text-lg text-stone-600 dark:text-stone-400">Complete guide to SSABIRoad platform and Pic2Nav mobile app</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl">
              <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800">
                <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
                  <FontAwesomeIcon icon={faBuilding} className="w-5 h-5" />
                  Platform Overview
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-stone-600 dark:text-stone-400">SSABIRoad is a comprehensive platform for architectural and location analysis combining computer vision, geospatial data, and AI.</p>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-base font-semibold text-stone-900 dark:text-white mb-1">Building Analysis</h3>
                    <p className="text-sm text-stone-600 dark:text-stone-400">Architectural style detection, material analysis, structural condition assessment, and energy efficiency metrics</p>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-stone-900 dark:text-white mb-1">Location Intelligence</h3>
                    <p className="text-sm text-stone-600 dark:text-stone-400">Precise geolocation, walkability scores, urban density analysis, environmental metrics, and safety assessments</p>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-stone-900 dark:text-white mb-1">Smart Detection</h3>
                    <p className="text-sm text-stone-600 dark:text-stone-400">Image-based building recognition, landmark detection, text recognition, and similarity matching</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl">
              <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800">
                <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
                  <FontAwesomeIcon icon={faMobileAlt} className="w-5 h-5" />
                  Pic2Nav Mobile App
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-stone-600 dark:text-stone-400">Mobile companion app for photo location analysis and professional tools</p>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-base font-semibold text-stone-900 dark:text-white mb-1">Photo Scanner</h3>
                    <p className="text-sm text-stone-600 dark:text-stone-400">Identify locations from images using GPS data and visual analysis</p>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-stone-900 dark:text-white mb-1">Professional Tools</h3>
                    <p className="text-sm text-stone-600 dark:text-stone-400">Bulk EXIF editor, GPS geotagging, multi-photo processing, and processing history</p>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-stone-900 dark:text-white mb-1">Location Management</h3>
                    <p className="text-sm text-stone-600 dark:text-stone-400">Save, share, and organize discovered locations</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl">
              <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800">
                <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
                  <FontAwesomeIcon icon={faCamera} className="w-5 h-5" />
                  How to Use
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-stone-900 dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-sm">1</div>
                    <div>
                      <h3 className="text-base font-semibold text-stone-900 dark:text-white mb-1">Upload Photo</h3>
                      <p className="text-sm text-stone-600 dark:text-stone-400">Take a photo or upload an existing image of a building or location</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-stone-900 dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-sm">2</div>
                    <div>
                      <h3 className="text-base font-semibold text-stone-900 dark:text-white mb-1">AI Analysis</h3>
                      <p className="text-sm text-stone-600 dark:text-stone-400">Our AI analyzes GPS data, visual features, landmarks, and text in the image</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-stone-900 dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-sm">3</div>
                    <div>
                      <h3 className="text-base font-semibold text-stone-900 dark:text-white mb-1">Get Results</h3>
                      <p className="text-sm text-stone-600 dark:text-stone-400">Receive detailed location information, nearby places, weather, and more</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl">
              <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800">
                <h2 className="text-lg font-bold text-stone-900 dark:text-white">Quick Links</h2>
              </div>
              <div className="p-6 space-y-2">
                <Link href="/camera" className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white">
                  <FontAwesomeIcon icon={faCamera} className="w-4 h-4" />
                  <span className="text-sm font-medium">Try Camera</span>
                </Link>
                <Link href="/api-access" className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white">
                  <FontAwesomeIcon icon={faCode} className="w-4 h-4" />
                  <span className="text-sm font-medium">API Access</span>
                </Link>
                <Link href="/" className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white">
                  <FontAwesomeIcon icon={faMapMarkedAlt} className="w-4 h-4" />
                  <span className="text-sm font-medium">Explore Features</span>
                </Link>
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl">
              <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800">
                <h2 className="text-lg font-bold text-stone-900 dark:text-white">Technology</h2>
              </div>
              <div className="p-6">
                <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
                  <li>• Next.js 15 & React 18</li>
                  <li>• Google Cloud Vision API</li>
                  <li>• Claude AI Integration</li>
                  <li>• PostgreSQL Database</li>
                  <li>• Leaflet Maps</li>
                  <li>• Three.js 3D Visualization</li>
                </ul>
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl">
              <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800">
                <h2 className="text-lg font-bold text-stone-900 dark:text-white">Support</h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">Need help? Contact our team.</p>
                <Button className="w-full bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-black font-semibold rounded-lg">
                  Get Support
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
