"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import * as LucideIcons from "lucide-react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

// Modern code preview component with syntax highlighting
const CodePreview = () => {
  return (
    <div className="rounded-xl overflow-hidden border border-border shadow-lg bg-card">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50">
        <div className="flex items-center">
          <div className="flex space-x-2 mr-3">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="flex items-center">
            <LucideIcons.FileCode className="w-4 h-4 mr-2 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">building-recognition.py</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <LucideIcons.Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <LucideIcons.Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <ScrollArea className="bg-card p-4 max-h-[400px]">
        <pre className="text-sm font-mono">
          <code className="language-python">
            <span className="text-purple-500">import</span> <span className="text-blue-500">tensorflow</span>{" "}
            <span className="text-purple-500">as</span> <span className="text-blue-500">tf</span>
            <br />
            <span className="text-purple-500">from</span>{" "}
            <span className="text-blue-500">tensorflow.keras.applications</span>{" "}
            <span className="text-purple-500">import</span> <span className="text-blue-500">ResNet50</span>
            <br />
            <span className="text-purple-500">from</span>{" "}
            <span className="text-blue-500">tensorflow.keras.preprocessing</span>{" "}
            <span className="text-purple-500">import</span> <span className="text-blue-500">image</span>
            <br />
            <span className="text-purple-500">import</span> <span className="text-blue-500">numpy</span>{" "}
            <span className="text-purple-500">as</span> <span className="text-blue-500">np</span>
            <br />
            <br />
            <span className="text-green-500"># Building recognition model with advanced feature detection</span>
            <br />
            <span className="text-purple-500">def</span> <span className="text-yellow-500">recognize_building</span>
            (image_path, confidence_threshold=0.85):
            <br />
            {"    "}
            <span className="text-green-500"># Load pre-trained model</span>
            <br />
            {"    "}model = ResNet50(weights=<span className="text-orange-500">'imagenet'</span>, include_top=
            <span className="text-blue-500">True</span>)
            <br />
            <br />
            {"    "}
            <span className="text-green-500"># Preprocess the image</span>
            <br />
            {"    "}img = image.load_img(image_path, target_size=(224, 224))
            <br />
            {"    "}x = image.img_to_array(img)
            <br />
            {"    "}x = np.expand_dims(x, axis=0)
            <br />
            {"    "}x = tf.keras.applications.resnet50.preprocess_input(x)
            <br />
            <br />
            {"    "}
            <span className="text-green-500"># Make prediction</span>
            <br />
            {"    "}predictions = model.predict(x)
            <br />
            {"    "}results = tf.keras.applications.resnet50.decode_predictions(predictions, top=5)[0]
            <br />
            <br />
            {"    "}
            <span className="text-green-500"># Filter building-related classes</span>
            <br />
            {"    "}building_classes = [<span className="text-orange-500">'palace'</span>,{" "}
            <span className="text-orange-500">'monastery'</span>, <span className="text-orange-500">'church'</span>,{" "}
            <span className="text-orange-500">'mosque'</span>, <span className="text-orange-500">'library'</span>,{" "}
            <span className="text-orange-500">'hospital'</span>]
            <br />
            {"    "}building_results = [(label, score) <span className="text-purple-500">for</span> (_, label, score){" "}
            <span className="text-purple-500">in</span> results <span className="text-purple-500">if</span> label{" "}
            <span className="text-purple-500">in</span> building_classes <span className="text-purple-500">and</span>{" "}
            score >= confidence_threshold]
            <br />
            <br />
            {"    "}
            <span className="text-purple-500">return</span> building_results
            <br />
            <br />
            <span className="text-purple-500">def</span> <span className="text-yellow-500">get_building_details</span>
            (building_type, location=<span className="text-blue-500">None</span>):
            <br />
            {"    "}
            <span className="text-green-500"># Connect to architectural database</span>
            <br />
            {"    "}db = ArchitecturalDatabase()
            <br />
            {"    "}
            <span className="text-purple-500">return</span> db.query(building_type=building_type, location=location)
          </code>
        </pre>
      </ScrollArea>
      <div className="px-4 py-3 bg-muted/50 border-t border-border flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <LucideIcons.Star className="w-4 h-4 text-yellow-500 mr-1" />
            <span className="text-xs text-muted-foreground">234</span>
          </div>
          <div className="flex items-center">
            <LucideIcons.GitFork className="w-4 h-4 text-muted-foreground mr-1" />
            <span className="text-xs text-muted-foreground">45</span>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          Python
        </Badge>
      </div>
    </div>
  )
}

