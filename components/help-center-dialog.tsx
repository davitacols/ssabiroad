"use client"

import { useState } from "react"
import { HelpCircle, Home, Camera, MapPin, Heart, Map, Search, User, AlertCircle } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface HelpCenterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function HelpCenterDialog({ open, onOpenChange }: HelpCenterDialogProps) {
  const [activeTab, setActiveTab] = useState("getting-started")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Help Center
          </DialogTitle>
          <DialogDescription>
            Find answers to common questions and learn how to use Pic2Nav
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-hidden">
          <div className="md:w-64 shrink-0">
            <div className="space-y-1">
              <Button
                variant={activeTab === "getting-started" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("getting-started")}
              >
                <Home className="mr-2 h-4 w-4" />
                Getting Started
              </Button>
              <Button
                variant={activeTab === "image-recognition" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("image-recognition")}
              >
                <Camera className="mr-2 h-4 w-4" />
                Image Recognition
              </Button>
              <Button
                variant={activeTab === "locations" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("locations")}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Saved Locations
              </Button>
              <Button
                variant={activeTab === "bookmarks" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("bookmarks")}
              >
                <Heart className="mr-2 h-4 w-4" />
                Bookmarks
              </Button>
              <Button
                variant={activeTab === "map" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("map")}
              >
                <Map className="mr-2 h-4 w-4" />
                Map Features
              </Button>
              <Button
                variant={activeTab === "search" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("search")}
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
              <Button
                variant={activeTab === "account" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("account")}
              >
                <User className="mr-2 h-4 w-4" />
                Account Settings
              </Button>
              <Button
                variant={activeTab === "troubleshooting" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("troubleshooting")}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Troubleshooting
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 h-[60vh]">
            <div className="pr-4">
              {activeTab === "getting-started" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Getting Started with Pic2Nav</h2>
                  <p>
                    Welcome to Pic2Nav, the intelligent location recognition platform that helps you identify, save, and navigate to places  the intelligent location recognition platform that helps you identify, save, and navigate to places using just a photo.
                  </p>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Quick Start Guide</h3>
                    <ol className="list-decimal pl-5 space-y-2">
                      <li>
                        <strong>Identify a Location:</strong> Use the Camera Recognition feature to upload or capture a photo of any location.
                      </li>
                      <li>
                        <strong>Save Locations:</strong> Automatically save recognized locations to your database for future reference.
                      </li>
                      <li>
                        <strong>Bookmark Favorites:</strong> Add locations to your bookmarks for quick access.
                      </li>
                      <li>
                        <strong>View on Map:</strong> See all your saved locations on an interactive map.
                      </li>
                      <li>
                        <strong>Search:</strong> Find specific locations in your database using the search feature.
                      </li>
                    </ol>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Key Features</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>
                        <strong>AI-Powered Recognition:</strong> Our advanced algorithms can identify landmarks, businesses, and points of interest from your photos.
                      </li>
                      <li>
                        <strong>Detailed Information:</strong> Get comprehensive details about recognized locations, including addresses, opening hours, and more.
                      </li>
                      <li>
                        <strong>Interactive Maps:</strong> View your locations on both 2D and 3D maps for better spatial understanding.
                      </li>
                      <li>
                        <strong>Personalized Collections:</strong> Organize your bookmarks into custom collections for better management.
                      </li>
                      <li>
                        <strong>Cross-Device Sync:</strong> Access your saved locations and bookmarks from any device.
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-lg bg-muted p-4">
                    <h3 className="text-lg font-medium mb-2">Need More Help?</h3>
                    <p>
                      If you have any questions or need assistance, please contact our support team at support@pic2nav.com or use the Feedback form in the app.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "image-recognition" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Image Recognition</h2>
                  <p>
                    The Image Recognition feature is the core of Pic2Nav, allowing you to identify locations from photos.
                  </p>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">How to Use</h3>
                    <ol className="list-decimal pl-5 space-y-2">
                      <li>
                        <strong>Upload an Image:</strong> Click the "Upload Image" button to select a photo from your device.
                      </li>
                      <li>
                        <strong>Use Camera:</strong> Alternatively, click "Use Camera" to capture a photo directly with your device's camera.
                      </li>
                      <li>
                        <strong>Processing:</strong> Wait for the AI to analyze the image and identify the location.
                      </li>
                      <li>
                        <strong>Review Results:</strong> View the detailed information about the recognized location.
                      </li>
                      <li>
                        <strong>Save or Share:</strong> Choose to save the location to your database or share it with others.
                      </li>
                    </ol>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Tips for Better Recognition</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>
                        <strong>Clear Images:</strong> Ensure your photos are clear, well-lit, and focused on the location you want to identify.
                      </li>
                      <li>
                        <strong>Distinctive Features:</strong> Include distinctive architectural features or signage in your photos for better recognition.
                      </li>
                      <li>
                        <strong>Multiple Angles:</strong> If the first attempt doesn't yield accurate results, try taking photos from different angles.
                      </li>
                      <li>
                        <strong>Avoid Obstructions:</strong> Try to avoid photos with people or vehicles blocking the main subject.
                      </li>
                      <li>
                        <strong>Location Services:</strong> Enable location services on your device for more accurate results.
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-lg bg-muted p-4">
                    <h3 className="text-lg font-medium mb-2">Troubleshooting</h3>
                    <p>
                      If you're experiencing issues with the image recognition feature:
                    </p>
                    <ul className="list-disc pl-5 mt-2">
                      <li>Check your internet connection</li>
                      <li>Ensure your camera permissions are enabled</li>
                      <li>Try using a different image or angle</li>
                      <li>Update your browser or app to the latest version</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "locations" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Saved Locations</h2>
                  <p>
                    The Saved Locations feature allows you to manage all the places you've identified using Pic2Nav.
                  </p>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Managing Your Locations</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>
                        <strong>View Locations:</strong> Access all your saved locations in list or grid view.
                      </li>
                      <li>
                        <strong>Filter and Sort:</strong> Use the filter options to find specific types of locations or sort by different criteria.
                      </li>
                      <li>
                        <strong>Location Details:</strong> Click on a location to view detailed information, including address, category, and more.
                      </li>
                      <li>
                        <strong>Delete Locations:</strong> Remove locations you no longer need from your database.
                      </li>
                      <li>
                        <strong>Bookmark:</strong> Add locations to your bookmarks for quick access.
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Data Storage</h3>
                    <p>
                      All your saved locations are securely stored in our database and synchronized across your devices. Your data is private and only accessible to you.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "bookmarks" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Bookmarks</h2>
                  <p>
                    The Bookmarks feature helps you organize and quickly access your favorite locations.
                  </p>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Using Bookmarks</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>
                        <strong>Add Bookmarks:</strong> Click the heart icon on any location to add it to your bookmarks.
                      </li>
                      <li>
                        <strong>Create Collections:</strong> Organize your bookmarks into custom collections like "Favorites," "Want to Visit," or "Work."
                      </li>
                      <li>
                        <strong>Add Notes:</strong> Add personal notes to your bookmarked locations for future reference.
                      </li>
                      <li>
                        <strong>Quick Access:</strong> Access your bookmarked locations quickly from the Bookmarks tab.
                      </li>
                      <li>
                        <strong>Filter and Search:</strong> Find specific bookmarks using the search and filter options.
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Managing Collections</h3>
                    <p>
                      Collections help you organize your bookmarks into meaningful groups:
                    </p>
                    <ol className="list-decimal pl-5 space-y-2">
                      <li>Click "New Collection" to create a custom collection</li>
                      <li>Give your collection a descriptive name</li>
                      <li>Assign bookmarks to your collection when editing bookmark details</li>
                      <li>Filter your bookmarks by collection using the collection tabs</li>
                    </ol>
                  </div>
                </div>
              )}

              {activeTab === "map" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Map Features</h2>
                  <p>
                    The Map feature provides a visual representation of all your saved locations.
                  </p>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Using the Map</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>
                        <strong>View Locations:</strong> See all your saved locations plotted on an interactive map.
                      </li>
                      <li>
                        <strong>2D and 3D Views:</strong> Switch between traditional 2D maps and immersive 3D globe views.
                      </li>
                      <li>
                        <strong>Location Details:</strong> Click on map markers to view location details.
                      </li>
                      <li>
                        <strong>Navigation:</strong> Get directions to any location directly from the map.
                      </li>
                      <li>
                        <strong>Current Location:</strong> See your current position on the map for better orientation.
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Map Legend</h3>
                    <p>
                      Different types of locations are represented by different colored markers:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Blue:</strong> Landmarks</li>
                      <li><strong>Green:</strong> Businesses</li>
                      <li><strong>Purple:</strong> Points of Interest</li>
                      <li><strong>Red:</strong> Other Locations</li>
                      <li><strong>Blue Circle:</strong> Your Current Location</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "search" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Search</h2>
                  <p>
                    The Search feature allows you to quickly find specific locations in your database.
                  </p>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Using Search</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>
                        <strong>Basic Search:</strong> Enter keywords in the search bar to find matching locations.
                      </li>
                      <li>
                        <strong>Advanced Filters:</strong> Use the filter options to narrow down results by category, confidence level, or date.
                      </li>
                      <li>
                        <strong>Sort Results:</strong> Sort search results by relevance, date, name, or confidence level.
                      </li>
                      <li>
                        <strong>Recent Searches:</strong> Quickly access your recent search queries.
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Search Tips</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Use specific keywords for more accurate results</li>
                      <li>Try searching by location name, address, or category</li>
                      <li>Use filters to narrow down large result sets</li>
                      <li>Clear recent searches by clicking the "Clear" button</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "account" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Account Settings</h2>
                  <p>
                    Manage your Pic2Nav account settings and preferences.
                  </p>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Profile Management</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>
                        <strong>Update Profile:</strong> Edit your username, email, and other account information.
                      </li>
                      <li>
                        <strong>Change Password:</strong> Update your password for security.
                      </li>
                      <li>
                        <strong>Notification Settings:</strong> Manage your notification preferences.
                      </li>
                      <li>
                        <strong>Privacy Settings:</strong> Control who can see your saved locations and activity.
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Subscription Plans</h3>
                    <p>
                      Pic2Nav offers different subscription plans to suit your needs:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Free Plan:</strong> Basic features with limited storage</li>
                      <li><strong>Premium Plan:</strong> Advanced features and increased storage</li>
                      <li><strong>Professional Plan:</strong> Full access to all features and unlimited storage</li>
                    </ul>
                    <p className="mt-2">
                      Upgrade your plan at any time from the Account Settings page.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "troubleshooting" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Troubleshooting</h2>
                  <p>
                    Find solutions to common issues you might encounter while using Pic2Nav.
                  </p>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Common Issues</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium">Image Recognition Not Working</h4>
                        <ul className="list-disc pl-5">
                          <li>Check your internet connection</li>
                          <li>Ensure the image is clear and well-lit</li>
                          <li>Try a different angle or closer shot</li>
                          <li>Verify camera permissions are enabled</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium">Location Not Saving</h4>
                        <ul className="list-disc pl-5">
                          <li>Check if you're logged in to your account</li>
                          <li>Ensure you have sufficient storage in your plan</li>
                          <li>Verify the "Save to database" option is enabled</li>
                          <li>Try refreshing the page and trying again</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium">Map Not Loading</h4>
                        <ul className="list-disc pl-5">
                          <li>Check your internet connection</li>
                          <li>Ensure location services are enabled on your device</li>
                          <li>Try switching between 2D and 3D views</li>
                          <li>Refresh the page or restart the app</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium">Account Issues</h4>
                        <ul className="list-disc pl-5">
                          <li>Clear browser cache and cookies</li>
                          <li>Try resetting your password</li>
                          <li>Ensure your email address is verified</li>
                          <li>Contact support if issues persist</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted p-4">
                    <h3 className="text-lg font-medium mb-2">Contact Support</h3>
                    <p>
                      If you're still experiencing issues, please contact our support team:
                    </p>
                    <ul className="list-disc pl-5 mt-2">
                      <li>Email: support@pic2nav.com</li>
                      <li>Phone: 1-800-PIC-2NAV</li>
                      <li>Live Chat: Available in the app during business hours</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
