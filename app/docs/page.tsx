"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import * as LucideIcons from "lucide-react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"

// Types for documentation content
interface DocSection {
  id: string
  title: string
  subtitle?: string
  content: string
  code?: {
    language: string
    snippet: string
  }
}

interface DocCategory {
  id: string
  title: string
  icon: keyof typeof LucideIcons
  sections: DocSection[]
}

// Documentation data
const documentationCategories: DocCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: "Rocket",
    sections: [
      {
        id: "introduction",
        title: "Introduction",
        subtitle: "Learn about SabiRoad's core features",
        content: "SabiRoad is an advanced building recognition platform that uses AI to identify architecture and provide detailed information. Our API allows developers to integrate these capabilities into their own applications.",
      },
      {
        id: "installation",
        title: "Installation",
        subtitle: "Set up SabiRoad in your project",
        content: "Installing the SabiRoad SDK is simple. You can use npm or yarn to add it to your project.",
        code: {
          language: "bash",
          snippet: "# Using npm\nnpm install @sabiroad/sdk\n\n# Using yarn\nyarn add @sabiroad/sdk"
        }
      },
      {
        id: "quick-start",
        title: "Quick Start",
        subtitle: "Your first building recognition",
        content: "Get started with a simple example to recognize a building from an image.",
        code: {
          language: "typescript",
          snippet: "import { SabiRoad } from '@sabiroad/sdk';\n\n// Initialize with your API key\nconst sabiroad = new SabiRoad('YOUR_API_KEY');\n\n// Recognize a building from an image URL\nasync function recognizeBuilding(imageUrl: string) {\n  try {\n    const result = await sabiroad.recognize(imageUrl);\n    console.log('Building recognized:', result.name);\n    console.log('Architecture style:', result.style);\n    console.log('Year built:', result.yearBuilt);\n    return result;\n  } catch (error) {\n    console.error('Recognition failed:', error);\n  }\n}"
        }
      }
    ]
  },
  {
    id: "api-reference",
    title: "API Reference",
    icon: "Code",
    sections: [
      {
        id: "authentication",
        title: "Authentication",
        subtitle: "Secure your API requests",
        content: "All API requests require authentication using your API key. You can find your API key in your SabiRoad dashboard.",
        code: {
          language: "typescript",
          snippet: "// Authentication with API key\nconst headers = {\n  'Authorization': 'Bearer YOUR_API_KEY',\n  'Content-Type': 'application/json'\n};\n\nfetch('https://api.sabiroad.com/v2/recognize', {\n  method: 'POST',\n  headers,\n  body: JSON.stringify({\n    image: 'https://example.com/image.jpg'\n  })\n});"
        }
      },
      {
        id: "endpoints",
        title: "Endpoints",
        subtitle: "Available API endpoints",
        content: "SabiRoad offers several endpoints for building recognition and information retrieval.",
        code: {
          language: "typescript",
          snippet: "// Building Recognition Endpoint\nPOST https://api.sabiroad.com/v2/recognize\n\n// Building Information Endpoint\nGET https://api.sabiroad.com/v2/buildings/{building_id}\n\n// Search Buildings Endpoint\nGET https://api.sabiroad.com/v2/search?query={query}\n\n// 3D Model Generation\nPOST https://api.sabiroad.com/v2/generate-model"
        }
      },
      {
        id: "response-format",
        title: "Response Format",
        subtitle: "Understanding API responses",
        content: "All API responses are returned in JSON format with a standardized structure.",
        code: {
          language: "json",
          snippet: "{\n  \"success\": true,\n  \"data\": {\n    \"buildingId\": \"bld_12345\",\n    \"name\": \"Empire State Building\",\n    \"location\": {\n      \"latitude\": 40.748817,\n      \"longitude\": -73.985428,\n      \"address\": \"350 Fifth Avenue, New York, NY\"\n    },\n    \"details\": {\n      \"style\": \"Art Deco\",\n      \"height\": 381,\n      \"floors\": 102,\n      \"yearBuilt\": 1931,\n      \"architect\": \"Shreve, Lamb & Harmon\"\n    },\n    \"confidence\": 0.98\n  }\n}"
        }
      }
    ]
  },
  {
    id: "guides",
    title: "Guides",
    icon: "BookOpen",
    sections: [
      {
        id: "image-requirements",
        title: "Image Requirements",
        subtitle: "Optimize recognition accuracy",
        content: "For the best recognition results, follow these guidelines when capturing or selecting building images.",
      },
      {
        id: "data-filtering",
        title: "Data Filtering",
        subtitle: "Filter and sort building data",
        content: "Learn how to filter and sort the building data returned by the API.",
        code: {
          language: "typescript",
          snippet: "// Example: Filtering buildings by architectural style\nasync function getArtDecoBuildings() {\n  const buildings = await sabiroad.search({\n    style: 'Art Deco',\n    minYearBuilt: 1920,\n    maxYearBuilt: 1940,\n    sortBy: 'height',\n    sortDirection: 'desc',\n    limit: 20\n  });\n  \n  return buildings;\n}"
        }
      },
      {
        id: "error-handling",
        title: "Error Handling",
        subtitle: "Handle API errors gracefully",
        content: "Learn how to handle errors and edge cases in your integration.",
        code: {
          language: "typescript",
          snippet: "async function recognizeWithErrorHandling(imageUrl: string) {\n  try {\n    const result = await sabiroad.recognize(imageUrl);\n    return result;\n  } catch (error) {\n    if (error.code === 'recognition_failed') {\n      // No building could be recognized in the image\n      return null;\n    } else if (error.code === 'invalid_image') {\n      // The provided image is invalid or corrupted\n      throw new Error('Please provide a valid image');\n    } else if (error.code === 'rate_limit_exceeded') {\n      // Wait and retry with exponential backoff\n      return await retryWithBackoff(() => sabiroad.recognize(imageUrl));\n    } else {\n      // Handle other errors\n      throw error;\n    }\n  }\n}"
        }
      }
    ]
  },
  {
    id: "sdk",
    title: "SDK Reference",
    icon: "Package",
    sections: [
      {
        id: "core-classes",
        title: "Core Classes",
        subtitle: "Main SDK components",
        content: "The SabiRoad SDK provides several classes to interact with the API.",
        code: {
          language: "typescript",
          snippet: "// Main client class\nclass SabiRoad {\n  constructor(apiKey: string, options?: SabiRoadOptions);\n  recognize(image: string | File): Promise<RecognitionResult>;\n  getBuilding(buildingId: string): Promise<Building>;\n  search(params: SearchParams): Promise<SearchResult>;\n  generateModel(buildingId: string): Promise<Model3D>;\n}\n\n// Recognition options\ninterface RecognitionOptions {\n  includeDetails?: boolean;\n  confidenceThreshold?: number;\n}"
        }
      },
      {
        id: "typescript-types",
        title: "TypeScript Types",
        subtitle: "Type definitions for SDK",
        content: "The SDK includes TypeScript definitions for all API responses and parameters.",
        code: {
          language: "typescript",
          snippet: "// Building type definition\nexport interface Building {\n  id: string;\n  name: string;\n  location: {\n    latitude: number;\n    longitude: number;\n    address?: string;\n    city?: string;\n    country?: string;\n  };\n  details: {\n    style?: string;\n    height?: number;\n    floors?: number;\n    yearBuilt?: number;\n    architect?: string;\n    description?: string;\n  };\n  images?: string[];\n}\n\n// Recognition result\nexport interface RecognitionResult {\n  buildingId: string;\n  confidence: number;\n  building?: Building;\n}"
        }
      },
      {
        id: "advanced-config",
        title: "Advanced Configuration",
        subtitle: "Fine-tune the SDK behavior",
        content: "Configure the SDK for advanced use cases.",
        code: {
          language: "typescript",
          snippet: "// SDK configuration options\nconst sabiroad = new SabiRoad('YOUR_API_KEY', {\n  baseUrl: 'https://api.sabiroad.com/v2',\n  timeout: 30000, // 30 seconds\n  retryAttempts: 3,\n  retryDelay: 1000, // 1 second initial delay with exponential backoff\n  cache: {\n    enabled: true,\n    ttl: 3600 // 1 hour cache\n  },\n  defaultRecognitionOptions: {\n    includeDetails: true,\n    confidenceThreshold: 0.7\n  }\n});"
        }
      }
    ]
  },
  {
    id: "examples",
    title: "Examples",
    icon: "Lightbulb",
    sections: [
      {
        id: "react-integration",
        title: "React Integration",
        subtitle: "Use SabiRoad in React apps",
        content: "Learn how to integrate SabiRoad with React applications.",
        code: {
          language: "tsx",
          snippet: "import React, { useState } from 'react';\nimport { SabiRoad } from '@sabiroad/sdk';\n\nconst sabiroad = new SabiRoad('YOUR_API_KEY');\n\nconst BuildingRecognizer: React.FC = () => {\n  const [imageUrl, setImageUrl] = useState('');\n  const [result, setResult] = useState<any>(null);\n  const [loading, setLoading] = useState(false);\n  const [error, setError] = useState('');\n\n  const handleRecognize = async () => {\n    if (!imageUrl) return;\n    \n    setLoading(true);\n    setError('');\n    \n    try {\n      const data = await sabiroad.recognize(imageUrl);\n      setResult(data);\n    } catch (err) {\n      setError('Recognition failed: ' + err.message);\n    } finally {\n      setLoading(false);\n    }\n  };\n\n  return (\n    <div>\n      <input\n        type=\"text\"\n        value={imageUrl}\n        onChange={(e) => setImageUrl(e.target.value)}\n        placeholder=\"Enter image URL\"\n      />\n      <button onClick={handleRecognize} disabled={loading}>\n        {loading ? 'Recognizing...' : 'Recognize Building'}\n      </button>\n      \n      {error && <div className=\"error\">{error}</div>}\n      \n      {result && (\n        <div className=\"result\">\n          <h3>{result.building.name}</h3>\n          <p>Style: {result.building.details.style}</p>\n          <p>Year built: {result.building.details.yearBuilt}</p>\n          <p>Architect: {result.building.details.architect}</p>\n        </div>\n      )}\n    </div>\n  );\n};"
        }
      },
      {
        id: "next-js-integration",
        title: "Next.js Integration",
        subtitle: "Server and client components",
        content: "Integrating SabiRoad with Next.js applications for both server and client components.",
        code: {
          language: "tsx",
          snippet: "// app/api/recognize/route.ts (Route Handler)\nimport { NextResponse } from 'next/server';\nimport { SabiRoad } from '@sabiroad/sdk';\n\nconst sabiroad = new SabiRoad(process.env.SABIROAD_API_KEY!);\n\nexport async function POST(request: Request) {\n  try {\n    const { imageUrl } = await request.json();\n    \n    if (!imageUrl) {\n      return NextResponse.json(\n        { error: 'Image URL is required' },\n        { status: 400 }\n      );\n    }\n    \n    const result = await sabiroad.recognize(imageUrl);\n    return NextResponse.json(result);\n  } catch (error: any) {\n    return NextResponse.json(\n      { error: error.message },\n      { status: 500 }\n    );\n  }\n}\n\n// app/recognize/page.tsx (Client Component)\n'use client';\n\nimport { useState } from 'react';\n\nexport default function RecognizePage() {\n  const [imageUrl, setImageUrl] = useState('');\n  const [result, setResult] = useState(null);\n  const [loading, setLoading] = useState(false);\n  \n  const handleRecognize = async () => {\n    setLoading(true);\n    try {\n      const response = await fetch('/api/recognize', {\n        method: 'POST',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify({ imageUrl })\n      });\n      const data = await response.json();\n      setResult(data);\n    } catch (error) {\n      console.error(error);\n    } finally {\n      setLoading(false);\n    }\n  };\n  \n  return (\n    <div className=\"container mx-auto py-8\">\n      <h1 className=\"text-2xl font-bold mb-4\">Building Recognition</h1>\n      {/* Form and result display */}\n    </div>\n  );\n}"
        }
      },
      {
        id: "mobile-app",
        title: "Mobile App Integration",
        subtitle: "React Native implementation",
        content: "Use SabiRoad in React Native mobile applications.",
        code: {
          language: "tsx",
          snippet: "import React, { useState } from 'react';\nimport { View, Text, TextInput, Button, Image, StyleSheet } from 'react-native';\nimport { SabiRoad } from '@sabiroad/react-native';\n\nconst sabiroad = new SabiRoad('YOUR_API_KEY');\n\nconst BuildingRecognitionScreen = () => {\n  const [imageUrl, setImageUrl] = useState('');\n  const [building, setBuilding] = useState(null);\n  const [loading, setLoading] = useState(false);\n\n  const recognizeBuilding = async () => {\n    if (!imageUrl) return;\n    \n    setLoading(true);\n    try {\n      const result = await sabiroad.recognize(imageUrl);\n      setBuilding(result.building);\n    } catch (error) {\n      console.error('Recognition failed:', error);\n      alert(`Recognition failed: ${error.message}`);\n    } finally {\n      setLoading(false);\n    }\n  };\n\n  return (\n    <View style={styles.container}>\n      <Text style={styles.title}>Building Recognition</Text>\n      \n      <TextInput\n        style={styles.input}\n        value={imageUrl}\n        onChangeText={setImageUrl}\n        placeholder=\"Enter image URL\"\n      />\n      \n      <Button\n        title={loading ? 'Recognizing...' : 'Recognize Building'}\n        onPress={recognizeBuilding}\n        disabled={loading}\n      />\n      \n      {building && (\n        <View style={styles.resultContainer}>\n          <Image \n            source={{ uri: imageUrl }}\n            style={styles.image}\n            resizeMode=\"cover\"\n          />\n          <Text style={styles.buildingName}>{building.name}</Text>\n          <Text>Style: {building.details.style}</Text>\n          <Text>Year built: {building.details.yearBuilt}</Text>\n          <Text>Architect: {building.details.architect}</Text>\n        </View>\n      )}\n    </View>\n  );\n};\n\nconst styles = StyleSheet.create({\n  container: { padding: 20 },\n  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },\n  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 20 },\n  resultContainer: { marginTop: 20 },\n  image: { width: '100%', height: 200, marginBottom: 10 },\n  buildingName: { fontSize: 18, fontWeight: 'bold' }\n});\n\nexport default BuildingRecognitionScreen;"
        }
      }
    ]
  }
];

