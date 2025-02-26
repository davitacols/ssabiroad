"use client"

import React, { useState } from "react"
import Link from "next/link"
import * as LucideIcons from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// TypeScript interfaces
interface CodeSnippetProps {
  language: string;
  title: string;
  code: string;
}

interface ApiEndpointParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface ApiEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  parameters: ApiEndpointParameter[];
}

interface PricingPlan {
  name: string;
  requests: string;
  recognition: string;
  features: string[];
}

// Example Code Snippet Component
const CodeSnippet: React.FC<CodeSnippetProps> = ({ language, title, code }) => {
  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-950 mb-6">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <LucideIcons.File className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</span>
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <LucideIcons.Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="p-4 bg-gray-50 dark:bg-gray-950 overflow-x-auto">
        <pre className="text-sm font-mono">
          <code className={`language-${language}`}>{code}</code>
        </pre>
      </div>
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
  -H "Authorization: Bearer your_api_key_here"`
};

const endpoints: ApiEndpoint[] = [
  {
    method: "POST",
    path: "/v2/recognize",
    description: "Recognize buildings from images",
    parameters: [
      { name: "image_url", type: "string", required: true, description: "URL of the image to analyze" },
      { name: "options.include_history", type: "boolean", required: false, description: "Include historical information" },
      { name: "options.generate_3d", type: "boolean", required: false, description: "Generate 3D model (Pro plan only)" }
    ]
  },
  {
    method: "GET",
    path: "/v2/buildings/{id}",
    description: "Get detailed building information",
    parameters: [
      { name: "id", type: "string", required: true, description: "Building ID" },
      { name: "fields", type: "string[]", required: false, description: "Specific fields to return" }
    ]
  },
  {
    method: "GET",
    path: "/v2/buildings/nearby",
    description: "Find buildings near a location",
    parameters: [
      { name: "lat", type: "number", required: true, description: "Latitude" },
      { name: "lng", type: "number", required: true, description: "Longitude" },
      { name: "radius", type: "number", required: false, description: "Search radius in meters (default: 500)" },
      { name: "limit", type: "number", required: false, description: "Maximum results to return (default: 20)" }
    ]
  },
  {
    method: "POST",
    path: "/v2/buildings/search",
    description: "Search buildings by name or attributes",
    parameters: [
      { name: "query", type: "string", required: true, description: "Search query" },
      { name: "filters.year", type: "number", required: false, description: "Filter by year built" },
      { name: "filters.architect", type: "string", required: false, description: "Filter by architect" },
      { name: "filters.style", type: "string", required: false, description: "Filter by architectural style" }
    ]
  }
];

const pricingPlans: PricingPlan[] = [
  {
    name: "Free",
    requests: "1,000 / month",
    recognition: "Basic",
    features: ["Building Recognition", "Basic Information"]
  },
  {
    name: "Pro",
    requests: "50,000 / month",
    recognition: "Advanced",
    features: ["3D Modeling", "Historical Data", "Batch Processing"]
  },
  {
    name: "Enterprise",
    requests: "Unlimited",
    recognition: "Premium",
    features: ["Custom Integration", "Dedicated Support", "SLA Guarantee"]
  }
];

type TabValue = "overview" | "endpoints" | "examples" | "pricing";
type LanguageTabValue = "javascript" | "python" | "curl";

const SabiRoadAPIPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabValue>("overview");
  const [languageTab, setLanguageTab] = useState<LanguageTabValue>("javascript");
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* We'll assume the NavBar is rendered from a shared layout component */}
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 md:py-24 border-b border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center space-x-2 mb-6">
                  <Badge className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-medium">
                    <LucideIcons.Code className="w-3 h-3 mr-1" />
                    API
                  </Badge>
                  <Badge className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 font-medium">
                    v2.1.0
                  </Badge>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                  SabiRoad API Documentation
                </h1>

                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                  Integrate building recognition and information retrieval directly into your applications with our powerful, developer-friendly API.
                </p>

                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  <LucideIcons.Key className="mr-2 h-5 w-5" />
                  Get API Key
                </Button>
                
                <div className="mt-8 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <span>Handling <span className="font-semibold text-gray-900 dark:text-gray-100">20+ million</span> API requests daily</span>
                </div>
              </motion.div>
              
              <div className="mt-12">
                <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="space-y-6">
                  <div className="border-b border-gray-200 dark:border-gray-800">
                    <TabsList className="flex w-full h-12 bg-transparent p-0 mb-0">
                      <TabsTrigger 
                        value="overview" 
                        className={`h-full flex-1 rounded-none border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none ${activeTab === 'overview' ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400' : 'border-transparent'}`}
                      >
                        Overview
                      </TabsTrigger>
                      <TabsTrigger 
                        value="endpoints" 
                        className={`h-full flex-1 rounded-none border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none ${activeTab === 'endpoints' ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400' : 'border-transparent'}`}
                      >
                        Endpoints
                      </TabsTrigger>
                      <TabsTrigger 
                        value="examples" 
                        className={`h-full flex-1 rounded-none border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none ${activeTab === 'examples' ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400' : 'border-transparent'}`}
                      >
                        Examples
                      </TabsTrigger>
                      <TabsTrigger 
                        value="pricing" 
                        className={`h-full flex-1 rounded-none border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none ${activeTab === 'pricing' ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400' : 'border-transparent'}`}
                      >
                        Pricing
                      </TabsTrigger>
                    </TabsList>
                  </div>
                
                  <TabsContent value="overview" className="mt-6 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Getting Started</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p>Welcome to the SabiRoad API! Our API allows you to integrate building recognition and detailed architectural information into your applications.</p>
                        
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">Base URL</h3>
                          <CodeSnippet 
                            language="bash" 
                            title="Base URL" 
                            code="https://api.sabiroad.com/v2" 
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">Authentication</h3>
                          <p>All API requests require an API key that should be included in the Authorization header:</p>
                          <CodeSnippet 
                            language="bash" 
                            title="Authorization Header" 
                            code='Authorization: Bearer your_api_key_here' 
                          />
                        </div>
                        
                        <div className="mt-4 space-y-2">
                          <h3 className="text-lg font-semibold">Rate Limits</h3>
                          <p>Rate limits vary by plan tier. See the Pricing tab for details.</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Key Concepts</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="flex space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <LucideIcons.Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold">Building Recognition</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-300">Identify buildings from images with high accuracy</p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                              <LucideIcons.Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold">Building Information</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-300">Access detailed architectural and historical data</p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                              <LucideIcons.Map className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold">Geospatial Search</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-300">Find buildings based on location criteria</p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                              <LucideIcons.Layers className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold">3D Modeling</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-300">Generate 3D models from building images</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="endpoints" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>API Endpoints</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        {endpoints.map((endpoint, idx) => (
                          <div key={idx} className={`px-6 py-4 ${idx < endpoints.length - 1 ? 'border-b border-gray-200 dark:border-gray-800' : ''}`}>
                            <div className="flex items-start mb-2">
                              <Badge className={`
                                mr-3 px-3 py-1 
                                ${endpoint.method === 'GET' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                                ${endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''}
                                ${endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : ''}
                                ${endpoint.method === 'DELETE' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : ''}
                              `}>
                                {endpoint.method}
                              </Badge>
                              <div>
                                <h3 className="font-mono text-sm font-semibold">{endpoint.path}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{endpoint.description}</p>
                              </div>
                            </div>
                            
                            <h4 className="font-medium text-sm mt-3 mb-2">Parameters</h4>
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-left text-gray-500 dark:text-gray-400">
                                    <th className="pb-2">Name</th>
                                    <th className="pb-2">Type</th>
                                    <th className="pb-2">Required</th>
                                    <th className="pb-2">Description</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {endpoint.parameters.map((param, paramIdx) => (
                                    <tr key={paramIdx} className="border-t border-gray-200 dark:border-gray-800">
                                      <td className="py-2 font-mono text-xs">{param.name}</td>
                                      <td className="py-2 text-xs">{param.type}</td>
                                      <td className="py-2 text-xs">{param.required ? 'Yes' : 'No'}</td>
                                      <td className="py-2 text-xs">{param.description}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="examples" className="mt-6">
                    <Card>
                      <CardHeader>
                        <div>
                          <CardTitle className="mb-2">Code Examples</CardTitle>
                          <Tabs defaultValue={languageTab} onValueChange={(value) => setLanguageTab(value as LanguageTabValue)}>
                            <TabsList className="bg-gray-100 dark:bg-gray-900">
                              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                              <TabsTrigger value="python">Python</TabsTrigger>
                              <TabsTrigger value="curl">cURL</TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <TabsContent value="javascript" className="mt-0 p-0">
                          <CodeSnippet 
                            language="javascript" 
                            title="example.js" 
                            code={apiExamples.javascript} 
                          />
                        </TabsContent>
                        
                        <TabsContent value="python" className="mt-0 p-0">
                          <CodeSnippet 
                            language="python" 
                            title="example.py" 
                            code={apiExamples.python} 
                          />
                        </TabsContent>
                        
                        <TabsContent value="curl" className="mt-0 p-0">
                          <CodeSnippet 
                            language="bash" 
                            title="example.sh" 
                            code={apiExamples.curl} 
                          />
                        </TabsContent>
                      </CardContent>
                    </Card>
                    
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle>Response Format</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CodeSnippet 
                          language="json" 
                          title="Example Response" 
                          code={`{
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
}`} 
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="pricing" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>API Plans & Pricing</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-3 gap-6">
                          {pricingPlans.map((plan, idx) => (
                            <div key={idx} className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                              <div className="bg-gray-100 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                                <h3 className="font-semibold text-lg">{plan.name}</h3>
                              </div>
                              <div className="p-6 space-y-4">
                                <div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">Requests</div>
                                  <div className="font-medium">{plan.requests}</div>
                                </div>
                                
                                <div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">Recognition Quality</div>
                                  <div className="font-medium">{plan.recognition}</div>
                                </div>
                                
                                <div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Features</div>
                                  <ul className="space-y-1">
                                    {plan.features.map((feature, fidx) => (
                                      <li key={fidx} className="flex items-center text-sm">
                                        <LucideIcons.Check className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                                        {feature}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                
                                <Button className={idx === 1 ? "w-full bg-blue-600 text-white hover:bg-blue-700" : "w-full"} variant={idx !== 1 ? "outline" : "default"}>
                                  {idx === 2 ? "Contact Sales" : "Get Started"}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default SabiRoadAPIPage