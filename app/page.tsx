"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, useAnimation } from "framer-motion"
import * as LucideIcons from "lucide-react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// GitHub-style code preview component
const CodePreview = () => {
  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-950">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <LucideIcons.File className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">building-recognition.py</span>
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <LucideIcons.Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <LucideIcons.Code className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="p-4 bg-gray-50 dark:bg-gray-950 overflow-x-auto">
        <pre className="text-sm font-mono">
          <code className="language-python">
            <span className="text-purple-600 dark:text-purple-400">import</span>{" "}
            <span className="text-blue-600 dark:text-blue-400">tensorflow</span>{" "}
            <span className="text-purple-600 dark:text-purple-400">as</span>{" "}
            <span className="text-blue-600 dark:text-blue-400">tf</span>
            <br />
            <span className="text-purple-600 dark:text-purple-400">from</span>{" "}
            <span className="text-blue-600 dark:text-blue-400">tensorflow.keras.applications</span>{" "}
            <span className="text-purple-600 dark:text-purple-400">import</span>{" "}
            <span className="text-blue-600 dark:text-blue-400">ResNet50</span>
            <br />
            <br />
            <span className="text-green-600 dark:text-green-400"># Building recognition model</span>
            <br />
            <span className="text-purple-600 dark:text-purple-400">def</span>{" "}
            <span className="text-yellow-600 dark:text-yellow-400">recognize_building</span>(image):
            <br />
            {"    "}model = ResNet50(weights=<span className="text-orange-600 dark:text-orange-400">'imagenet'</span>)
            <br />
            {"    "}preprocessed = preprocess_image(image)
            <br />
            {"    "}predictions = model.predict(preprocessed)
            <br />
            {"    "}
            <span className="text-purple-600 dark:text-purple-400">return</span> analyze_results(predictions)
          </code>
        </pre>
      </div>
      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <LucideIcons.Star className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-1" />
            <span className="text-xs text-gray-600 dark:text-gray-400">234</span>
          </div>
          <div className="flex items-center">
            <LucideIcons.GitFork className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-1" />
            <span className="text-xs text-gray-600 dark:text-gray-400">45</span>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">Python</Badge>
      </div>
    </div>
  )
}

// GitHub-style activity graph
const ActivityGraph = () => {
  const days = 30
  const data = Array.from({ length: days }, () => Math.floor(Math.random() * 5))

  return (
    <div className="flex items-end h-24 gap-1">
      {data.map((value, index) => {
        const height = value === 0 ? 'h-2' : `h-${value * 4}`
        const intensity = value === 0 ? 100 : 100 - value * 15
        const color = `bg-green-${intensity} dark:bg-green-${intensity + 200}`
        
        return (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`w-2 ${height} rounded-sm ${value === 0 ? 'bg-gray-200 dark:bg-gray-700' : color} hover:opacity-80`}></div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{value} activities on day {days - index}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      })}
    </div>
  )
}

