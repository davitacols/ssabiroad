"use client"

import React from "react"
import Link from "next/link"
import * as LucideIcons from "lucide-react"
import { AppNavbar } from "@/components/app-navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function BlogPage() {
  const featuredPosts = [
    {
      id: 1,
      title: "10 Hidden Gems in Southeast Asia You Need to Visit",
      excerpt: "Discover lesser-known destinations in Southeast Asia that offer authentic experiences away from the tourist crowds.",
      image: "/placeholder.svg?height=600&width=1200",
      date: "March 15, 2025",
      readTime: "8 min read",
      category: "Travel Guides",
      author: {
        name: "Sarah Johnson",
        avatar: "/placeholder.svg?height=40&width=40",
        role: "Travel Writer"
      },
      tags: ["Southeast Asia", "Hidden Gems", "Travel Tips"]
    },
    {
      id: 2,
      title: "How AI is Transforming the Way We Explore Cities",
      excerpt: "Artificial intelligence is revolutionizing urban exploration, from personalized recommendations to real-time translation.",
      image: "/placeholder.svg?height=600&width=1200",
      date: "March 10, 2025",
      readTime: "6 min read",
      category: "Technology",
      author: {
        name: "David Chen",
        avatar: "/placeholder.svg?height=40&width=40",
        role: "Tech Editor"
      },
      tags: ["AI", "Urban Exploration", "Technology"]
    },
    {
      id: 3,
      title: "The Art of Slow Travel: Why You Should Take Your Time",
      excerpt: "In a world of rushed itineraries, discover the benefits of slowing down and truly immersing yourself in a destination.",
      image: "/placeholder.svg?height=600&width=1200",
      date: "March 5, 2025",
      readTime: "7 min read",
      category: "Travel Philosophy",
      author: {
        name: "Maria Rodriguez",
        avatar: "/placeholder.svg?height=40&width=40",
        role: "Senior Writer"
      },
      tags: ["Slow Travel", "Mindfulness", "Cultural Immersion"]
    }
  ]
  
  const recentPosts = [
    {
      id: 4,
      title: "5 Must-Try Street Foods in Mexico City",
      excerpt: "From tacos al pastor to tlacoyos, these street food delicacies showcase the rich culinary heritage of Mexico's capital.",
      image: "/placeholder.svg?height=400&width=600",
      date: "March 3, 2025",
      readTime: "5 min read",
      category: "Food & Drink",
      author: {
        name: "Carlos Mendez",
        avatar: "/placeholder.svg?height=40&width=40",
        role: "Food Writer"
      },
      tags: ["Mexican Food", "Street Food", "Culinary Travel"]
    },
    {
      id: 5,
      title: "Sustainable Travel: How to Reduce Your Carbon Footprint",
      excerpt: "Practical tips for environmentally conscious travelers who want to explore the world while minimizing their impact.",
      image: "/placeholder.svg?height=400&width=600",
      date: "February 28, 2025",
      readTime: "9 min read",
      category: "Sustainable Travel",
      author: {
        name: "Emma Wilson",
        avatar: "/placeholder.svg?height=40&width=40",
        role: "Environmental Editor"
      },
      tags: ["Sustainability", "Eco-friendly", "Green Travel"]
    },
    {
      id: 6,
      title: "The Ultimate Guide to Travel Photography",
      excerpt: "Expert tips for capturing stunning travel photos, from equipment recommendations to composition techniques.",
      image: "/placeholder.svg?height=400&width=600",
      date: "February 25, 2025",
      readTime: "10 min read",
      category: "Photography",
      author: {
        name: "James Taylor",
        avatar: "/placeholder.svg?height=40&width=40",
        role: "Photography Expert"
      },
      tags: ["Photography", "Travel Tips", "Creative"]
    },
    {
      id: 7,
      title: "How to Plan a Multi-Country Trip in Europe",
      excerpt: "A comprehensive guide to planning a seamless journey across multiple European countries.",
      image: "/placeholder.svg?height=400&width=600",
      date: "February 20, 2025",
      readTime: "8 min read",
      category: "Travel Planning",
      author: {
        name: "Sophie Martin",
        avatar: "/placeholder.svg?height=40&width=40",
        role: "Travel Planner"
      },
      tags: ["Europe", "Trip Planning", "Itinerary"]
    },
    {
      id: 8,
      title: "The Rise of Digital Nomadism: Working While Traveling",
      excerpt: "How technology is enabling a new generation of location-independent professionals to work from anywhere in the world.",
      image: "/placeholder.svg?height=400&width=600",
      date: "February 15, 2025",
      readTime: "7 min read",
      category: "Digital Nomad",
      author: {
        name: "Alex Johnson",
        avatar: "/placeholder.svg?height=40&width=40",
        role: "Remote Work Specialist"
      },
      tags: ["Digital Nomad", "Remote Work", "Lifestyle"]
    },
    {
      id: 9,
      title: "Cultural Etiquette Around the World: Do's and Don'ts",
      excerpt: "Essential cultural etiquette tips to help you navigate social customs and avoid faux pas when traveling internationally.",
      image: "/placeholder.svg?height=400&width=600",
      date: "February 10, 2025",
      readTime: "6 min read",
      category: "Cultural Insights",
      author: {
        name: "Priya Sharma",
        avatar: "/placeholder.svg?height=40&width=40",
        role: "Cultural Writer"
      },
      tags: ["Culture", "Etiquette", "International Travel"]
    }
  ]
  
  const categories = [
    { name: "All", count: 42 },
    { name: "Travel Guides", count: 15 },
    { name: "Technology", count: 8 },
    { name: "Food & Drink", count: 10 },
    { name: "Photography", count: 7 },
    { name: "Sustainable Travel", count: 6 },
    { name: "Digital Nomad", count: 5 },
    { name: "Cultural Insights", count: 9 }
  ]
  
  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      
      <main className="pt-24 pb-16">
        <section className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4 mb-12">
            <Badge className="mb-2" variant="outline">
              Blog
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              Stories, Tips & Insights
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-[800px]">
              Discover travel inspiration, practical guides, and expert advice from our community of explorers
            </p>
          </div>
          
          {/* Featured Posts */}
          <div className="mb-16">
            <div className="grid gap-6 md:grid-cols-3">
              {featuredPosts.map((post, index) => (
                <Card key={post.id} className={`overflow-hidden ${index === 0 ? 'md:col-span-3 md:grid md:grid-cols-2 md:items-center' : ''}`}>
                  <div className={`${index === 0 ? 'md:order-2' : ''}`}>
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={post.image || "/placeholder.svg"}
                        alt={post.title}
                        className="object-cover w-full h-full transition-transform hover:scale-105 duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-background/80 backdrop-blur-sm text-foreground border-border">
                          {post.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`${index === 0 ? 'md:order-1 md:pr-6' : ''}`}>
                    <CardHeader className={`${index === 0 ? 'md:pt-0' : 'pb-2'}`}>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                        <span>{post.date}</span>
                        <span>•</span>
                        <span>{post.readTime}</span>
                      </div>
                      <CardTitle className={`${index === 0 ? 'text-3xl' : 'text-xl'}`}>
                        <Link href={`/blog/${post.id}`} className="hover:text-primary transition-colors">
                          {post.title}
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-muted-foreground ${index === 0 ? 'mb-4' : 'line-clamp-2'}`}>
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center mt-4">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={post.author.avatar} alt={post.author.name} />
                          <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{post.author.name}</p>
                          <p className="text-xs text-muted-foreground">{post.author.role}</p>
                        </div>
                      </div>
                    </CardContent>
                    {index === 0 && (
                      <CardFooter>
                        <Button variant="outline" className="mt-2">
                          Read Article
                          <LucideIcons.ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardFooter>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Categories and Search */}
          <div className="flex flex-col md:flex-row gap-6 mb-10">
            <div className="md:w-2/3">
              <div className="relative">
                <LucideIcons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search articles..."
                  className="pl-10 h-12"
                />
              </div>
            </div>
            <div className="md:w-1/3">
              <Tabs defaultValue="All" className="w-full">
                <TabsList className="w-full h-12 flex overflow-x-auto">
                  {categories.map((category) => (
                    <TabsTrigger key={category.name} value={category.name} className="flex-1 min-w-max">
                      {category.name}
                      <span className="ml-1 text-xs text-muted-foreground">({category.count})</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          {/* Recent Posts */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Recent Articles</h2>
              <Button variant="ghost" className="text-sm">
                View All
                <LucideIcons.ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recentPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden">
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={post.image || "/placeholder.svg"}
                      alt={post.title}
                      className="object-cover w-full h-full transition-transform hover:scale-105 duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-background/80 backdrop-blur-sm text-foreground border-border">
                        {post.category}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                      <span>{post.date}</span>
                      <span>•</span>
                      <span>{post.readTime}</span>
                    </div>
                    <CardTitle className="text-xl">
                      <Link href={`/blog/${post.id}`} className="hover:text-primary transition-colors">
                        {post.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center">
                      <Avatar className="h-7 w-7 mr-2">
                        <AvatarImage src={post.author.avatar} alt={post.author.name} />
                        <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{post.author.name}</p>
                        <p className="text-xs text-muted-foreground">{post.author.role}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            <div className="flex justify-center mt-10">
              <Button variant="outline" size="lg">
                Load More Articles
              </Button>
            </div>
          </div>
          
          {/* Newsletter */}
          <div className="mt-20 bg-muted/30 border border-border rounded-xl p-8 md:p-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Subscribe to our newsletter</h2>
                <p className="text-muted-foreground mb-6">
                  Get the latest travel tips, destination guides, and insights delivered straight to your inbox.
                </p>
              </div>
              <div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="h-12"
                  />
                  <Button className="h-12 whitespace-nowrap">
                    Subscribe
                    <LucideIcons.Send className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  By subscribing, you agree to our Privacy Policy and consent to receive updates from our company.
                </p>
              </div>
            </div>
          </div>
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
