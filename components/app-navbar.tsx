"use client"

import React from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import * as LucideIcons from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ModeToggle } from "@/components/mode-toggle"
import { PlacesAutocomplete } from "@/components/places-autocomplete"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function AppNavbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false) // Simulate auth state
  const searchRef = useRef<HTMLDivElement>(null)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Handle click outside search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Features menu items
  const featuresItems = [
    {
      title: "AR Exploration",
      description: "Discover places with augmented reality overlays",
      icon: "Compass",
      badge: "Popular",
    },
    {
      title: "Visual Recognition", 
      description: "Identify landmarks, architecture, and more with AI",
      icon: "Camera",
      badge: null,
    },
    {
      title: "Audio Guides",
      description: "Listen to location-based stories and insights",
      icon: "Headphones", 
      badge: "New",
    },
    {
      title: "Community Insights",
      description: "Access local recommendations and hidden gems",
      icon: "Users",
      badge: null,
    },
  ]

  // Explore menu items
  const exploreItems = [
    {
      title: "Trending Destinations",
      description: "Most popular places being explored right now",
      icon: "TrendingUp",
      color: "text-primary",
    },
    {
      title: "Curated Collections",
      description: "Handpicked destinations for every interest",
      icon: "FolderHeart",
      color: "text-pink-500 dark:text-pink-400",
    },
    {
      title: "Seasonal Experiences",
      description: "Time-limited events and activities",
      icon: "Calendar",
      color: "text-amber-500 dark:text-amber-400",
    },
    {
      title: "Off the Beaten Path",
      description: "Lesser-known locations worth discovering",
      icon: "MapPin",
      color: "text-emerald-500 dark:text-emerald-400",
    },
  ]

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
        isScrolled ? "bg-background/90 backdrop-blur-md shadow-sm border-b border-border" : "bg-transparent",
      )}
    >
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and Brand */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2 mr-4">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
              <LucideIcons.Globe className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl hidden sm:block">SabiRoad</span>
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Features</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {featuresItems.map((item) => (
                      <li key={item.title}>
                        <NavigationMenuLink asChild>
                          <Link href="#" className="flex select-none space-y-1 rounded-md hover:bg-muted p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                {LucideIcons[item.icon] &&
                                  React.createElement(LucideIcons[item.icon], {
                                    className: "h-5 w-5 text-primary",
                                  })}
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-medium leading-none">{item.title}</div>
                                  {item.badge && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] h-4 px-1 bg-primary/10 text-primary border-primary/20"
                                    >
                                      {item.badge}
                                    </Badge>
                                  )}
                                </div>
                                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger>Explore</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {exploreItems.map((item) => (
                      <li key={item.title}>
                        <NavigationMenuLink asChild>
                          <Link href="#" className="flex select-none space-y-1 rounded-md hover:bg-muted p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                                {LucideIcons[item.icon] &&
                                  React.createElement(LucideIcons[item.icon], {
                                    className: `h-5 w-5 ${item.color}`,
                                  })}
                              </div>
                              <div>
                                <div className="text-sm font-medium leading-none">{item.title}</div>
                                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="#" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>Pricing</NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="link" className="h-auto p-0 font-medium">
                      More <LucideIcons.ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuGroup>
                      <DropdownMenuItem>
                        <LucideIcons.BookOpen className="mr-2 h-4 w-4" />
                        <span>Blog</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <LucideIcons.HelpCircle className="mr-2 h-4 w-4" />
                        <span>Help Center</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <LucideIcons.Building className="mr-2 h-4 w-4" />
                        <span>About Us</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <LucideIcons.MessageSquare className="mr-2 h-4 w-4" />
                        <span>Contact</span>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right Side: Search, Theme Toggle, Auth */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Search Bar */}
          <div
            ref={searchRef}
            className={cn("relative hidden lg:block transition-all duration-300 mr-2", searchFocused ? "w-80" : "w-64")}
          >
            <div
              className={cn(
                "relative rounded-full transition-all duration-300",
                searchFocused ? "bg-background shadow-md border-primary" : "bg-muted/50 hover:bg-muted",
                isScrolled ? "border border-border" : "border border-transparent",
              )}
            >
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <LucideIcons.Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <PlacesAutocomplete
                placeholder="Discover places, landmarks..."
                className={cn(
                  "pl-10 pr-4 h-9 rounded-full bg-transparent text-sm border-0 focus-visible:ring-1 focus-visible:ring-offset-0",
                  searchFocused ? "focus-visible:ring-primary" : "focus-visible:ring-ring",
                )}
                onPlaceSelect={(place) => {
                  if (place) {
                    const encodedPlace = encodeURIComponent(place);
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedPlace}`, "_blank");
                  }
                  setSearchFocused(false);
                }}
              />

              <div className="absolute inset-0 rounded-full -z-10" onClick={() => setSearchFocused(true)}></div>
            </div>
          </div>

          {/* Mobile Search Button */}
          <Button variant="ghost" size="icon" className="lg:hidden">
            <LucideIcons.Search className="h-5 w-5" />
          </Button>

          {/* Theme Toggle */}
          <ModeToggle />

          {/* User Menu or Auth Buttons */}
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 ml-1">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                    <AvatarFallback className="text-xs">JD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">John Doe</p>
                    <p className="text-xs text-muted-foreground">john.doe@example.com</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <LucideIcons.User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <LucideIcons.Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <LucideIcons.Map className="mr-2 h-4 w-4" />
                    <span>My Trips</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <LucideIcons.Bookmark className="mr-2 h-4 w-4" />
                    <span>Saved Places</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LucideIcons.HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help & Support</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LucideIcons.LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden ml-1">
                <LucideIcons.Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-80">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                      <LucideIcons.Globe className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-lg">SabiRoad</span>
                  </div>
                  <ModeToggle />
                </div>

                {/* Mobile Search */}
                <div className="relative mb-6">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <LucideIcons.Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <PlacesAutocomplete
                    placeholder="Search destinations..."
                    className="pl-10 h-10 bg-muted/50"
                    onPlaceSelect={(place) => console.log("Mobile selected:", place)}
                  />
                </div>

                {/* Mobile Navigation */}
                <div className="space-y-6 flex-1 overflow-auto">
                  {/* Features Section */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">Features</h3>
                    <div className="space-y-1">
                      {featuresItems.map((item) => (
                        <Link
                          key={item.title}
                          href="#"
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-muted"
                        >
                          {LucideIcons[item.icon] &&
                            React.createElement(LucideIcons[item.icon], {
                              className: "h-5 w-5 text-primary",
                            })}
                          <span className="text-sm">{item.title}</span>
                          {item.badge && (
                            <Badge
                              variant="outline"
                              className="ml-auto text-[10px] h-4 px-1 bg-primary/10 text-primary border-primary/20"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Explore Section */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">Explore</h3>
                    <div className="space-y-1">
                      {exploreItems.map((item) => (
                        <Link
                          key={item.title}
                          href="/explore"
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-muted"
                        >
                          {LucideIcons[item.icon] &&
                            React.createElement(LucideIcons[item.icon], {
                              className: `h-5 w-5 ${item.color}`,
                            })}
                          <span className="text-sm">{item.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* More Links */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">More</h3>
                    <div className="space-y-1">
                      {[
                        { title: "Pricing", icon: "CreditCard" },
                        { title: "Blog", icon: "BookOpen" },
                        { title: "Help Center", icon: "HelpCircle" },
                        { title: "About Us", icon: "Building" },
                        { title: "Contact", icon: "MessageSquare" },
                      ].map((item) => (
                        <Link
                          key={item.title}
                          href="#"
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-muted"
                        >
                          {LucideIcons[item.icon] &&
                            React.createElement(LucideIcons[item.icon], {
                              className: "h-5 w-5 text-muted-foreground",
                            })}
                          <span className="text-sm">{item.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Auth Buttons */}
                <div className="pt-6 mt-auto space-y-2 border-t border-border">
                  {isLoggedIn ? (
                    <div className="flex items-center gap-3 p-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">John Doe</p>
                        <p className="text-xs text-muted-foreground">View profile</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Link href="/signup">
                        <Button className="w-full">Sign Up</Button>
                      </Link>
                      <Link href="/login">
                        <Button variant="outline" className="w-full">Sign In</Button>
                      </Link>
                    </>
                  )}
                </div>

              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}