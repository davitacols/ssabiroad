"use client"

import React from "react"
import Link from "next/link"
import * as LucideIcons from "lucide-react"
import { AppNavbar } from "@/components/app-navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AboutPage() {
  const teamMembers = [
    {
      name: "Alex Johnson",
      role: "Founder & CEO",
      bio: "Former Google engineer with a passion for travel and technology. Founded SabiRoad to transform how people explore and understand the world.",
      avatar: "/placeholder.svg?height=300&width=300",
      social: {
        twitter: "#",
        linkedin: "#",
        github: "#"
      }
    },
    {
      name: "Sarah Chen",
      role: "Chief Technology Officer",
      bio: "AI and computer vision expert with a PhD from MIT. Leads the development of SabiRoad's visual recognition and augmented reality technologies.",
      avatar: "/placeholder.svg?height=300&width=300",
      social: {
        twitter: "#",
        linkedin: "#",
        github: "#"
      }
    },
    {
      name: "Miguel Rodriguez",
      role: "Head of Product",
      bio: "Former product leader at Airbnb with extensive experience in travel tech. Passionate about creating intuitive and delightful user experiences.",
      avatar: "/placeholder.svg?height=300&width=300",
      social: {
        twitter: "#",
        linkedin: "#",
        github: "#"
      }
    },
    {
      name: "Priya Sharma",
      role: "Chief Content Officer",
      bio: "Award-winning travel writer and former National Geographic editor. Oversees SabiRoad's vast database of location information and cultural insights.",
      avatar: "/placeholder.svg?height=300&width=300",
      social: {
        twitter: "#",
        linkedin: "#",
        github: "#"
      }
    },
    {
      name: "David Kim",
      role: "VP of Partnerships",
      bio: "Experienced business development executive who has forged partnerships with leading travel and technology companies worldwide.",
      avatar: "/placeholder.svg?height=300&width=300",
      social: {
        twitter: "#",
        linkedin: "#",
        github: "#"
      }
    },
    {
      name: "Emma Wilson",
      role: "Head of Design",
      bio: "Award-winning UX/UI designer with a background in both digital and physical product design. Leads SabiRoad's design language and user experience.",
      avatar: "/placeholder.svg?height=300&width=300",
      social: {
        twitter: "#",
        linkedin: "#",
        github: "#"
      }
    }
  ]
  
  const investors = [
    {
      name: "Horizon Ventures",
      logo: "/placeholder.svg?height=80&width=200",
      type: "Lead Investor"
    },
    {
      name: "Global Innovation Fund",
      logo: "/placeholder.svg?height=80&width=200",
      type: "Series A"
    },
    {
      name: "Tech Pioneers Capital",
      logo: "/placeholder.svg?height=80&width=200",
      type: "Series A"
    },
    {
      name: "Future Travel Fund",
      logo: "/placeholder.svg?height=80&width=200",
      type: "Seed Round"
    }
  ]
  
  const milestones = [
    {
      year: 2022,
      quarter: "Q1",
      title: "Company Founded",
      description: "SabiRoad was founded with a mission to transform how people explore and understand the world."
    },
    {
      year: 2022,
      quarter: "Q3",
      title: "Seed Funding",
      description: "$3.5M seed round led by Future Travel Fund to develop the initial prototype."
    },
    {
      year: 2023,
      quarter: "Q1",
      title: "Beta Launch",
      description: "First beta version released to 5,000 early adopters with basic location recognition features."
    },
    {
      year: 2023,
      quarter: "Q3",
      title: "Series A Funding",
      description: "$12M Series A round led by Horizon Ventures to scale the platform and expand the team."
    },
    {
      year: 2024,
      quarter: "Q1",
      title: "Public Launch",
      description: "Official public launch with comprehensive features including AR exploration and visual recognition."
    },
    {
      year: 2024,
      quarter: "Q4",
      title: "1 Million Users",
      description: "Reached the milestone of 1 million active users across 150 countries."
    },
    {
      year: 2025,
      quarter: "Q1",
      title: "Enterprise Solutions",
      description: "Launched enterprise solutions for tourism boards, travel companies, and educational institutions."
    }
  ]
  
  const values = [
    {
      icon: "Globe",
      title: "Global Perspective",
      description: "We embrace diversity and celebrate cultural differences, ensuring our platform respects and accurately represents all communities."
    },
    {
      icon: "Lightbulb",
      title: "Continuous Innovation",
      description: "We constantly push the boundaries of what's possible, combining cutting-edge technology with creative thinking."
    },
    {
      icon: "Shield",
      title: "Trust & Accuracy",
      description: "We're committed to providing reliable, fact-checked information that users can trust for their explorations."
    },
    {
      icon: "Heart",
      title: "Passion for Exploration",
      description: "We believe in the transformative power of discovery and aim to inspire curiosity about the world around us."
    },
    {
      icon: "Users",
      title: "Community First",
      description: "We value the insights and contributions of our global community of explorers and local experts."
    },
    {
      icon: "Leaf",
      title: "Sustainable Travel",
      description: "We promote responsible exploration that respects local communities and minimizes environmental impact."
    }
  ]
  
  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container px-4 md:px-6 mb-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4" variant="outline">
                About Us
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
                Transforming how the world is explored
              </h1>
              <p className="text-muted-foreground text-lg mb-6">
                SabiRoad combines AI, AR, and community knowledge to create a revolutionary platform for discovering and understanding places around the world.
              </p>
              <p className="text-muted-foreground mb-8">
                Founded in 2022, we've grown from a small team with a big vision to a global community of explorers, technologists, and content creators united by a passion for discovery.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg">
                  <LucideIcons.Users className="mr-2 h-5 w-5" />
                  Join Our Team
                </Button>
                <Button variant="outline" size="lg">
                  <LucideIcons.Mail className="mr-2 h-5 w-5" />
                  Contact Us
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -z-10 top-1/3 left-1/3 w-2/3 h-2/3 bg-primary/10 rounded-full blur-3xl"></div>
              <img 
                src="/placeholder.svg?height=600&width=600&text=Team+Photo" 
                alt="SabiRoad Team" 
                className="rounded-xl border border-border shadow-xl"
              />
            </div>
          </div>
        </section>
        
        {/* Mission & Vision */}
        <section className="bg-muted/30 py-20 border-y border-border">
          <div className="container px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="bg-card p-8 rounded-xl border border-border">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <LucideIcons.Target className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                <p className="text-muted-foreground">
                  To empower people to explore and understand the world around them through innovative technology and community knowledge, making every place accessible, comprehensible, and meaningful.
                </p>
              </div>
              <div className="bg-card p-8 rounded-xl border border-border">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <LucideIcons.Eye className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
                <p className="text-muted-foreground">
                  A world where anyone can meaningfully connect with any place on Earth, breaking down barriers of language, knowledge, and accessibility to foster greater understanding and appreciation of our shared planet.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Our Values */}
        <section className="container px-4 md:px-6 py-20">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="outline">
              Our Values
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Principles that guide us
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              These core values shape our culture, inform our decisions, and drive our mission forward
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    {LucideIcons[value.icon] && React.createElement(LucideIcons[value.icon], { 
                      className: "h-6 w-6 text-primary"
                    })}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        
        {/* Our Journey */}
        <section className="bg-muted/30 py-20 border-y border-border">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <Badge className="mb-4" variant="outline">
                Our Journey
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Milestones along the way
              </h2>
              <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                From idea to global platform, our journey has been defined by innovation and growth
              </p>
            </div>
            
            <div className="relative max-w-4xl mx-auto">
              {/* Timeline line */}
              <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-border"></div>
              
              {/* Timeline events */}
              <div className="space-y-12">
                {milestones.map((milestone, index) => (
                  <div 
                    key={index} 
                    className={`relative flex flex-col md:flex-row gap-8 ${
                      index % 2 === 0 ? 'md:flex-row-reverse' : ''
                    }`}
                  >
                    <div className="md:w-1/2 flex md:justify-end">
                      <div className={`bg-card p-6 rounded-lg border border-border shadow-sm max-w-md ${
                        index % 2 === 0 ? 'md:text-right' : ''
                      }`}>
                        <div className={`flex items-center mb-2 ${
                          index % 2 === 0 ? 'md:justify-end' : ''
                        }`}>
                          <Badge variant="outline" className="text-xs">
                            {milestone.year} {milestone.quarter}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{milestone.title}</h3>
                        <p className="text-muted-foreground">{milestone.description}</p>
                      </div>
                    </div>
                    
                    {/* Timeline dot */}
                    <div className="absolute left-4 md:left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-primary/10 border-4 border-background flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    </div>
                    
                    <div className="md:w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* Team Section */}
        <section className="container px-4 md:px-6 py-20">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="outline">
              Our Team
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Meet the people behind SabiRoad
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              A diverse team of technologists, travel enthusiasts, and creative thinkers united by a shared mission
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member) => (
              <div key={member.name} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={member.avatar || "/placeholder.svg"} 
                    alt={member.name} 
                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold">{member.name}</h3>
                  <p className="text-primary mb-3">{member.role}</p>
                  <p className="text-muted-foreground text-sm mb-4">{member.bio}</p>
                  <div className="flex space-x-3">
                    <Link href={member.social.twitter} className="text-muted-foreground hover:text-foreground">
                      <LucideIcons.Twitter className="h-5 w-5" />
                    </Link>
                    <Link href={member.social.linkedin} className="text-muted-foreground hover:text-foreground">
                      <LucideIcons.Linkedin className="h-5 w-5" />
                    </Link>
                    <Link href={member.social.github} className="text-muted-foreground hover:text-foreground">
                      <LucideIcons.Github className="h-5 w-5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Want to join our team? We're always looking for talented individuals.
            </p>
            <Button size="lg">
              <LucideIcons.Briefcase className="mr-2 h-5 w-5" />
              View Open Positions
            </Button>
          </div>
        </section>
        
        {/* Investors */}
        <section className="bg-muted/30 py-20 border-y border-border">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <Badge className="mb-4" variant="outline">
                Our Investors
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Backed by the best
              </h2>
              <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                We're proud to be supported by leading investors who believe in our vision
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {investors.map((investor) => (
                <div key={investor.name} className="bg-card border border-border rounded-xl p-6 text-center">
                  <div className="h-20 flex items-center justify-center mb-4">
                    <img 
                      src={investor.logo || "/placeholder.svg"} 
                      alt={investor.name} 
                      className="max-h-full"
                    />
                  </div>
                  <h3 className="font-medium">{investor.name}</h3>
                  <p className="text-sm text-muted-foreground">{investor.type}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Contact CTA */}
        <section className="container px-4 md:px-6 py-20">
          <div className="max-w-4xl mx-auto bg-card border border-border rounded-xl p-8 md:p-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Get in touch with us</h2>
                <p className="text-muted-foreground mb-6">
                  Have questions, partnership inquiries, or just want to say hello? We'd love to hear from you.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <LucideIcons.Mail className="h-5 w-5 text-primary mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Email Us</h3>
                      <p className="text-sm text-muted-foreground">hello@sabiroad.com</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <LucideIcons.MapPin className="h-5 w-5 text-primary mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Visit Us</h3>
                      <p className="text-sm text-muted-foreground">123 Innovation Way, San Francisco, CA 94107</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <LucideIcons.Phone className="h-5 w-5 text-primary mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Call Us</h3>
                      <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg">
                <Tabs defaultValue="contact" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="contact">Contact</TabsTrigger>
                    <TabsTrigger value="support">Support</TabsTrigger>
                  </TabsList>
                  <TabsContent value="contact" className="space-y-4 pt-4">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <label htmlFor="name" className="text-sm font-medium">
                          Name
                        </label>
                        <input
                          id="name"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Your name"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor="email" className="text-sm font-medium">
                          Email
                        </label>
                        <input
                          id="email"
                          type="email"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Your email"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor="message" className="text-sm font-medium">
                          Message
                        </label>
                        <textarea
                          id="message"
                          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Your message"
                        />
                      </div>
                    </div>
                    <Button className="w-full">
                      <LucideIcons.Send className="mr-2 h-4 w-4" />
                      Send Message
                    </Button>
                  </TabsContent>
                  <TabsContent value="support" className="space-y-4 pt-4">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <label htmlFor="email-support" className="text-sm font-medium">
                          Email
                        </label>
                        <input
                          id="email-support"
                          type="email"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Your email"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor="issue" className="text-sm font-medium">
                          Issue Type
                        </label>
                        <select
                          id="issue"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select an issue</option>
                          <option value="account">Account Issue</option>
                          <option value="technical">Technical Problem</option>
                          <option value="billing">Billing Question</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor="support-message" className="text-sm font-medium">
                          Details
                        </label>
                        <textarea
                          id="support-message"
                          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Describe your issue"
                        />
                      </div>
                    </div>
                    <Button className="w-full">
                      <LucideIcons.LifeBuoy className="mr-2 h-4 w-4" />
                      Submit Support Request
                    </Button>
                  </TabsContent>
                </Tabs>
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
                Terms of Service
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Accessibility
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}