const InteractiveMap = () => {
  return (
    <div className="w-full h-[400px] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm relative">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700"></div>
      
      {/* Map Grid */}
      <div className="absolute inset-0 grid grid-cols-12 grid-rows-12">
        {Array.from({ length: 144 }).map((_, i) => (
          <div key={i} className="border-[0.5px] border-gray-300/30 dark:border-gray-600/30"></div>
        ))}
      </div>
      
      {/* Buildings and landmarks */}
      <div className="absolute top-1/4 left-1/4 w-12 h-16 bg-blue-500/80 dark:bg-blue-600/80 rounded-sm"></div>
      <div className="absolute top-1/3 left-1/2 w-10 h-14 bg-purple-500/80 dark:bg-purple-600/80 rounded-sm"></div>
      <div className="absolute top-1/2 left-1/3 w-16 h-20 bg-gray-500/80 dark:bg-gray-600/80 rounded-sm"></div>
      
      {/* Map Controls */}
      <div className="absolute top-4 left-4 right-4 bg-white dark:bg-gray-900 rounded-md shadow-md p-2">
        <div className="flex items-center">
          <LucideIcons.Search className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
          <Input 
            placeholder="Search buildings..." 
            className="h-8 text-sm border-none focus-visible:ring-0 bg-transparent"
          />
          <Button variant="ghost" size="sm" className="ml-2 h-8 w-8 p-0">
            <LucideIcons.Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
        <Button variant="outline" size="icon" className="bg-white dark:bg-gray-900 h-8 w-8">
          <LucideIcons.Plus className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" className="bg-white dark:bg-gray-900 h-8 w-8">
          <LucideIcons.Minus className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" className="bg-white dark:bg-gray-900 h-8 w-8">
          <LucideIcons.Layers className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Building Info Popup */}
      <div className="absolute bottom-20 left-1/4 bg-white dark:bg-gray-900 rounded-md shadow-md p-3 w-64 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-sm">Central Tower</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Modern Office Building</p>
          </div>
          <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Verified</Badge>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Built:</span>
            <span>2018</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-gray-500 dark:text-gray-400">Height:</span>
            <span>185m</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-gray-500 dark:text-gray-400">Architect:</span>
            <span>Foster & Partners</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const features = [
  {
    icon: "Zap",
    title: "Instant Recognition",
    desc: "Identify buildings in real-time with high accuracy.",
    badge: "Fast"
  },
  {
    icon: "Database",
    title: "Rich Information",
    desc: "Access detailed architectural and historical data.",
    badge: "Comprehensive"
  },
  {
    icon: "Globe",
    title: "Global Coverage",
    desc: "Supports buildings worldwide with local context.",
    badge: "International"
  },
  {
    icon: "Layers",
    title: "3D Modeling",
    desc: "Generate 3D models from 2D images.",
    badge: "Advanced"
  },
]

const plans = [
  {
    icon: "Home",
    title: "Free",
    price: "$0",
    period: "forever",
    features: [
      "Building Recognition", 
      "Basic Information", 
      "5 Scans/Day",
      "Community Support"
    ],
    popular: false,
    buttonText: "Get Started"
  },
  {
    icon: "Building",
    title: "Pro",
    price: "$29",
    period: "per month",
    features: [
      "Advanced Analytics", 
      "Historical Data", 
      "Unlimited Scans",
      "API Access (100 req/day)",
      "Priority Support"
    ],
    popular: true,
    buttonText: "Try Pro"
  },
  {
    icon: "City",
    title: "Enterprise",
    price: "Custom",
    period: "per organization",
    features: [
      "Dedicated Instance", 
      "Custom Integration", 
      "Unlimited Everything",
      "Full API Access",
      "24/7 Support",
      "SLA Guarantee"
    ],
    popular: false,
    buttonText: "Contact Sales"
  },
]

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Architect",
    company: "DesignWorks Studio",
    avatar: "/placeholder.svg?height=40&width=40",
    content:
      "SabiRoad has revolutionized how we approach urban design projects. The instant building recognition and detailed information have become indispensable in our workflow.",
  },
  {
    name: "Michael Chen",
    role: "Urban Planner",
    company: "CityScape Solutions",
    avatar: "/placeholder.svg?height=40&width=40",
    content:
      "As an urban planner, SabiRoad has been a game-changer. It's like having a comprehensive city database right in my pocket. Absolutely essential for modern city planning.",
  },
  {
    name: "Emily Rodriguez",
    role: "Real Estate Developer",
    company: "Horizon Properties",
    avatar: "/placeholder.svg?height=40&width=40",
    content:
      "SabiRoad's detailed building information and 3D modeling capabilities have significantly streamlined our property assessment process. It's an invaluable tool for our industry.",
  },
]