// Modern activity graph with hover effects
const ActivityGraph = () => {
  const days = 30
  const data = Array.from({ length: days }, () => Math.floor(Math.random() * 5))

  return (
    <div className="flex items-end h-24 gap-1">
      {data.map((value, index) => {
        const height = value === 0 ? "h-2" : `h-${value * 5}`
        const color =
          value === 0
            ? "bg-muted"
            : value === 1
              ? "bg-emerald-200 dark:bg-emerald-900/40"
              : value === 2
                ? "bg-emerald-300 dark:bg-emerald-800/60"
                : value === 3
                  ? "bg-emerald-400 dark:bg-emerald-700/80"
                  : "bg-emerald-500 dark:bg-emerald-600"

        return (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`w-2 ${height} rounded-sm ${color} hover:opacity-80 transition-all duration-200`}
                  style={{ height: `${value === 0 ? 8 : value * 12}px` }}
                ></div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {value} activities on day {days - index}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      })}
    </div>
  )
}

// Interactive map component with modern styling
const InteractiveMap = () => {
  return (
    <div className="w-full h-[300px] sm:h-[400px] bg-muted rounded-xl overflow-hidden border border-border shadow-lg relative">
      <div className="absolute inset-0 bg-gradient-to-br from-background/80 to-background/30"></div>

      {/* Map Grid */}
      <div className="absolute inset-0 grid grid-cols-12 grid-rows-12">
        {Array.from({ length: 144 }).map((_, i) => (
          <div key={i} className="border-[0.5px] border-border/20"></div>
        ))}
      </div>

      {/* Buildings and landmarks with glow effects */}
      <div className="absolute top-1/4 left-1/4 w-12 h-16 bg-primary/70 rounded-sm shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"></div>
      <div className="absolute top-1/3 left-1/2 w-10 h-14 bg-purple-500/70 dark:bg-purple-600/70 rounded-sm shadow-[0_0_15px_rgba(139,92,246,0.5)]"></div>
      <div className="absolute top-1/2 left-1/3 w-16 h-20 bg-muted-foreground/50 rounded-sm"></div>

      {/* Map Controls */}
      <div className="absolute top-4 left-4 right-4 bg-background/90 backdrop-blur-md rounded-lg shadow-lg p-2 border border-border">
        <div className="flex items-center">
          <LucideIcons.Search className="w-4 h-4 text-muted-foreground mr-2" />
          <Input
            placeholder="Search buildings..."
            className="h-8 text-sm border-none focus-visible:ring-0 bg-transparent"
          />
          <Button variant="ghost" size="sm" className="ml-2 h-8 w-8 p-0">
            <LucideIcons.SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/90 backdrop-blur-md shadow-lg">
          <LucideIcons.Plus className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/90 backdrop-blur-md shadow-lg">
          <LucideIcons.Minus className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/90 backdrop-blur-md shadow-lg">
          <LucideIcons.Layers className="w-4 h-4" />
        </Button>
      </div>

      {/* Building Info Popup with glass morphism effect */}
      <div className="absolute bottom-20 left-1/4 bg-background/80 backdrop-blur-md rounded-lg shadow-lg p-4 w-64 border border-border">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-sm">Central Tower</h3>
            <p className="text-xs text-muted-foreground">Modern Office Building</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            Verified
          </Badge>
        </div>
        <Separator className="my-2" />
        <div className="grid gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Built:</span>
            <span>2018</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Height:</span>
            <span>185m</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Architect:</span>
            <span>Foster & Partners</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Feature data with improved descriptions
const features = [
  {
    icon: "Zap",
    title: "Instant Recognition",
    desc: "Identify buildings in real-time with 98.7% accuracy using our advanced AI model.",
    badge: "Fast",
  },
  {
    icon: "Database",
    title: "Rich Information",
    desc: "Access detailed architectural, historical, and cultural data from our comprehensive database.",
    badge: "Comprehensive",
  },
  {
    icon: "Globe",
    title: "Global Coverage",
    desc: "Explore buildings worldwide with localized context and information in 42 languages.",
    badge: "International",
  },
  {
    icon: "Cube",
    title: "3D Modeling",
    desc: "Generate detailed 3D models from 2D images with accurate proportions and textures.",
    badge: "Advanced",
  },
]

// Pricing plans with improved features
const plans = [
  {
    icon: "Home",
    title: "Free",
    price: "$0",
    period: "forever",
    features: ["Building Recognition", "Basic Information", "10 Scans/Day", "Community Support", "Mobile App Access"],
    popular: false,
    buttonText: "Get Started",
    buttonVariant: "outline",
  },
  {
    icon: "Building2",
    title: "Pro",
    price: "$29",
    period: "per month",
    features: [
      "Advanced Analytics",
      "Historical Data",
      "Unlimited Scans",
      "API Access (500 req/day)",
      "Priority Support",
      "Offline Mode",
    ],
    popular: true,
    buttonText: "Try Pro",
    buttonVariant: "default",
  },
  {
    icon: "Buildings",
    title: "Enterprise",
    price: "Custom",
    period: "per organization",
    features: [
      "Dedicated Instance",
      "Custom Integration",
      "Unlimited Everything",
      "Full API Access",
      "24/7 Support",
      "SLA Guarantee",
      "On-premises Option",
    ],
    popular: false,
    buttonText: "Contact Sales",
    buttonVariant: "outline",
  },
]

// Testimonials with improved content
const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Senior Architect",
    company: "DesignWorks Studio",
    avatar: "/placeholder.svg?height=40&width=40",
    content:
      "SabiRoad has revolutionized how we approach urban design projects. The instant building recognition and detailed information have become indispensable in our workflow. The 3D modeling feature saves us countless hours.",
  },
  {
    name: "Michael Chen",
    role: "Urban Planner",
    company: "CityScape Solutions",
    avatar: "/placeholder.svg?height=40&width=40",
    content:
      "As an urban planner, SabiRoad has been a game-changer. It's like having a comprehensive city database right in my pocket. The API integration with our existing tools made adoption seamless across our entire team.",
  },
  {
    name: "Emily Rodriguez",
    role: "Real Estate Developer",
    company: "Horizon Properties",
    avatar: "/placeholder.svg?height=40&width=40",
    content:
      "SabiRoad's detailed building information and 3D modeling capabilities have significantly streamlined our property assessment process. The Pro plan's unlimited scans feature has paid for itself many times over.",
  },
]

