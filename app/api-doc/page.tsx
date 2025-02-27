"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Building2,
  Code2,
  FileText,
  LayoutDashboard,
  Users,
  Search,
  Moon,
  Sun,
  Key,
  BookOpen,
  Zap,
  Shield,
  Rocket,
  Lightbulb,
  FileCheck,
  Code,
  Package,
  ExternalLink,
  HelpCircle,
  MessageSquare,
  Twitter,
  Github,
  Linkedin,
  FileCode,
  Copy,
  Download,
  Check,
  Database,
  FileJson,
  FileCode2,
  FileCodeIcon,
  MapIcon,
  CuboidIcon as Cube,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"

// TypeScript interfaces
interface CodeSnippetProps {
  language: string
  title: string
  code: string
}

interface ApiEndpointParameter {
  name: string
  type: string
  required: boolean
  description: string
}

interface ApiEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE"
  path: string
  description: string
  parameters: ApiEndpointParameter[]
  responseExample?: string
}

// Update the PricingPlan interface
interface PricingPlan {
  name: string
  icon: React.ElementType // Change this to React.ElementType
  price: string
  period: string
  requests: string
  recognition: string
  features: string[]
  popular: boolean
  buttonText: string
  buttonVariant: "default" | "outline"
}

// Define LucideIcons type
const LucideIcons: { [key: string]: React.ElementType } = {
  Building2,
  Code2,
  FileText,
  LayoutDashboard,
  Users,
  Search,
  Moon,
  Sun,
  Key,
  BookOpen,
  Zap,
  Shield,
  Rocket,
  Lightbulb,
  FileCheck,
  Code,
  Package,
  ExternalLink,
  HelpCircle,
  MessageSquare,
  Twitter,
  Github,
  Linkedin,
  FileCode: FileCodeIcon,
  Copy,
  Download,
  Check,
  Database,
  FileJson,
  FileCode2,
  Map: MapIcon,
  Cube,
}

// Modern code snippet component with syntax highlighting
const CodeSnippet: React.FC<CodeSnippetProps> = ({ language, title, code }) => {
  return (
    <div className="rounded-xl overflow-hidden border border-border shadow-md bg-card mb-6">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50">
        <div className="flex items-center">
          <div className="flex space-x-2 mr-3">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="flex items-center">
            <LucideIcons.FileCode className="w-4 h-4 mr-2 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{title}</span>
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
          <code className={`language-${language}`}>{code}</code>
        </pre>
      </ScrollArea>
    </div>
  )
}

