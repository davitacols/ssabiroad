import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { Camera, MapPin, Zap, ArrowRight, Check, Sparkles, Shield, Navigation } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Navigation */}
      <nav className="border-b border-white/20 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Navigation className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                <Camera className="h-2 w-2 text-white" />
              </div>
            </div>
            <div>
              <span className="font-bold text-2xl bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Pic2Nav</span>
              <div className="text-xs text-slate-500 dark:text-slate-400 -mt-1">AI Location Discovery</div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link href="/analytics">Analytics</Link>
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600" asChild>
              <Link href="/dashboard">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-32 px-6">
        <div className="container mx-auto text-center max-w-5xl">
          <Badge className="mb-6 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-500/20 text-emerald-700 px-4 py-2">
            <Sparkles className="h-4 w-4 mr-2" />
            AI-Powered Location Discovery
          </Badge>
          
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-8">
            <span className="bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              Navigate
            </span>
            <br />
            <span className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              with Pictures
            </span>
          </h1>
          
          <p className="text-2xl text-slate-600 dark:text-slate-300 mb-12 max-w-3xl mx-auto">
            Transform any photo into detailed location insights. Our advanced AI recognizes places, extracts GPS data, and discovers nearby attractions.
          </p>
          
          <div className="flex justify-center mb-16">
            <Button size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600" asChild>
              <Link href="/dashboard">
                <Camera className="h-5 w-5 mr-3" />
                Start Exploring
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20 dark:border-slate-700/50">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <Check className="h-6 w-6 text-white" />
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">100% Free</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">No hidden costs</span>
            </div>
            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20 dark:border-slate-700/50">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">Instant Results</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">Under 2 seconds</span>
            </div>
            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20 dark:border-slate-700/50">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">Privacy First</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">No registration needed</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 px-6 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Two Modes, Endless Possibilities
            </h2>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50">
              <CardContent className="p-10">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-8">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Smart Analysis Mode</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-8 text-lg">
                  Advanced AI examines every detail—from storefront signs to architectural features.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950/50 dark:to-pink-950/50">
              <CardContent className="p-10">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-8">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">GPS Precision Mode</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-8 text-lg">
                  Extract exact coordinates from photo metadata and discover nearby attractions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 bg-gradient-to-br from-blue-600 via-purple-600 to-emerald-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6">
            Ready to Start Your Photo Adventure?
          </h2>
          <p className="text-2xl opacity-90 mb-12 max-w-3xl mx-auto">
            Join thousands of explorers using Pic2Nav to discover amazing places.
          </p>
          <Button size="lg" className="text-xl px-10 py-5 bg-white text-blue-600 hover:bg-gray-100 dark:bg-white dark:text-blue-600 dark:hover:bg-gray-100" asChild>
            <Link href="/dashboard">
              <Camera className="h-6 w-6 mr-3" />
              Start Exploring Now
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}