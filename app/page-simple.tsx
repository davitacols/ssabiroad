import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Camera, MapPin, Upload } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Simple Header */}
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-6 w-6" />
            <span className="text-xl font-semibold">Pic2Nav</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button asChild>
              <Link href="/dashboard">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Find locations from your photos
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Upload a photo and discover where it was taken using AI analysis and GPS data.
          </p>
          <Button size="lg" asChild>
            <Link href="/dashboard">Try it now</Link>
          </Button>
        </div>

        {/* Simple Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <h3 className="font-semibold mb-2">Upload</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Upload any photo from your device
            </p>
          </div>
          <div className="text-center">
            <Camera className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h3 className="font-semibold mb-2">Analyze</h3>
            <p className="text-gray-600 dark:text-gray-400">
              AI analyzes the image for location clues
            </p>
          </div>
          <div className="text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-purple-600" />
            <h3 className="font-semibold mb-2">Discover</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Get location details and nearby places
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-2xl font-bold">10K+</div>
            <div className="text-gray-600 dark:text-gray-400">Photos analyzed</div>
          </div>
          <div>
            <div className="text-2xl font-bold">95%</div>
            <div className="text-gray-600 dark:text-gray-400">Accuracy</div>
          </div>
          <div>
            <div className="text-2xl font-bold">&lt;5s</div>
            <div className="text-gray-600 dark:text-gray-400">Response time</div>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t mt-16">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2024 Pic2Nav. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}