// Main component with modern UI
const SabiRoadModern = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [activeTab, setActiveTab] = useState("features")
  const router = useRouter()
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Handle dark mode toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Handle authentication flow
  const handleGetStarted = useCallback(
    (plan?: string) => {
      if (status === "authenticated" && session) {
        router.push("/dashboard")
      } else {
        const authPath = plan === "Pro" ? "/signup" : "/login"
        router.push(authPath)
      }
    },
    [router, session, status],
  )

  // Toggle theme
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <div className={`min-h-screen bg-background text-foreground ${isDarkMode ? "dark" : ""}`}>
      {/* Modern Navbar with glass morphism effect */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className={`fixed w-full z-50 transition-all duration-300 ${
          isScrolled ? "bg-background/80 backdrop-blur-lg shadow-sm" : "bg-background"
        } border-b border-border`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4 sm:space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-purple-600 rounded-lg flex items-center justify-center">
                  <LucideIcons.Building2 className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold">SabiRoad</span>
              </Link>

              <div className="hidden md:flex items-center space-x-1">
                <Link href="/api-doc">
                  <Button variant="ghost" className="text-sm font-medium">
                    <LucideIcons.Code2 className="w-4 h-4 mr-2" />
                    API
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button variant="ghost" className="text-sm font-medium">
                    <LucideIcons.FileText className="w-4 h-4 mr-2" />
                    Docs
                  </Button>
                </Link>
                <Button variant="ghost" className="text-sm font-medium">
                  <LucideIcons.LayoutDashboard className="w-4 h-4 mr-2" />
                  Examples
                </Button>
                <Button variant="ghost" className="text-sm font-medium">
                  <LucideIcons.Users className="w-4 h-4 mr-2" />
                  Community
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:block relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <LucideIcons.Search className="w-4 h-4 text-muted-foreground" />
                </div>
                <Input type="search" placeholder="Search..." className="pl-10 h-9 w-64 bg-muted/50 text-sm" />
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <LucideIcons.Moon className="h-4 w-4 text-muted-foreground" />
                  <Switch checked={isDarkMode} onCheckedChange={toggleTheme} />
                  <LucideIcons.Sun className="h-4 w-4 text-muted-foreground" />
                </div>

                {status === "authenticated" ? (
                  <Avatar className="h-8 w-8 border-2 border-primary/20">
                    <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {session?.user?.name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
                      Sign in
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => router.push("/signup")}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Sign up
                    </Button>
                  </>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <LucideIcons.Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </motion.header>
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <div className="px-4 py-2 space-y-1">
            <Link href="/api-doc">
              <Button variant="ghost" className="w-full justify-start text-sm font-medium">
                <LucideIcons.Code2 className="w-4 h-4 mr-2" />
                API
              </Button>
            </Link>
            <Link href="/docs">
              <Button variant="ghost" className="w-full justify-start text-sm font-medium">
                <LucideIcons.FileText className="w-4 h-4 mr-2" />
                Docs
              </Button>
            </Link>
            <Button variant="ghost" className="w-full justify-start text-sm font-medium">
              <LucideIcons.LayoutDashboard className="w-4 h-4 mr-2" />
              Examples
            </Button>
            <Button variant="ghost" className="w-full justify-start text-sm font-medium">
              <LucideIcons.Users className="w-4 h-4 mr-2" />
              Community
            </Button>
          </div>
        </div>
      )}

      <main className="pt-20">
        {/* Hero Section with improved layout and animations */}
        <section className="py-12 sm:py-16 md:py-24 border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-xl"
              >
                <div className="flex items-center space-x-2 mb-6">
                  <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary font-medium">
                    <LucideIcons.Sparkles className="w-3 h-3 mr-1" />
                    New
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1 font-medium">
                    v2.1.0
                  </Badge>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 tracking-tight leading-tight">
                  Discover and analyze buildings with unmatched precision
                </h1>

                <p className="text-base sm:text-lg text-muted-foreground mb-8 leading-relaxed">
                  SabiRoad combines AI, geospatial data, and architectural expertise to identify buildings and provide
                  comprehensive information in seconds.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                    onClick={() => handleGetStarted()}
                  >
                    <LucideIcons.Search className="mr-2 h-5 w-5" />
                    Start Exploring
                  </Button>

                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    <LucideIcons.PlayCircle className="mr-2 h-5 w-5" />
                    Watch Demo
                  </Button>
                </div>

                <div className="mt-8 flex items-center text-sm text-muted-foreground">
                  <div className="flex -space-x-2 mr-3">
                    {[1, 2, 3, 4].map((i) => (
                      <Avatar key={i} className="h-6 w-6 border-2 border-background">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">U{i}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span>
                    Used by <span className="font-semibold text-foreground">2,583</span> architects and developers
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="relative order-first md:order-last"
              >
                <InteractiveMap />
              </motion.div>
            </div>

            {/* Activity & Stats with improved cards */}
            <div className="mt-16 border-t border-border pt-8">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card className="bg-card border-border overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      <span className="flex items-center">
                        <LucideIcons.Activity className="w-4 h-4 mr-2 text-primary" />
                        Recognition Activity
                      </span>
                      <Badge variant="outline" className="text-xs font-normal">
                        Last 30 days
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ActivityGraph />
                  </CardContent>
                </Card>

                <Card className="bg-card border-border overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <LucideIcons.Globe className="w-4 h-4 mr-2 text-primary" />
                      Global Coverage Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <div className="text-3xl font-bold text-primary">138</div>
                        <div className="text-xs text-muted-foreground">Countries</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">2.6M</div>
                        <div className="text-xs text-muted-foreground">Buildings</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">98.7%</div>
                        <div className="text-xs text-muted-foreground">Accuracy</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">875K</div>
                        <div className="text-xs text-muted-foreground">Daily Scans</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border overflow-hidden sm:col-span-2 lg:col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <LucideIcons.Bell className="w-4 h-4 mr-2 text-primary" />
                      Latest Updates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="border-b border-border py-3 px-6 flex items-center">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mr-3">
                        <LucideIcons.Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium">New 3D modeling feature released</p>
                        <p className="text-xs text-muted-foreground">2 days ago</p>
                      </div>
                    </div>
                    <div className="border-b border-border py-3 px-6 flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                        <LucideIcons.RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium">API v2.1 documentation updated</p>
                        <p className="text-xs text-muted-foreground">1 week ago</p>
                      </div>
                    </div>
                    <div className="py-3 px-6 flex items-center">
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mr-3">
                        <LucideIcons.Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium">SabiRoad wins Tech Innovation Award</p>
                        <p className="text-xs text-muted-foreground">2 weeks ago</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section with improved layout */}
        <section className="py-12 sm:py-16 md:py-24 border-b border-border bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <Badge className="mb-4 px-3 py-1" variant="outline">
                Features
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Powerful tools for building exploration</h2>
              <p className="text-lg text-muted-foreground">
                Our platform combines cutting-edge AI with comprehensive architectural data to deliver a seamless
                experience.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-16 items-center">
              <motion.div className="order-last md:order-first">
                <CodePreview />
              </motion.div>

              <div className="space-y-8">
                <Tabs
                  defaultValue={features[activeFeature].title.toLowerCase().replace(/\s+/g, "-")}
                  onValueChange={(value) => {
                    const index = features.findIndex((f) => f.title.toLowerCase().replace(/\s+/g, "-") === value)
                    if (index !== -1) setActiveFeature(index)
                  }}
                >
                  <TabsList className="grid grid-cols-2 sm:grid-cols-4 mb-8">
                    {features.map((feature) => (
                      <TabsTrigger
                        key={feature.title}
                        value={feature.title.toLowerCase().replace(/\s+/g, "-")}
                        className="text-xs"
                      >
                        {feature.title}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <AnimatePresence mode="wait">
                    {features.map((feature) => (
                      <TabsContent key={feature.title} value={feature.title.toLowerCase().replace(/\s+/g, "-")}>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          <div className="flex items-start gap-4 p-6 rounded-xl bg-card border border-border">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              {LucideIcons[feature.icon] &&
                                React.createElement(LucideIcons[feature.icon], {
                                  className: "w-6 h-6 text-primary",
                                })}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold">{feature.title}</h3>
                                <Badge variant="secondary" className="text-xs">
                                  {feature.badge}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground">{feature.desc}</p>
                            </div>
                          </div>
                        </motion.div>
                      </TabsContent>
                    ))}
                  </AnimatePresence>
                </Tabs>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section with improved cards */}
        <section className="py-12 sm:py-16 md:py-24 border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <Badge className="mb-4 px-3 py-1" variant="outline">
                Pricing
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Choose the plan that fits your needs</h2>
              <p className="text-lg text-muted-foreground">
                We offer flexible pricing plans to suit individual users, professionals, and enterprises.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <Card
                  key={plan.title}
                  className={`border-border relative overflow-hidden ${
                    plan.popular ? "border-primary shadow-lg shadow-primary/10" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 -mt-2 -mr-2">
                      <div className="bg-primary text-primary-foreground text-xs font-medium py-1 px-3 rounded-bl-lg rounded-tr-lg shadow-sm">
                        Popular
                      </div>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center mb-2">
                      <div
                        className={`w-10 h-10 rounded-lg ${plan.popular ? "bg-primary/10" : "bg-muted"} flex items-center justify-center mr-3`}
                      >
                        {LucideIcons[plan.icon] &&
                          React.createElement(LucideIcons[plan.icon], {
                            className: `w-5 h-5 ${plan.popular ? "text-primary" : "text-muted-foreground"}`,
                          })}
                      </div>
                      <CardTitle className="text-lg font-medium">{plan.title}</CardTitle>
                    </div>
                    <div className="text-3xl font-bold">
                      {plan.price}
                      <span className="text-sm font-normal text-muted-foreground ml-1">/{plan.period}</span>
                    </div>
                    <CardDescription>
                      {plan.title === "Free"
                        ? "Perfect for getting started"
                        : plan.title === "Pro"
                          ? "Ideal for professionals"
                          : "For organizations with advanced needs"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center">
                          <LucideIcons.Check className="w-4 h-4 text-emerald-500 mr-2 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant={plan.buttonVariant as "default" | "outline"}
                      className={`w-full sm:w-auto ${plan.popular ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`}
                      onClick={() => handleGetStarted(plan.title)}
                    >
                      {plan.buttonText}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section with improved cards */}
        <section className="py-12 sm:py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <Badge className="mb-4 px-3 py-1" variant="outline">
                Testimonials
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">What our users are saying</h2>
              <p className="text-lg text-muted-foreground">
                Hear from architects, urban planners, and real estate developers who use SabiRoad.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial, idx) => (
                <Card key={idx} className="bg-card border-border h-full">
                  <CardHeader className="pb-2 flex items-start space-x-4">
                    <Avatar className="h-10 w-10 border-2 border-primary/10">
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">{testimonial.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-sm font-medium">{testimonial.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {testimonial.role} at {testimonial.company}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="relative">
                      <LucideIcons.Quote className="absolute -top-1 -left-1 w-5 h-5 text-muted-foreground/20" />
                      <p className="text-sm text-muted-foreground pl-4">{testimonial.content}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - New addition */}
        <section className="py-12 sm:py-16 md:py-24 bg-primary/5 border-y border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-4 px-3 py-1 bg-primary/10 text-primary">Get Started Today</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to explore buildings like never before?</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of architects, urban planners, and developers who are already using SabiRoad to transform
                their work.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  onClick={() => handleGetStarted()}
                >
                  <LucideIcons.Rocket className="mr-2 h-5 w-5" />
                  Start Free Trial
                </Button>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <LucideIcons.CalendarClock className="mr-2 h-5 w-5" />
                  Schedule Demo
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-purple-600 rounded-lg flex items-center justify-center">
                  <LucideIcons.Building2 className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold">SabiRoad</span>
              </Link>
              <p className="text-sm text-muted-foreground mb-4">
                Revolutionizing how we discover and analyze buildings with AI and comprehensive data.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <LucideIcons.Twitter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <LucideIcons.Github className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <LucideIcons.Linkedin className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    API
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Release Notes
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Press
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    GDPR
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} SabiRoad. All rights reserved.
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <select className="text-sm bg-transparent border border-border rounded-md px-2 py-1">
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
              </select>
              <Badge variant="outline" className="text-xs">
                v2.1.0
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default SabiRoadModern

