"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import * as LucideIcons from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

// Placeholder Image Helper
const PlaceholderImage = ({ width, height, text, className = "" }) => {
  // Generate a random pastel color
  const hue = Math.floor(Math.random() * 360)
  const backgroundColor = `hsl(${hue}, 70%, 80%)`
  const textColor = `hsl(${hue}, 70%, 30%)`

  return (
    <div
      className={`flex items-center justify-center overflow-hidden ${className}`}
      style={{
        width: "100%",
        height: "100%",
        backgroundColor,
        color: textColor,
        fontSize: Math.min(width, height) * 0.1,
        fontWeight: "bold",
      }}
    >
      {text || `${width}×${height}`}
    </div>
  )
}

// Example categories
const categories = [
  { id: "travel", label: "Travel", icon: "Compass" },
  { id: "real-estate", label: "Real Estate", icon: "Building" },
  { id: "education", label: "Education", icon: "GraduationCap" },
  { id: "business", label: "Business", icon: "Briefcase" },
  { id: "all", label: "All Examples", icon: "LayoutGrid" },
]

// Example data
const examples = [
  {
    id: 1,
    title: "Landmark Identification",
    description: "Instantly identify famous landmarks and get historical information.",
    image: "Landmark Identification",
    category: "travel",
    tags: ["Tourism", "History", "Architecture"],
    difficulty: "Beginner",
  },
  {
    id: 2,
    title: "Neighborhood Analysis",
    description: "Analyze neighborhoods for real estate evaluation and market research.",
    image: "Neighborhood Analysis",
    category: "real-estate",
    tags: ["Property", "Market Analysis", "Demographics"],
    difficulty: "Intermediate",
  },
  {
    id: 3,
    title: "Educational Field Trips",
    description: "Create virtual field trips to historical and cultural sites.",
    image: "Educational Field Trips",
    category: "education",
    tags: ["Virtual Learning", "History", "Geography"],
    difficulty: "Beginner",
  },
  {
    id: 4,
    title: "Business Location Intelligence",
    description: "Analyze foot traffic and competitor proximity for business locations.",
    image: "Business Location",
    category: "business",
    tags: ["Market Research", "Competitive Analysis", "Site Selection"],
    difficulty: "Advanced",
  },
  {
    id: 5,
    title: "Travel Itinerary Planning",
    description: "Plan efficient travel routes between multiple landmarks.",
    image: "Travel Itinerary",
    category: "travel",
    tags: ["Trip Planning", "Optimization", "Tourism"],
    difficulty: "Intermediate",
  },
  {
    id: 6,
    title: "Property Valuation",
    description: "Estimate property values based on location and nearby amenities.",
    image: "Property Valuation",
    category: "real-estate",
    tags: ["Appraisal", "Market Value", "Investment"],
    difficulty: "Advanced",
  },
  {
    id: 7,
    title: "Geographical Learning",
    description: "Interactive learning about world geography and cultural landmarks.",
    image: "Geography Learning",
    category: "education",
    tags: ["Geography", "Cultural Studies", "Interactive Learning"],
    difficulty: "Beginner",
  },
  {
    id: 8,
    title: "Retail Site Selection",
    description: "Analyze optimal locations for new retail stores or franchises.",
    image: "Retail Site",
    category: "business",
    tags: ["Expansion", "Market Analysis", "ROI Prediction"],
    difficulty: "Advanced",
  },
]