const apiExamples: Record<string, string> = {
  python: `import requests

# Initialize with your API key
api_key = "your_api_key_here"
headers = {"Authorization": f"Bearer {api_key}"}

# Recognize building from image URL
def recognize_building(image_url):
    endpoint = "https://api.sabiroad.com/v2/recognize"
    payload = {"image_url": image_url}
    
    response = requests.post(endpoint, json=payload, headers=headers)
    return response.json()

# Get detailed information about a building
def get_building_details(building_id):
    endpoint = f"https://api.sabiroad.com/v2/buildings/{building_id}"
    
    response = requests.get(endpoint, headers=headers)
    return response.json()

# Example usage
result = recognize_building("https://example.com/building-image.jpg")
print(f"Recognized: {result['name']} ({result['confidence']}% confidence)")

# Get more details
if result.get('building_id'):
    details = get_building_details(result['building_id'])
    print(f"Built in {details['year']}, designed by {details['architect']}")`,

  javascript: `// Initialize with your API key
const apiKey = 'your_api_key_here';
const headers = {
  'Authorization': \`Bearer \${apiKey}\`,
  'Content-Type': 'application/json'
};

// Recognize building from image URL
async function recognizeBuilding(imageUrl) {
  const endpoint = 'https://api.sabiroad.com/v2/recognize';
  const payload = { image_url: imageUrl };
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  
  return response.json();
}

// Get detailed information about a building
async function getBuildingDetails(buildingId) {
  const endpoint = \`https://api.sabiroad.com/v2/buildings/\${buildingId}\`;
  
  const response = await fetch(endpoint, {
    method: 'GET',
    headers
  });
  
  return response.json();
}

// Example usage
recognizeBuilding('https://example.com/building-image.jpg')
  .then(result => {
    console.log(\`Recognized: \${result.name} (\${result.confidence}% confidence)\`);
    
    // Get more details
    if (result.building_id) {
      return getBuildingDetails(result.building_id);
    }
  })
  .then(details => {
    console.log(\`Built in \${details.year}, designed by \${details.architect}\`);
  })
  .catch(error => {
    console.error('Error:', error);
  });`,

  curl: `# Recognize building from image URL
curl -X POST https://api.sabiroad.com/v2/recognize \\
  -H "Authorization: Bearer your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "image_url": "https://example.com/building-image.jpg"
  }'

# Get detailed information about a building
curl -X GET https://api.sabiroad.com/v2/buildings/building123 \\
  -H "Authorization: Bearer your_api_key_here"`,

  response: `{
  "success": true,
  "building": {
    "id": "bldg_1234567890",
    "name": "Empire State Building",
    "address": "350 Fifth Avenue, New York, NY 10118",
    "year_built": 1931,
    "architect": "Shreve, Lamb & Harmon",
    "style": "Art Deco",
    "height": {
      "meters": 381,
      "feet": 1250
    },
    "floors": 102,
    "coordinates": {
      "latitude": 40.748817,
      "longitude": -73.985428
    },
    "recognition_confidence": 98.7,
    "image_url": "https://sabiroad.com/images/bldg_1234567890.jpg",
    "historical_significance": "The Empire State Building was the world's tallest building for nearly 40 years..."
  }
}`,
}

const endpoints: ApiEndpoint[] = [
  {
    method: "POST",
    path: "/v2/recognize",
    description: "Recognize buildings from images",
    parameters: [
      { name: "image_url", type: "string", required: true, description: "URL of the image to analyze" },
      {
        name: "options.include_history",
        type: "boolean",
        required: false,
        description: "Include historical information",
      },
      {
        name: "options.generate_3d",
        type: "boolean",
        required: false,
        description: "Generate 3D model (Pro plan only)",
      },
    ],
    responseExample: `{
  "success": true,
  "building": {
    "id": "bldg_1234567890",
    "name": "Empire State Building",
    "recognition_confidence": 98.7,
    "coordinates": {
      "latitude": 40.748817,
      "longitude": -73.985428
    }
  }
}`,
  },
  {
    method: "GET",
    path: "/v2/buildings/{id}",
    description: "Get detailed building information",
    parameters: [
      { name: "id", type: "string", required: true, description: "Building ID" },
      { name: "fields", type: "string[]", required: false, description: "Specific fields to return" },
    ],
    responseExample: `{
  "success": true,
  "building": {
    "id": "bldg_1234567890",
    "name": "Empire State Building",
    "address": "350 Fifth Avenue, New York, NY 10118",
    "year_built": 1931,
    "architect": "Shreve, Lamb & Harmon",
    "style": "Art Deco",
    "height": {
      "meters": 381,
      "feet": 1250
    },
    "floors": 102
  }
}`,
  },
  {
    method: "GET",
    path: "/v2/buildings/nearby",
    description: "Find buildings near a location",
    parameters: [
      { name: "lat", type: "number", required: true, description: "Latitude" },
      { name: "lng", type: "number", required: true, description: "Longitude" },
      { name: "radius", type: "number", required: false, description: "Search radius in meters (default: 500)" },
      { name: "limit", type: "number", required: false, description: "Maximum results to return (default: 20)" },
    ],
    responseExample: `{
  "success": true,
  "buildings": [
    {
      "id": "bldg_1234567890",
      "name": "Empire State Building",
      "distance": 120.5,
      "coordinates": {
        "latitude": 40.748817,
        "longitude": -73.985428
      }
    },
    {
      "id": "bldg_0987654321",
      "name": "Chrysler Building",
      "distance": 350.2,
      "coordinates": {
        "latitude": 40.751652,
        "longitude": -73.975311
      }
    }
  ],
  "count": 2
}`,
  },
  {
    method: "POST",
    path: "/v2/buildings/search",
    description: "Search buildings by name or attributes",
    parameters: [
      { name: "query", type: "string", required: true, description: "Search query" },
      { name: "filters.year", type: "number", required: false, description: "Filter by year built" },
      { name: "filters.architect", type: "string", required: false, description: "Filter by architect" },
      { name: "filters.style", type: "string", required: false, description: "Filter by architectural style" },
    ],
    responseExample: `{
  "success": true,
  "buildings": [
    {
      "id": "bldg_1234567890",
      "name": "Empire State Building",
      "year_built": 1931,
      "architect": "Shreve, Lamb & Harmon",
      "style": "Art Deco"
    },
    {
      "id": "bldg_2468013579",
      "name": "Empire State Plaza",
      "year_built": 1976,
      "architect": "Wallace Harrison",
      "style": "Modernist"
    }
  ],
  "count": 2,
  "total": 2
}`,
  },
]

