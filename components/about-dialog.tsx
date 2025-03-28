"use client"

import { Info, MapPin, Camera, Heart, Map } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface AboutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            About Pic2Nav
          </DialogTitle>
          <DialogDescription>
            Learn more about our platform and mission
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold">Pic2Nav</h2>
            <p className="text-muted-foreground">Version 2.5.0</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Our Mission</h3>
            <p>
              At Pic2Nav, we're dedicated to making location discovery and navigation simpler and more intuitive. Our mission is to help people explore and navigate the world around them using just a photo, breaking down barriers to location-based information.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Key Features</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Camera className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">Image Recognition</h4>
                  <p className="text-sm text-muted-foreground">Identify any location from a photo</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">Location Management</h4>
                  <p className="text-sm text-muted-foreground">Save and organize places you've discovered</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Map className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">Interactive Maps</h4>
                  <p className="text-sm text-muted-foreground">View locations in 2D and 3D map views</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Heart className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">Bookmarks & Collections</h4>
                  <p className="text-sm text-muted-foreground">Organize favorite places into custom collections</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact Us</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">Support</h4>
                <p className="text-sm text-muted-foreground">support@pic2nav.com</p>
                <p className="text-sm text-muted-foreground">1-800-PIC-2NAV</p>
              </div>
              <div>
                <h4 className="font-medium">Headquarters</h4>
                <p className="text-sm text-muted-foreground">123 Navigation Street</p>
                <p className="text-sm text-muted-foreground">San Francisco, CA 94103</p>
              </div>
            </div>
          </div>

          <div className="pt-4 text-center text-sm text-muted-foreground">
            <p>© 2025 Pic2Nav, Inc. All rights reserved.</p>
            <div className="flex justify-center gap-4 mt-2">
              <Button variant="link" size="sm" className="h-auto p-0">Terms of Service</Button>
              <Button variant="link" size="sm" className="h-auto p-0">Privacy Policy</Button>
              <Button variant="link" size="sm" className="h-auto p-0">Licenses</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