// Featured example component
const FeaturedExample = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showResult, setShowResult] = useState(false)

  const handleTryDemo = () => {
    setIsProcessing(true)
    setProgress(0)
    setShowResult(false)

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsProcessing(false)
          setShowResult(true)
          return 100
        }
        return prev + 5
      })
    }, 150)
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-lg">
      <div className="grid md:grid-cols-2">
        <div className="p-6 md:p-8">
          <Badge variant="outline" className="mb-4">
            Featured Example
          </Badge>
          <h2 className="text-2xl font-bold mb-2">Historic Landmark Recognition</h2>
          <p className="text-muted-foreground mb-6">
            Upload a photo of any historic landmark and get instant information about its history, architecture, and
            cultural significance.
          </p>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <LucideIcons.Upload className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Upload a photo</h3>
                <p className="text-xs text-muted-foreground">Use your own photo or choose from our samples</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <LucideIcons.Scan className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-medium">AI processes the image</h3>
                <p className="text-xs text-muted-foreground">Our AI identifies the landmark with 99.2% accuracy</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <LucideIcons.FileText className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Get detailed information</h3>
                <p className="text-xs text-muted-foreground">History, architecture, visitor information, and more</p>
              </div>
            </div>
          </div>

          <Button onClick={handleTryDemo} className="mt-6">
            Try Demo
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/30 z-10"></div>
          <div className="h-full min-h-[300px] relative">
            {!isProcessing && !showResult && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <LucideIcons.Camera className="w-16 h-16 text-primary/70 mb-4" />
                <p className="text-center text-sm font-medium">Click "Try Demo" to see it in action</p>
              </div>
            )}

            {isProcessing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-20">
                <LucideIcons.Scan className="w-16 h-16 text-primary animate-pulse mb-4" />
                <div className="text-sm font-medium mb-2">Analyzing landmark...</div>
                <Progress value={progress} className="w-48 h-2 mb-2" />
                <p className="text-xs text-muted-foreground">{progress}% complete</p>
              </div>
            )}

            {showResult && (
              <div className="absolute inset-0 flex flex-col p-6 bg-background/90 backdrop-blur-sm z-20 overflow-auto">
                <div className="flex items-center mb-4">
                  <LucideIcons.CheckCircle className="w-5 h-5 text-emerald-500 mr-2" />
                  <h3 className="font-bold">Eiffel Tower Identified</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium">Location:</span> Paris, France
                  </div>
                  <div>
                    <span className="font-medium">Built:</span> 1887-1889
                  </div>
                  <div>
                    <span className="font-medium">Height:</span> 330 meters (1,083 ft)
                  </div>
                  <div>
                    <span className="font-medium">Architect:</span> Gustave Eiffel
                  </div>
                  <div>
                    <span className="font-medium">Style:</span> Structural expressionism
                  </div>
                  <div>
                    <span className="font-medium">Description:</span> The Eiffel Tower is a wrought-iron lattice tower
                    on the Champ de Mars in Paris. It is named after the engineer Gustave Eiffel, whose company designed
                    and built the tower for the 1889 World's Fair.
                  </div>
                </div>
                <div className="mt-4 flex space-x-2">
                  <Button variant="outline" size="sm">
                    <LucideIcons.Map className="w-4 h-4 mr-2" />
                    View on Map
                  </Button>
                  <Button variant="outline" size="sm">
                    <LucideIcons.Info className="w-4 h-4 mr-2" />
                    More Details
                  </Button>
                </div>
              </div>
            )}

            <PlaceholderImage width={400} height={400} text="Eiffel Tower" className="w-full h-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Example card component