// Update the pricingPlans array
const pricingPlans: PricingPlan[] = [
  {
    name: "Free",
    icon: Building2, // Use the imported icon directly
    price: "$0",
    period: "forever",
    requests: "1,000 / month",
    recognition: "Basic",
    features: ["Building Recognition", "Basic Information", "10 Scans/Day", "Community Support", "Mobile App Access"],
    popular: false,
    buttonText: "Get Started",
    buttonVariant: "outline",
  },
  {
    name: "Pro",
    icon: Building2,
    price: "$29",
    period: "per month",
    requests: "50,000 / month",
    recognition: "Advanced",
    features: [
      "3D Modeling",
      "Historical Data",
      "Batch Processing",
      "API Access (500 req/day)",
      "Priority Support",
      "Offline Mode",
    ],
    popular: true,
    buttonText: "Try Pro",
    buttonVariant: "default",
  },
  {
    name: "Enterprise",
    icon: Building2,
    price: "Custom",
    period: "per organization",
    requests: "Unlimited",
    recognition: "Premium",
    features: [
      "Custom Integration",
      "Dedicated Support",
      "SLA Guarantee",
      "On-premises Option",
      "Custom Model Training",
      "Advanced Analytics",
      "White-label Option",
    ],
    popular: false,
    buttonText: "Contact Sales",
    buttonVariant: "outline",
  },
]

type TabValue = "overview" | "endpoints" | "examples" | "pricing" | "sdks"
type LanguageTabValue = "javascript" | "python" | "curl" | "response"

