"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Cookie, Settings, X } from "lucide-react"

interface CookiePreferences {
  essential: boolean
  functional: boolean
  analytics: boolean
  marketing: boolean
}

export function CookieConsent() {
  const [show, setShow] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    functional: false,
    analytics: false,
    marketing: false
  })

  useEffect(() => {
    setMounted(true)
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      setTimeout(() => setShow(true), 1000)
    }
  }, [])

  const acceptAll = () => {
    const allAccepted = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true
    }
    localStorage.setItem("cookie-consent", JSON.stringify(allAccepted))
    localStorage.setItem("cookie-preferences", JSON.stringify(allAccepted))
    setShow(false)
    // Initialize analytics if accepted
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'granted'
      })
    }
  }

  const acceptSelected = () => {
    localStorage.setItem("cookie-consent", JSON.stringify(preferences))
    localStorage.setItem("cookie-preferences", JSON.stringify(preferences))
    setShow(false)
    // Update analytics consent
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: preferences.analytics ? 'granted' : 'denied',
        ad_storage: preferences.marketing ? 'granted' : 'denied'
      })
    }
  }

  const declineAll = () => {
    const essentialOnly = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false
    }
    localStorage.setItem("cookie-consent", JSON.stringify(essentialOnly))
    localStorage.setItem("cookie-preferences", JSON.stringify(essentialOnly))
    setShow(false)
    // Deny analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied'
      })
    }
  }

  const updatePreference = (key: keyof CookiePreferences, value: boolean) => {
    if (key === 'essential') return // Essential cookies cannot be disabled
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  if (!mounted || !show) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {!showSettings ? (
          <div className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <Cookie className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-stone-900 dark:text-white mb-2">We value your privacy</h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
                  We use cookies to enhance your experience, analyze site usage, and assist in our marketing efforts. 
                  You can customize your preferences or accept all cookies.
                </p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <Button 
                onClick={acceptAll} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Accept All Cookies
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowSettings(true)}
                  className="flex-1"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Customize
                </Button>
                <Button 
                  variant="outline" 
                  onClick={declineAll}
                  className="flex-1"
                >
                  Decline All
                </Button>
              </div>
            </div>
            
            <div className="text-xs text-stone-500 dark:text-stone-400 space-y-1">
              <p>
                Read our{" "}
                <Link href="/cookies" className="underline hover:text-stone-700 dark:hover:text-stone-300">
                  Cookie Policy
                </Link>
                {" "}and{" "}
                <Link href="/privacy" className="underline hover:text-stone-700 dark:hover:text-stone-300">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-stone-900 dark:text-white">Cookie Preferences</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowSettings(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-stone-900 dark:text-white">Essential</h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400">Required for basic site functionality</p>
                </div>
                <Switch checked={true} disabled className="opacity-50" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-stone-900 dark:text-white">Functional</h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400">Remember your preferences and settings</p>
                </div>
                <Switch 
                  checked={preferences.functional} 
                  onCheckedChange={(checked) => updatePreference('functional', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-stone-900 dark:text-white">Analytics</h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400">Help us improve our service</p>
                </div>
                <Switch 
                  checked={preferences.analytics} 
                  onCheckedChange={(checked) => updatePreference('analytics', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-stone-900 dark:text-white">Marketing</h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400">Personalized content and ads</p>
                </div>
                <Switch 
                  checked={preferences.marketing} 
                  onCheckedChange={(checked) => updatePreference('marketing', checked)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Button onClick={acceptSelected} className="w-full">
                Save Preferences
              </Button>
              <Button variant="outline" onClick={acceptAll} className="w-full">
                Accept All
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