const ExampleCard = ({ example }) => {
  return (
    <Card className="overflow-hidden h-full flex flex-col transition-all hover:shadow-md">
      <div className="relative h-48">
        <PlaceholderImage width={200} height={200} text={example.image} className="w-full h-full" />
        <div className="absolute top-2 right-2">
          <Badge
            variant="secondary"
            className={`${
              example.difficulty === "Beginner"
                ? "bg-emerald-500/10 text-emerald-500"
                : example.difficulty === "Intermediate"
                  ? "bg-amber-500/10 text-amber-500"
                  : "bg-rose-500/10 text-rose-500"
            }`}
          >
            {example.difficulty}
          </Badge>
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{example.title}</CardTitle>
        <CardDescription>{example.description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 flex-grow">
        <div className="flex flex-wrap gap-1 mt-2">
          {example.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <LucideIcons.Eye className="w-4 h-4 mr-2" />
              View Example
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogTitle>{example.title}</DialogTitle>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{example.description}</p>
              </div>
              <div className="relative h-[300px] rounded-md overflow-hidden">
                <PlaceholderImage width={600} height={300} text={example.image} className="w-full h-full" />
              </div>
              <div>
                <h4 className="font-medium mb-2">How it works</h4>
                <p className="text-sm text-muted-foreground">
                  This example demonstrates how SabiRoad's location recognition technology can be used for{" "}
                  {example.category === "travel"
                    ? "travel and tourism applications"
                    : example.category === "real-estate"
                      ? "real estate analysis and valuation"
                      : example.category === "education"
                        ? "educational purposes and learning"
                        : "business intelligence and market research"}
                  . The AI processes visual data to provide accurate location information and contextual details.
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline">
                  <LucideIcons.Code className="w-4 h-4 mr-2" />
                  View Code
                </Button>
                <Button>Try it yourself</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}

// Main Examples Page Component
const ExamplesPage = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [isScrolled, setIsScrolled] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()

  // Filter examples based on search query and active category
  const filteredExamples = examples.filter((example) => {
    const matchesSearch =
      example.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      example.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      example.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = activeCategory === "all" || example.category === activeCategory

    return matchesSearch && matchesCategory
  })

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

  // Toggle theme
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <div className={`min-h-screen bg-background text-foreground ${isDarkMode ? "dark" : ""}`}>
      {/* Header */}
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
                  <LucideIcons.MapPin className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold">SabiRoad</span>
              </Link>

              <div className="hidden md:flex items-center space-x-1">
                <Link href="/examples">
                  <Button variant="ghost" className="text-sm font-medium">
                    <LucideIcons.LayoutDashboard className="w-4 h-4 mr-2" />
                    Examples
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:block relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <LucideIcons.Search className="w-4 h-4 text-muted-foreground" />
                </div>
                <Input type="search" placeholder="Search locations..." className="pl-10 h-9 w-64 bg-muted/50 text-sm" />
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
            <Link href="/examples">
              <Button variant="ghost" className="w-full justify-start text-sm font-medium">
                <LucideIcons.LayoutDashboard className="w-4 h-4 mr-2" />
                Examples
              </Button>
            </Link>
          </div>
        </div>
      )}

      <main className="pt-20">
        <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-3xl font-bold sm:text-4xl mb-4">SabiRoad Examples</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Explore real-world applications and use cases for our location recognition technology
            </p>

            <div className="relative max-w-md mx-auto">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <LucideIcons.Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                type="search"
                placeholder="Search examples..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Featured Example */}
          <div className="mb-16">
            <FeaturedExample />
          </div>

          {/* Category Tabs */}
          <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
            <TabsList className="grid grid-cols-2 sm:grid-cols-5 mb-8">
              {categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id} className="text-xs sm:text-sm">
                  {LucideIcons[category.icon] &&
                    React.createElement(LucideIcons[category.icon], {
                      className: "w-4 h-4 mr-2",
                    })}
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((category) => (
              <TabsContent key={category.id} value={category.id}>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredExamples.map((example) => (
                    <ExampleCard key={example.id} example={example} />
                  ))}
                </div>

                {filteredExamples.length === 0 && (
                  <div className="text-center py-12">
                    <LucideIcons.SearchX className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No examples found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search or filter to find what you're looking for
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>

          {/* Community Showcase */}
          <div className="mt-20">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold sm:text-3xl mb-4">Community Showcase</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Projects built by our community using SabiRoad technology
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="overflow-hidden">
                <div className="relative h-48">
                  <PlaceholderImage width={400} height={200} text="Travel Journal App" className="w-full h-full" />
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Travel Journal App</CardTitle>
                    <Badge>Community</Badge>
                  </div>
                  <CardDescription>
                    An app that automatically identifies and logs locations visited during trips
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                      <PlaceholderImage width={32} height={32} text="SJ" className="w-full h-full" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Sarah Johnson</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    "I built this app to automatically document my travels. SabiRoad's API made it easy to identify
                    landmarks and create a beautiful travel journal."
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    View Project
                  </Button>
                </CardFooter>
              </Card>

              <Card className="overflow-hidden">
                <div className="relative h-48">
                  <PlaceholderImage width={400} height={200} text="Real Estate Analyzer" className="w-full h-full" />
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Real Estate Analyzer</CardTitle>
                    <Badge>Community</Badge>
                  </div>
                  <CardDescription>A tool for real estate professionals to analyze property locations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                      <PlaceholderImage width={32} height={32} text="MC" className="w-full h-full" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Michael Chen</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    "SabiRoad's location intelligence has transformed how we analyze properties. Our tool now provides
                    instant insights about neighborhoods and property values."
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    View Project
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-20 bg-primary/5 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to build your own example?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              Get started with our comprehensive documentation and developer resources
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button>
                <LucideIcons.Code className="w-4 h-4 mr-2" />
                Start Building
              </Button>
              <Button variant="outline">
                <LucideIcons.BookOpen className="w-4 h-4 mr-2" />
                Read Documentation
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-purple-600 rounded-lg flex items-center justify-center">
                  <LucideIcons.MapPin className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold">SabiRoad</span>
              </Link>
              <p className="text-sm text-muted-foreground mb-4">
                Revolutionizing how we discover and explore locations with AI vision and comprehensive data.
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

export default ExamplesPage

