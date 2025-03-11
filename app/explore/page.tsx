"use client"

import { useState } from "react"
import React from "react"
import Link from "next/link"
import * as LucideIcons from "lucide-react"
import { AppNavbar } from "@/components/app-navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("")
  
  const categories = [
    {
      id: "trending",
      title: "Trending Destinations",
      description: "Most popular places being explored right now",
      icon: "TrendingUp",
      color: "text-primary",
    },
    {
      id: "collections",
      title: "Curated Collections",
      description: "Handpicked destinations for every interest",
      icon: "FolderHeart",
      color: "text-pink-500 dark:text-pink-400",
    },
    {
      id: "seasonal",
      title: "Seasonal Experiences",
      description: "Time-limited events and activities",
      icon: "Calendar",
      color: "text-amber-500 dark:text-amber-400",
    },
    {
      id: "hidden-gems",
      title: "Off the Beaten Path",
      description: "Lesser-known locations worth discovering",
      icon: "MapPin",
      color: "text-emerald-500 dark:text-emerald-400",
    },
  ]
  
  const destinations = [
    {
      id: 1,
      name: "Kyoto Gardens",
      location: "Kyoto, Japan",
      category: "Cultural",
      image: "/placeholder.svg?height=600&width=800",
      rating: 4.9,
      reviewCount: 1243,
      description: "Serene traditional gardens showcasing Japanese landscape design and architecture.",
      tags: ["Gardens", "Historical", "Peaceful"],
      trending: true,
      seasonal: false,
      collection: "Asian Wonders",
      hiddenGem: false
    },
    {
      id: 2,
      name: "Santorini Overlook",
      location: "Santorini, Greece",
      category: "Scenic",
      image: "/placeholder.svg?height=600&width=800",
      rating: 4.8,
      reviewCount: 987,
      description: "Breathtaking coastal views of the Aegean Sea with iconic white and blue architecture.",
      tags: ["Coastal", "Sunset", "Photography"],
      trending: true,
      seasonal: true,
      collection: "Mediterranean Escapes",
      hiddenGem: false
    },
    {
      id: 3,
      name: "Grand Canyon Skywalk",
      location: "Arizona, USA",
      category: "Natural Wonder",
      image: "/placeholder.svg?height=600&width=800",
      rating: 4.7,
      reviewCount: 1568,
      description: "Horseshoe-shaped glass bridge offering unparalleled views of the magnificent canyon.",
      tags: ["Canyon", "Adventure", "Hiking"],
      trending: true,
      seasonal: false,
      collection: "Natural Wonders",
      hiddenGem: false
    },
    {
      id: 4,
      name: "Cherry Blossom Festival",
      location: "Washington DC, USA",
      category: "Event",
      image: "/placeholder.svg?height=600&width=800",
      rating: 4.9,
      reviewCount: 2103,
      description: "Annual celebration of the beautiful cherry blossom trees gifted from Japan.",
      tags: ["Festival", "Spring", "Photography"],
      trending: false,
      seasonal: true,
      collection: "Seasonal Events",
      hiddenGem: false
    },
    {
      id: 5,
      name: "Plitvice Lakes",
      location: "Croatia",
      category: "Natural Wonder",
      image: "/placeholder.svg?height=600&width=800",
      rating: 4.8,
      reviewCount: 1432,
      description: "Stunning series of cascading lakes in vibrant turquoise and emerald colors.",
      tags: ["Lakes", "Waterfalls", "Hiking"],
      trending: false,
      seasonal: false,
      collection: "European Treasures",
      hiddenGem: true
    },
    {
      id: 6,
      name: "Autumn in Arashiyama",
      location: "Kyoto, Japan",
      category: "Seasonal",
      image: "/placeholder.svg?height=600&width=800",
      rating: 4.7,
      reviewCount: 876,
      description: "Bamboo forest and temples surrounded by spectacular autumn foliage.",
      tags: ["Autumn", "Forest", "Temples"],
      trending: false,
      seasonal: true,
      collection: "Asian Wonders",
      hiddenGem: false
    },
    {
      id: 7,
      name: "Salento Coffee Region",
      location: "Colombia",
      category: "Cultural",
      image: "/placeholder.svg?height=600&width=800",
      rating: 4.6,
      reviewCount: 543,
      description: "Picturesque coffee plantations with opportunities to learn about coffee production.",
      tags: ["Coffee", "Countryside", "Culture"],
      trending: false,
      seasonal: false,
      collection: "South American Journeys",
      hiddenGem: true
    },
    {
      id: 8,
      name: "Northern Lights",
      location: "Tromsø, Norway",
      category: "Natural Phenomenon",
      image: "/placeholder.svg?height=600&width=800",
      rating: 4.9,
      reviewCount: 1876,
      description: "One of the best places in the world to witness the magical aurora borealis.",
      tags: ["Aurora", "Winter", "Night Sky"],
      trending: true,
      seasonal: true,
      collection: "Natural Wonders",
      hiddenGem: false
    },
  ]
  
  const filterDestinations = (category: string) => {
    let filtered = [...destinations]
    
    // Apply category filter
    if (category === "trending") {
      filtered = filtered.filter(d => d.trending)
    } else if (category === "seasonal") {
      filtered = filtered.filter(d => d.seasonal)
    } else if (category === "hidden-gems") {
      filtered = filtered.filter(d => d.hiddenGem)
    } else if (category === "collections") {
      // Show all for collections, they'll be grouped later
    }
    
    // Apply search filter if there's a query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(query) || 
        d.location.toLowerCase().includes(query) || 
        d.description.toLowerCase().includes(query) ||
        d.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    return filtered
  }
  
  // Group destinations by collection
  const getCollectionGroups = () => {
    const collections: Record<string, typeof destinations> = {}
    
    destinations.forEach(destination => {
      if (!collections[destination.collection]) {
        collections[destination.collection] = []
      }
      collections[destination.collection].push(destination)
    })
    
    return collections
  }
  
  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      
      <main className="pt-24 pb-16">
        <section className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4 mb-8">
            <Badge className="mb-2" variant="outline">
              Explore
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              Discover amazing places
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-[800px]">
              Find your next adventure from trending destinations to hidden gems around the world
            </p>
          </div>
          
          <div className="max-w-xl mx-auto mb-12">
            <div className="relative">
              <LucideIcons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search destinations, activities, or interests..."
                className="pl-10 h-12 rounded-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => setSearchQuery("")}
                >
                  <LucideIcons.X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          <Tabs defaultValue="trending" className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-8">
              {categories.map(category => (
                <TabsTrigger key={category.id} value={category.id}>
                  <span className="flex items-center">
                    {LucideIcons[category.icon] && React.createElement(LucideIcons[category.icon], { 
                      className: `h-4 w-4 mr-2 ${category.color}`
                    })}
                    <span className="hidden sm:inline">{category.title}</span>
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {categories.map(category => (
              <TabsContent key={category.id} value={category.id}>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">{category.title}</h2>
                  <p className="text-muted-foreground">{category.description}</p>
                </div>
                
                {category.id === "collections" ? (
                  // Collections view - grouped by collection
                  Object.entries(getCollectionGroups()).map(([collectionName, collectionDestinations]) => (
                    <div key={collectionName} className="mb-12">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold">{collectionName}</h3>
                        <Button variant="outline" size="sm">
                          View All
                          <LucideIcons.ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {collectionDestinations
                          .filter(d => !searchQuery || 
                            d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            d.location.toLowerCase().includes(searchQuery.toLowerCase()))
                          .slice(0, 4)
                          .map(destination => (
                            <DestinationCard key={destination.id} destination={destination} />
                          ))}
                      </div>
                    </div>
                  ))
                ) : (
                  // Standard grid view for other categories
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filterDestinations(category.id).map(destination => (
                      <DestinationCard key={destination.id} destination={destination} />
                    ))}
                  </div>
                )}
                
                {filterDestinations(category.id).length === 0 && (
                  <div className="text-center py-12">
                    <LucideIcons.Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No destinations found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search or explore other categories
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </section>
      </main>
      
      <footer className="border-t border-border py-8 mt-12">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground mb-4 md:mb-0">
              © {new Date().getFullYear()} SabiRoad. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy Policy
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Terms of Service
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

interface DestinationCardProps {
  destination: {
    id: number
    name: string
    location: string
    category: string
    image: string
    rating: number
    reviewCount: number
    description: string
    tags: string[]
    trending?: boolean
    seasonal?: boolean
    collection?: string
    hiddenGem?: boolean
  }
}

function DestinationCard({ destination }: DestinationCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <div className="relative aspect-video overflow-hidden">
        <img
          src={destination.image || "/placeholder.svg"}
          alt={destination.name}
          className="object-cover w-full h-full transition-transform hover:scale-105 duration-500"
        />
        <div className="absolute top-3 right-3">
          <Badge className="bg-background/80 backdrop-blur-sm text-foreground border-border">
            {destination.category}
          </Badge>
        </div>
        {destination.trending && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-primary/90 text-primary-foreground border-primary/20">
              <LucideIcons.TrendingUp className="h-3 w-3 mr-1" />
              Trending
            </Badge>
          </div>
        )}
        {destination.seasonal && (
          <div className="absolute bottom-3 left-3">
            <Badge className="bg-amber-500/90 text-white border-amber-600/20">
              <LucideIcons.Calendar className="h-3 w-3 mr-1" />
              Seasonal
            </Badge>
          </div>
        )}
        {destination.hiddenGem && (
          <div className="absolute bottom-3 left-3">
            <Badge className="bg-emerald-500/90 text-white border-emerald-600/20">
              <LucideIcons.Gem className="h-3 w-3 mr-1" />
              Hidden Gem
            </Badge>
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{destination.name}</CardTitle>
          <div className="flex items-center">
            <LucideIcons.Star className="w-4 h-4 fill-amber-500 text-amber-500 mr-1" />
            <span className="text-sm font-medium">{destination.rating}</span>
            <span className="text-xs text-muted-foreground ml-1">({destination.reviewCount})</span>
          </div>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <LucideIcons.MapPin className="w-3.5 h-3.5 mr-1" />
          {destination.location}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-muted-foreground text-sm line-clamp-2">{destination.description}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {destination.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-1">
        <Button variant="ghost" size="sm">
          <LucideIcons.Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
        <Button variant="outline" size="sm">
          <LucideIcons.Plus className="h-4 w-4 mr-2" />
          Add to Trip
        </Button>
      </CardFooter>
    </Card>
  )
}