const SabiRoadAPIPage: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeTab, setActiveTab] = useState<TabValue>("overview")
  const [languageTab, setLanguageTab] = useState<LanguageTabValue>("javascript")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()

  // ... (rest of the component implementation)

  // Handle scroll effect for navbar
  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Handle dark mode toggle
  React.useEffect(() => {
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
      {/* Modern Navbar with glass morphism effect */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className={`fixed w-full z-50 transition-all duration-300 ${
          isScrolled ? "bg-background/80 backdrop-blur-lg shadow-sm" : "bg-background"
        } border-b border-border`}
      >
        <div className="container mx-auto">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-purple-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold">SabiRoad</span>
              </Link>

              <div className="hidden md:flex items-center space-x-1">
                <Link href="/api-doc">
                  <Button variant="ghost" className="text-sm font-medium">
                    <Code2 className="w-4 h-4 mr-2" />
                    API
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button variant="ghost" className="text-sm font-medium">
                    <FileText className="w-4 h-4 mr-2" />
                    Docs
                  </Button>
                </Link>
                <Button variant="ghost" className="text-sm font-medium">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Examples
                </Button>
                <Button variant="ghost" className="text-sm font-medium">
                  <Users className="w-4 h-4 mr-2" />
                  Community
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:block relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-4 h-4 text-muted-foreground" />
                </div>
                <Input type="search" placeholder="Search docs..." className="pl-10 h-9 w-64 bg-muted/50 text-sm" />
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Moon className="h-4 w-4 text-muted-foreground" />
                  <Switch checked={isDarkMode} onCheckedChange={toggleTheme} />
                  <Sun className="h-4 w-4 text-muted-foreground" />
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
          </div>
        </div>
      </motion.header>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-12 md:py-16 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div className="flex items-center space-x-2 mb-6">
                  <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary font-medium">
                    <Code2 className="w-3 h-3 mr-1" />
                    API
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1 font-medium">
                    v2.1.0
                  </Badge>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">SabiRoad API Documentation</h1>

                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  Integrate building recognition and information retrieval directly into your applications with our
                  powerful, developer-friendly API.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  >
                    <Key className="mr-2 h-5 w-5" />
                    Get API Key
                  </Button>

                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Read Documentation
                  </Button>
                </div>

                <div className="mt-8 flex items-center text-sm text-muted-foreground">
                  <div className="flex items-center mr-6">
                    <Zap className="w-4 h-4 mr-2 text-amber-500" />
                    <span>
                      Handling <span className="font-semibold text-foreground">20+ million</span> API requests daily
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-emerald-500" />
                    <span>99.9% uptime SLA</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Documentation Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <Tabs
                defaultValue={activeTab}
                onValueChange={(value) => setActiveTab(value as TabValue)}
                className="space-y-8"
              >
                <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm pt-4 pb-2 border-b border-border">
                  <TabsList className="w-full h-12 p-1 bg-muted/50 rounded-lg">
                    <TabsTrigger value="overview" className="rounded-md text-sm">
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="endpoints" className="rounded-md text-sm">
                      Endpoints
                    </TabsTrigger>
                    <TabsTrigger value="examples" className="rounded-md text-sm">
                      Examples
                    </TabsTrigger>
                    <TabsTrigger value="sdks" className="rounded-md text-sm">
                      SDKs
                    </TabsTrigger>
                    <TabsTrigger value="pricing" className="rounded-md text-sm">
                      Pricing
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="overview" className="space-y-8 animate-in fade-in-50">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Rocket className="w-5 h-5 mr-2 text-primary" />
                        Getting Started
                      </CardTitle>
                      <CardDescription>Everything you need to start integrating with the SabiRoad API</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold">Base URL</h3>
                        <div className="bg-muted rounded-lg p-3 font-mono text-sm flex items-center justify-between">
                          <span>https://api.sabiroad.com/v2</span>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <LucideIcons.Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold">Authentication</h3>
                        <p className="text-muted-foreground">
                          All API requests require an API key that should be included in the Authorization header:
                        </p>
                        <div className="bg-muted rounded-lg p-3 font-mono text-sm flex items-center justify-between">
                          <span>Authorization: Bearer your_api_key_here</span>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <LucideIcons.Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold">Rate Limits</h3>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1 text-center p-3 bg-background rounded-lg border border-border">
                              <div className="text-muted-foreground text-sm">Free Plan</div>
                              <div className="text-xl font-semibold">1,000</div>
                              <div className="text-xs text-muted-foreground">requests/month</div>
                            </div>
                            <div className="space-y-1 text-center p-3 bg-background rounded-lg border border-border">
                              <div className="text-muted-foreground text-sm">Pro Plan</div>
                              <div className="text-xl font-semibold">50,000</div>
                              <div className="text-xs text-muted-foreground">requests/month</div>
                            </div>
                            <div className="space-y-1 text-center p-3 bg-background rounded-lg border border-border">
                              <div className="text-muted-foreground text-sm">Enterprise</div>
                              <div className="text-xl font-semibold">Unlimited</div>
                              <div className="text-xs text-muted-foreground">custom limits</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Lightbulb className="w-5 h-5 mr-2 text-primary" />
                        Key Concepts
                      </CardTitle>
                      <CardDescription>Understanding the core features of the SabiRoad API</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex space-x-4">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Building2 className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold mb-1">Building Recognition</h3>
                            <p className="text-sm text-muted-foreground">
                              Identify buildings from images with 98.7% accuracy using our advanced AI models.
                            </p>
                          </div>
                        </div>

                        <div className="flex space-x-4">
                          <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                            <LucideIcons.Database className="w-6 h-6 text-purple-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold mb-1">Building Information</h3>
                            <p className="text-sm text-muted-foreground">
                              Access detailed architectural, historical, and cultural data from our comprehensive
                              database.
                            </p>
                          </div>
                        </div>

                        <div className="flex space-x-4">
                          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <LucideIcons.Map className="w-6 h-6 text-emerald-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold mb-1">Geospatial Search</h3>
                            <p className="text-sm text-muted-foreground">
                              Find buildings based on location with precise geospatial queries and filtering options.
                            </p>
                          </div>
                        </div>

                        <div className="flex space-x-4">
                          <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                            <LucideIcons.Cube className="w-6 h-6 text-amber-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold mb-1">3D Modeling</h3>
                            <p className="text-sm text-muted-foreground">
                              Generate detailed 3D models from 2D images with accurate proportions and textures using
                              our advanced algorithms.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileCheck className="w-5 h-5 mr-2 text-primary" />
                        Response Format
                      </CardTitle>
                      <CardDescription>Understanding the standard response structure</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">
                        All API responses follow a consistent JSON format with the following structure:
                      </p>
                      <div className="bg-muted rounded-lg p-4">
                        <pre className="text-sm font-mono">
                          {`{
  "success": true|false,    // Request status
  "building"|"buildings": { // Response data (singular or plural based on endpoint)
    // Building data fields
  },
  "error": {                // Only present if success is false
    "code": "error_code",
    "message": "Human readable error message"
  },
  "meta": {                 // Optional metadata about the request/response
    "count": 10,            // Number of items returned
    "total": 100,           // Total number of items available
    "page": 1,              // Current page number
    "pages": 10             // Total number of pages
  }
}`}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="endpoints" className="space-y-8 animate-in fade-in-50">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">API Endpoints</h2>
                    <Input placeholder="Filter endpoints..." className="w-64 h-9" />
                  </div>

                  {endpoints.map((endpoint, idx) => (
                    <Card key={idx} className="overflow-hidden">
                      <CardHeader className="bg-muted/30">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <Badge
                              className={`px-3 py-1 ${
                                endpoint.method === "GET"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : endpoint.method === "POST"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                    : endpoint.method === "PUT"
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              }`}
                            >
                              {endpoint.method}
                            </Badge>
                            <div>
                              <CardTitle className="font-mono text-base">{endpoint.path}</CardTitle>
                              <CardDescription>{endpoint.description}</CardDescription>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Copy className="w-4 h-4 mr-2" />
                            Copy URL
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="p-6 border-b border-border">
                          <h3 className="font-medium text-sm mb-3">Parameters</h3>
                          <div className="bg-muted/30 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left border-b border-border">
                                  <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
                                  <th className="px-4 py-3 font-medium text-muted-foreground">Type</th>
                                  <th className="px-4 py-3 font-medium text-muted-foreground">Required</th>
                                  <th className="px-4 py-3 font-medium text-muted-foreground">Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                {endpoint.parameters.map((param, paramIdx) => (
                                  <tr
                                    key={paramIdx}
                                    className={
                                      paramIdx !== endpoint.parameters.length - 1 ? "border-b border-border/50" : ""
                                    }
                                  >
                                    <td className="px-4 py-3 font-mono text-xs">{param.name}</td>
                                    <td className="px-4 py-3 text-xs">
                                      <Badge variant="outline" className="font-mono text-xs">
                                        {param.type}
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                      {param.required ? (
                                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs">
                                          Required
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-xs">
                                          Optional
                                        </Badge>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-xs">{param.description}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {endpoint.responseExample && (
                          <div className="p-6">
                            <h3 className="font-medium text-sm mb-3">Example Response</h3>
                            <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                              <pre className="text-sm font-mono">{endpoint.responseExample}</pre>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="examples" className="space-y-8 animate-in fade-in-50">
                  <Card>
                    <CardHeader>
                      <div>
                        <CardTitle className="flex items-center mb-2">
                          <Code className="w-5 h-5 mr-2 text-primary" />
                          Code Examples
                        </CardTitle>
                        <CardDescription>Ready-to-use code snippets in multiple languages</CardDescription>
                        <Tabs
                          defaultValue={languageTab}
                          onValueChange={(value) => setLanguageTab(value as LanguageTabValue)}
                          className="mt-4"
                        >
                          <TabsList className="bg-muted">
                            <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                            <TabsTrigger value="python">Python</TabsTrigger>
                            <TabsTrigger value="curl">cURL</TabsTrigger>
                            <TabsTrigger value="response">Response</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={languageTab}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <TabsContent value="javascript" className="mt-0 p-0">
                            <CodeSnippet language="javascript" title="example.js" code={apiExamples.javascript} />
                          </TabsContent>

                          <TabsContent value="python" className="mt-0 p-0">
                            <CodeSnippet language="python" title="example.py" code={apiExamples.python} />
                          </TabsContent>

                          <TabsContent value="curl" className="mt-0 p-0">
                            <CodeSnippet language="bash" title="example.sh" code={apiExamples.curl} />
                          </TabsContent>

                          <TabsContent value="response" className="mt-0 p-0">
                            <CodeSnippet language="json" title="response.json" code={apiExamples.response} />
                          </TabsContent>
                        </motion.div>
                      </AnimatePresence>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BookOpen className="w-5 h-5 mr-2 text-primary" />
                        Common Use Cases
                      </CardTitle>
                      <CardDescription>Practical examples of how to use the SabiRoad API</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="p-6 border-b border-border">
                        <h3 className="font-medium mb-2">Recognizing a Building from an Image</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          This example shows how to recognize a building from an image URL and retrieve its details.
                        </p>
                        <CodeSnippet
                          language="javascript"
                          title="recognize-building.js"
                          code={`// Recognize a building and get its details
async function recognizeAndGetDetails(imageUrl) {
  // First, recognize the building
  const recognizeResponse = await fetch('https://api.sabiroad.com/v2/recognize', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer your_api_key_here',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ image_url: imageUrl })
  });
  
  const recognizeData = await recognizeResponse.json();
  
  if (!recognizeData.success || !recognizeData.building?.id) {
    throw new Error('Building recognition failed');
  }
  
  // Then, get detailed information
  const detailsResponse = await fetch(\`https://api.sabiroad.com/v2/buildings/\${recognizeData.building.id}\`, {
    headers: {
      'Authorization': 'Bearer your_api_key_here'
    }
  });
  
  return await detailsResponse.json();
}`}
                        />
                      </div>

                      <div className="p-6">
                        <h3 className="font-medium mb-2">Finding Nearby Buildings</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          This example demonstrates how to find buildings near a specific location.
                        </p>
                        <CodeSnippet
                          language="javascript"
                          title="nearby-buildings.js"
                          code={`// Find buildings near a location
async function findNearbyBuildings(latitude, longitude, radius = 500) {
  const url = new URL('https://api.sabiroad.com/v2/buildings/nearby');
  url.searchParams.append('lat', latitude);
  url.searchParams.append('lng', longitude);
  url.searchParams.append('radius', radius);
  
  const response = await fetch(url, {
    headers: {
      'Authorization': 'Bearer your_api_key_here'
    }
  });
  
  return await response.json();
}`}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="sdks" className="space-y-8 animate-in fade-in-50">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Package className="w-5 h-5 mr-2 text-primary" />
                        Official SDKs
                      </CardTitle>
                      <CardDescription>
                        Use our official client libraries to integrate with the SabiRoad API
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="grid md:grid-cols-2 gap-6 p-6">
                        <div className="bg-muted/30 rounded-lg p-6 border border-border">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mr-3">
                                <LucideIcons.FileJson className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                              </div>
                              <div>
                                <h3 className="font-semibold">JavaScript SDK</h3>
                                <p className="text-xs text-muted-foreground">For Node.js and browser</p>
                              </div>
                            </div>
                            <Badge variant="outline">v2.3.1</Badge>
                          </div>
                          <div className="space-y-3">
                            <div className="bg-muted rounded-md p-2 font-mono text-xs">npm install @sabiroad/sdk</div>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" className="w-full">
                                <BookOpen className="w-4 h-4 mr-2" />
                                Documentation
                              </Button>
                              <Button variant="outline" size="sm" className="w-full">
                                <Github className="w-4 h-4 mr-2" />
                                GitHub
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="bg-muted/30 rounded-lg p-6 border border-border">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                                <FileCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <h3 className="font-semibold">Python SDK</h3>
                                <p className="text-xs text-muted-foreground">For Python 3.7+</p>
                              </div>
                            </div>
                            <Badge variant="outline">v2.2.0</Badge>
                          </div>
                          <div className="space-y-3">
                            <div className="bg-muted rounded-md p-2 font-mono text-xs">pip install sabiroad-sdk</div>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" className="w-full">
                                <BookOpen className="w-4 h-4 mr-2" />
                                Documentation
                              </Button>
                              <Button variant="outline" size="sm" className="w-full">
                                <Github className="w-4 h-4 mr-2" />
                                GitHub
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="bg-muted/30 rounded-lg p-6 border border-border">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-3">
                                <LucideIcons.FileCode2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                              </div>
                              <div>
                                <h3 className="font-semibold">PHP SDK</h3>
                                <p className="text-xs text-muted-foreground">For PHP 7.4+</p>
                              </div>
                            </div>
                            <Badge variant="outline">v2.1.5</Badge>
                          </div>
                          <div className="space-y-3">
                            <div className="bg-muted rounded-md p-2 font-mono text-xs">
                              composer require sabiroad/sdk
                            </div>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" className="w-full">
                                <BookOpen className="w-4 h-4 mr-2" />
                                Documentation
                              </Button>
                              <Button variant="outline" size="sm" className="w-full">
                                <Github className="w-4 h-4 mr-2" />
                                GitHub
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="bg-muted/30 rounded-lg p-6 border border-border">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mr-3">
                                <FileCode className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                              </div>
                              <div>
                                <h3 className="font-semibold">Go SDK</h3>
                                <p className="text-xs text-muted-foreground">For Go 1.16+</p>
                              </div>
                            </div>
                            <Badge variant="outline">v2.0.2</Badge>
                          </div>
                          <div className="space-y-3">
                            <div className="bg-muted rounded-md p-2 font-mono text-xs">
                              go get github.com/sabiroad/sdk-go
                            </div>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" className="w-full">
                                <BookOpen className="w-4 h-4 mr-2" />
                                Documentation
                              </Button>
                              <Button variant="outline" size="sm" className="w-full">
                                <Github className="w-4 h-4 mr-2" />
                                GitHub
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Users className="w-5 h-5 mr-2 text-primary" />
                        Community SDKs
                      </CardTitle>
                      <CardDescription>Third-party libraries maintained by the community</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-muted/30 rounded-lg p-4 border border-border">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">Ruby SDK</h3>
                            <Badge variant="secondary" className="text-xs">
                              Community
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">Maintained by @ruby-dev-team</p>
                          <Button variant="outline" size="sm" className="w-full">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View on GitHub
                          </Button>
                        </div>

                        <div className="bg-muted/30 rounded-lg p-4 border border-border">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">Java SDK</h3>
                            <Badge variant="secondary" className="text-xs">
                              Community
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">Maintained by @java-community</p>
                          <Button variant="outline" size="sm" className="w-full">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View on GitHub
                          </Button>
                        </div>

                        <div className="bg-muted/30 rounded-lg p-4 border border-border">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">C# SDK</h3>
                            <Badge variant="secondary" className="text-xs">
                              Community
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">Maintained by @dotnet-developers</p>
                          <Button variant="outline" size="sm" className="w-full">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View on GitHub
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="pricing" className="space-y-8 animate-in fade-in-50">
                  <div className="text-center max-w-3xl mx-auto mb-8">
                    <h2 className="text-2xl font-bold mb-3">API Plans & Pricing</h2>
                    <p className="text-muted-foreground">
                      Choose the plan that best fits your needs. All plans include access to our core API features.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-8">
                    {pricingPlans.map((plan) => (
                      <Card
                        key={plan.name}
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
                              {LucideIcons[plan.icon as keyof typeof LucideIcons] &&
                                React.createElement(LucideIcons[plan.icon as keyof typeof LucideIcons], {
                                  className: `w-5 h-5 ${plan.popular ? "text-primary" : "text-muted-foreground"}`,
                                })}
                            </div>
                            <CardTitle className="text-lg font-medium">{plan.name}</CardTitle>
                          </div>
                          <div className="text-3xl font-bold">
                            {plan.price}
                            <span className="text-sm font-normal text-muted-foreground ml-1">/{plan.period}</span>
                          </div>
                          <CardDescription>
                            {plan.name === "Free"
                              ? "Perfect for getting started"
                              : plan.name === "Pro"
                                ? "Ideal for professionals"
                                : "For organizations with advanced needs"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">API Requests</div>
                            <div className="font-medium">{plan.requests}</div>
                          </div>

                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Recognition Quality</div>
                            <div className="font-medium">{plan.recognition}</div>
                          </div>

                          <Separator />

                          <div>
                            <div className="text-sm text-muted-foreground mb-2">Features</div>
                            <ul className="space-y-2 text-sm">
                              {plan.features.map((feature, idx) => (
                                <li key={idx} className="flex items-center">
                                  <Check className="w-4 h-4 text-emerald-500 mr-2 shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button
                            variant={plan.buttonVariant}
                            className={`w-full ${plan.popular ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`}
                          >
                            {plan.buttonText}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>

                  <Card className="mt-8">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <HelpCircle className="w-5 h-5 mr-2 text-primary" />
                        Frequently Asked Questions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="p-6 border-b border-border">
                        <h3 className="font-semibold mb-2">What happens if I exceed my plan's request limit?</h3>
                        <p className="text-sm text-muted-foreground">
                          If you exceed your plan's monthly request limit, additional requests will be charged at $0.01
                          per request. You can also upgrade to a higher plan at any time.
                        </p>
                      </div>
                      <div className="p-6 border-b border-border">
                        <h3 className="font-semibold mb-2">Can I switch between plans?</h3>
                        <p className="text-sm text-muted-foreground">
                          Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of
                          your next billing cycle.
                        </p>
                      </div>
                      <div className="p-6 border-b border-border">
                        <h3 className="font-semibold mb-2">Do you offer a free trial for paid plans?</h3>
                        <p className="text-sm text-muted-foreground">
                          Yes, we offer a 14-day free trial for the Pro plan. No credit card is required to start your
                          trial.
                        </p>
                      </div>
                      <div className="p-6">
                        <h3 className="font-semibold mb-2">What kind of support is included?</h3>
                        <p className="text-sm text-muted-foreground">
                          Free plans include community support. Pro plans include email support with 24-hour response
                          time. Enterprise plans include dedicated support with a 1-hour SLA.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-16 bg-primary/5 border-y border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-4 px-3 py-1 bg-primary/10 text-primary">Get Started Today</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to integrate building recognition?</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of developers who are already using SabiRoad API to power their applications.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                >
                  <Key className="mr-2 h-5 w-5" />
                  Get API Key
                </Button>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Contact Sales
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-purple-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold">SabiRoad</span>
              </Link>
              <p className="text-sm text-muted-foreground mb-4">
                Revolutionizing how we discover and analyze buildings with AI and comprehensive data.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Github className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Linkedin className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-4">API</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Endpoints
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    SDKs
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Rate Limits
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
                    API License
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
                API v2.1.0
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default SabiRoadAPIPage