const SabiRoadGitHubStyle = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [activeTab, setActiveTab] = useState("features")
  const router = useRouter()
  const { data: session, status } = useSession()

  const testimonialControls = useAnimation()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 ${isDarkMode ? "dark" : ""}`}>
      {/* NavBar - GitHub Style */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className={`fixed w-full z-50 transition-all duration-300 ${
          isScrolled ? "bg-white/90 dark:bg-gray-950/90 backdrop-blur-lg shadow-sm" : "bg-white dark:bg-gray-950"
        } border-b border-gray-200 dark:border-gray-800`}
      >
        <div className="container mx-auto">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-md flex items-center justify-center">
                  <LucideIcons.Building className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-semibold text-gray-900 dark:text-white">SabiRoad</span>
              </Link>
              
              <div className="hidden md:flex items-center space-x-1">
                <Link href="/api-doc">
                  <Button variant="ghost" className="text-sm font-medium">
                    <LucideIcons.Code className="w-4 h-4 mr-2" />
                    API
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button variant="ghost" className="text-sm font-medium">
                    <LucideIcons.Code className="w-4 h-4 mr-2" />
                    docs
                  </Button>
                </Link>
                <Button variant="ghost" className="text-sm font-medium">
                  <LucideIcons.PieChart className="w-4 h-4 mr-2" />
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
                  <LucideIcons.Search className="w-4 h-4 text-gray-400" />
                </div>
                <Input
                  type="search"
                  placeholder="Search..." 
                  className="pl-10 h-9 w-64 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm"
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <Switch checked={isDarkMode} onCheckedChange={toggleTheme} />
                
                {status === "authenticated" ? (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                    <AvatarFallback>{session?.user?.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
                      Sign in
                    </Button>
                    <Button variant="default" size="sm" onClick={() => router.push("/signup")}
                      className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                    >
                      Sign up
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="pt-20">
        {/* Hero Section - GitHub Style */}
        <section className="py-16 md:py-24 border-b border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.2 }}
                className="max-w-xl"
              >
                <div className="flex items-center space-x-2 mb-6">
                  <Badge className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-medium">
                    <LucideIcons.Rocket className="w-3 h-3 mr-1" />
                    New
                  </Badge>
                  <Badge className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 font-medium">
                    v2.1.0
                  </Badge>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                  Discover and analyze buildings with unmatched precision
                </h1>

                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                  SabiRoad combines AI, geospatial data, and architectural expertise to identify buildings and provide comprehensive information in seconds.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    onClick={() => handleGetStarted()}
                  >
                    <LucideIcons.Search className="mr-2 h-5 w-5" />
                    Start Exploring
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="w-full sm:w-auto border-gray-300 dark:border-gray-700"
                  >
                    <LucideIcons.PlayCircle className="mr-2 h-5 w-5" />
                    Watch Demo
                  </Button>
                </div>

                <div className="mt-8 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex -space-x-2 mr-3">
                    {[1, 2, 3, 4].map((i) => (
                      <Avatar key={i} className="h-6 w-6 border-2 border-white dark:border-gray-900">
                        <AvatarFallback className="text-xs">U{i}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span>Used by <span className="font-semibold text-gray-900 dark:text-gray-100">2,583</span> architects and developers</span>
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

            {/* Activity & Stats */}
            <div className="mt-16 border-t border-gray-200 dark:border-gray-800 pt-8">
              <div className="grid md:grid-cols-3 gap-8">
                <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      <span>Recognition Activity</span>
                      <Badge variant="outline" className="text-xs font-normal">Last 30 days</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ActivityGraph />
                  </CardContent>
                </Card>
                
                <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Global Coverage Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">138</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Countries</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">2.6M</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Buildings</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">98.7%</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Accuracy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">875K</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Daily Scans</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Latest Updates</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="border-b border-gray-100 dark:border-gray-800 py-3 px-6 flex items-center">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3">
                        <LucideIcons.Plus className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium">New 3D modeling feature released</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">2 days ago</p>
                      </div>
                    </div>
                    <div className="border-b border-gray-100 dark:border-gray-800 py-3 px-6 flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                        <LucideIcons.RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium">API v2.1 documentation updated</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">1 week ago</p>
                      </div>
                    </div>
                    <div className="py-3 px-6 flex items-center">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center mr-3">
                        <LucideIcons.Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium">SabiRoad wins Tech Innovation Award</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">2 weeks ago</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <Badge className="mb-4 px-3 py-1">Features</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Powerful tools for building exploration</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Our platform combines cutting-edge AI with comprehensive architectural data to deliver a seamless experience.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-16 items-center">
              <motion.div className="order-last md:order-first">
                <CodePreview />
              </motion.div>

              <div className="space-y-8">
                <Tabs defaultValue={features[activeFeature].title.toLowerCase().replace(/\s+/g, '-')} onValueChange={(value) => {
                  const index = features.findIndex(f => f.title.toLowerCase().replace(/\s+/g, '-') === value);
                  if (index !== -1) setActiveFeature(index);
                }}>
                  <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-8">
                    {features.map((feature) => (
                      <TabsTrigger 
                        key={feature.title} 
                        value={feature.title.toLowerCase().replace(/\s+/g, '-')}
                        className="text-xs"
                      >
                        {feature.title}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {features.map((feature) => (
                    <TabsContent 
                      key={feature.title} 
                      value={feature.title.toLowerCase().replace(/\s+/g, '-')}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          {LucideIcons[feature.icon] &&
                            React.createElement(LucideIcons[feature.icon], {
                              className: "w-6 h-6 text-blue-600 dark:text-blue-400",
                            })}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{feature.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
                        </div>
                        <Badge className="text-xs">{feature.badge}</Badge>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 md:py-24 border-b border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <Badge className="mb-4 px-3 py-1">Pricing</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Choose the plan that fits your needs</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                We offer flexible pricing plans to suit individual users, professionals, and enterprises.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-16">
              {plans.map((plan) => (
                <Card key={plan.title} className={`border-gray-200 dark:border-gray-800 ${plan.popular ? "border-2 border-blue-600 dark:border-blue-400" : ""}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {LucideIcons[plan.icon] &&
                          React.createElement(LucideIcons[plan.icon], {
                            className: "w-8 h-8 text-blue-600 dark:text-blue-400",
                          })}
                        <CardTitle className="text-lg font-medium ml-3">{plan.title}</CardTitle>
                      </div>
                      {plan.popular && (
                        <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Popular</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="mt-2">
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {plan.price}
                      <span className="text-sm font-normal text-gray-600 dark:text-gray-400">/{plan.period}</span>
                    </div>
                    <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center">
                          <LucideIcons.Check className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="mt-6">
                    <Button 
                      variant={plan.popular ? "default" : "outline"} 
                      className="w-full" 
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

        {/* Testimonials Section */}
        <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-950">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <Badge className="mb-4 px-3 py-1">Testimonials</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">What our users are saying</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Hear from architects, urban planners, and real estate developers who use SabiRoad.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-16">
              {testimonials.map((testimonial, idx) => (
                <Card key={idx} className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <CardHeader className="pb-2 flex items-center">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                      <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <CardTitle className="text-sm font-medium">{testimonial.name}</CardTitle>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {testimonial.role} at {testimonial.company}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    {testimonial.content}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 text-center">
          <Link href="/" className="text-xl font-semibold text-gray-900 dark:text-white">SabiRoad</Link>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            &copy; {new Date().getFullYear()} SabiRoad. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default SabiRoadGitHubStyle