// CodeBlock component for displaying code snippets
const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-950 mt-4">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <LucideIcons.File className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{language}</span>
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <LucideIcons.Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="p-4 bg-gray-50 dark:bg-gray-950 overflow-x-auto">
        <pre className="text-sm font-mono whitespace-pre-wrap">
          <code className={`language-${language}`}>{code}</code>
        </pre>
      </div>
    </div>
  );
};

// Table of Contents component
const TableOfContents: React.FC<{
  categories: DocCategory[];
  activeSection: string;
  setActiveSection: (id: string) => void;
}> = ({ categories, activeSection, setActiveSection }) => {
  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category.id} className="space-y-2">
          <div className="flex items-center space-x-2 mb-3">
            {LucideIcons[category.icon] &&
              React.createElement(LucideIcons[category.icon], {
                className: "w-5 h-5 text-gray-700 dark:text-gray-300",
              })}
            <h3 className="font-medium text-gray-900 dark:text-white">{category.title}</h3>
          </div>
          <ul className="space-y-1 pl-7">
            {category.sections.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => setActiveSection(section.id)}
                  className={`text-sm w-full text-left py-1 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    activeSection === section.id
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {section.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

// Documentation Content component
const DocContent: React.FC<{ section: DocSection | null }> = ({ section }) => {
  if (!section) {
    return <div>Select a section from the sidebar to view documentation.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{section.title}</h2>
        {section.subtitle && (
          <p className="text-gray-600 dark:text-gray-400 mt-1">{section.subtitle}</p>
        )}
      </div>
      
      <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
        <p>{section.content}</p>
      </div>
      
      {section.code && (
        <CodeBlock language={section.code.language} code={section.code.snippet} />
      )}
    </div>
  );
};

// Function to find section by ID
const findSectionById = (
  categories: DocCategory[],
  sectionId: string
): DocSection | null => {
  for (const category of categories) {
    const section = category.sections.find((s) => s.id === sectionId);
    if (section) return section;
  }
  return null;
};

// Version history component
const VersionHistory: React.FC = () => {
  const versions = [
    { version: "v2.1.0", date: "February 2025", notes: "Added 3D modeling, improved recognition accuracy" },
    { version: "v2.0.0", date: "December 2024", notes: "Major API overhaul, new endpoints, TypeScript SDK" },
    { version: "v1.5.2", date: "October 2024", notes: "Bug fixes and performance improvements" },
    { version: "v1.5.0", date: "September 2024", notes: "Added historical data integration" },
    { version: "v1.0.0", date: "June 2024", notes: "Initial public release" },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Version History</h3>
      <div className="space-y-3">
        {versions.map((v) => (
          <div key={v.version} className="flex justify-between items-start pb-3 border-b border-gray-200 dark:border-gray-800">
            <div>
              <div className="font-medium">{v.version}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{v.notes}</div>
            </div>
            <Badge variant="outline" className="text-xs">{v.date}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Docs component
const DocsPage: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("docs");
  const [activeSection, setActiveSection] = useState("introduction");
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const currentSection = findSectionById(documentationCategories, activeSection);

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
                  <Button variant="ghost" className="text-sm font-medium bg-gray-100 dark:bg-gray-800">
                    <LucideIcons.FileText className="w-4 h-4 mr-2" />
                    Docs
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
                  placeholder="Search docs..." 
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
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <div className="md:w-64 lg:w-72 shrink-0">
              <div className="sticky top-24 overflow-y-auto pr-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Documentation</h2>
                  <Badge className="px-2 py-1">v2.1.0</Badge>
                </div>
                
                <Tabs defaultValue="docs" className="mb-6" onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="docs">Docs</TabsTrigger>
                    <TabsTrigger value="api">API</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                {activeTab === "docs" ? (
                  <TableOfContents 
                    categories={documentationCategories} 
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                  />
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 mb-3">
                        <LucideIcons.Server className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        <h3 className="font-medium text-gray-900 dark:text-white">API Reference</h3>
                      </div>
                      <ul className="space-y-1 pl-7">
                        <li>
                          <button className="text-sm w-full text-left py-1 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
                            Authentication
                          </button>
                        </li>
                        <li>
                          <button className="text-sm w-full text-left py-1 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
                            Endpoints
                          </button>
                        </li>
                        <li>
                          <button className="text-sm w-full text-left py-1 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
                            Rate Limits
                          </button>
                        </li>
                        <li>
                          <button className="text-sm w-full text-left py-1 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
                            Error Codes
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm p-6 md:p-8">
                {activeTab === "docs" ? (
                  <DocContent section={currentSection} />
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">API Reference</h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Complete reference documentation for the SabiRoad API.
                      </p>
                    </div>
                    
                    <div className="prose dark:prose-invert">
                      <p>Select a section from the sidebar to view API documentation.</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Additional Resources */}
              <div className="mt-8 grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Resources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li>
                        <Link href="#" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                          <LucideIcons.Download className="w-4 h-4 mr-2" />
                          Download SDK
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                          <LucideIcons.Github className="w-4 h-4 mr-2" />
                          GitHub Repository
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                          <LucideIcons.BarChart className="w-4 h-4 mr-2" />
                          Dashboard
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                          <LucideIcons.HelpCircle className="w-4 h-4 mr-2" />
                          Support
                        </Link>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Version Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VersionHistory />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-md flex items-center justify-center">
                  <LucideIcons.Building className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-semibold">SabiRoad</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                Advanced building recognition using AI technology.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Products</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400">API</Link></li>
                <li><Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400">SDK</Link></li>
                <li><Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Mobile SDK</Link></li>
                <li><Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Enterprise</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Documentation</Link></li>
                <li><Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400">API Reference</Link></li>
                <li><Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400">GitHub</Link></li>
                <li><Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Status</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400">About</Link></li>
                <li><Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Blog</Link></li>
                <li><Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Careers</Link></li>
                <li><Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Contact</Link></li>
              </ul>
            </div>
          </div>
          
          <Separator className="my-8" />
          
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} SabiRoad, Inc. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                <LucideIcons.Twitter className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                <LucideIcons.Github className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                <LucideIcons.Linkedin className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DocsPage;