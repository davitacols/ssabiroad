"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Moon,
  Sun,
  Laptop,
  Save,
  Loader2,
  CheckCircle,
  Shield,
  Lock,
  Download,
  Trash2,
  AlertTriangle,
  Volume2,
  VolumeX,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { toast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

interface SettingsState {
  appearance: {
    theme: "light" | "dark" | "system"
    reducedMotion: boolean
    reducedTransparency: boolean
    highContrast: boolean
  }
  notifications: {
    newLocations: boolean
    bookmarks: boolean
    systemUpdates: boolean
    marketing: boolean
    email: boolean
    push: boolean
    sounds: boolean
    soundVolume: number
  }
  privacy: {
    locationHistory: boolean
    shareActivity: boolean
    anonymizeData: boolean
    dataRetention: "30days" | "90days" | "1year" | "forever"
  }
  language: {
    appLanguage: string
    mapLanguage: string
    units: "metric" | "imperial"
  }
  account: {
    twoFactorAuth: boolean
    sessionTimeout: "15min" | "30min" | "1hour" | "4hours" | "never"
    loginNotifications: boolean
  }
}

export function SettingsComponent() {
  const [settings, setSettings] = useState<SettingsState>({
    appearance: {
      theme: "system",
      reducedMotion: false,
      reducedTransparency: false,
      highContrast: false,
    },
    notifications: {
      newLocations: true,
      bookmarks: true,
      systemUpdates: true,
      marketing: false,
      email: true,
      push: true,
      sounds: true,
      soundVolume: 80,
    },
    privacy: {
      locationHistory: true,
      shareActivity: false,
      anonymizeData: false,
      dataRetention: "90days",
    },
    language: {
      appLanguage: "en",
      mapLanguage: "en",
      units: "metric",
    },
    account: {
      twoFactorAuth: false,
      sessionTimeout: "1hour",
      loginNotifications: true,
    },
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [isExporting, setIsExporting] = useState(false)

  const router = useRouter()

  // Fetch settings data
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true)

        // Get the JWT token from localStorage
        const token = localStorage.getItem("token")

        if (!token) {
          throw new Error("No authentication token found")
        }

        const response = await fetch("/api/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          if (response.status === 401) {
            // Token is invalid or expired, redirect to login
            router.push("/login")
            return
          }
          throw new Error(`Failed to fetch user data: ${response.status}`)
        }

        const userData = await response.json()

        // If user has settings, use them
        if (userData.settings) {
          setSettings(userData.settings)
        }

        // Check if dark mode is enabled in localStorage
        const storedTheme = localStorage.getItem("theme")
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

        if (storedTheme === "dark" || (!storedTheme && prefersDark)) {
          setSettings((prev) => ({
            ...prev,
            appearance: {
              ...prev.appearance,
              theme: "dark",
            },
          }))
        } else if (storedTheme === "light") {
          setSettings((prev) => ({
            ...prev,
            appearance: {
              ...prev.appearance,
              theme: "light",
            },
          }))
        }
      } catch (error) {
        console.error("Error fetching settings:", error)
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [router])

  const handleSettingChange = (category: keyof SettingsState, setting: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value,
      },
    }))
  }

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true)

      // Get the JWT token from localStorage
      const token = localStorage.getItem("token")

      if (!token) {
        throw new Error("No authentication token found")
      }

      // In a real app, this would be an API call to save settings
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error(`Failed to save settings: ${response.status}`)
      }

      // Apply theme changes
      if (settings.appearance.theme === "dark") {
        document.documentElement.classList.add("dark")
        localStorage.setItem("theme", "dark")
      } else if (settings.appearance.theme === "light") {
        document.documentElement.classList.remove("dark")
        localStorage.setItem("theme", "light")
      } else {
        // System preference
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        if (prefersDark) {
          document.documentElement.classList.add("dark")
        } else {
          document.documentElement.classList.remove("dark")
        }
        localStorage.removeItem("theme")
      }

      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportData = async () => {
    try {
      setIsExporting(true)
      setExportProgress(0)

      // Simulate export progress
      const interval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval)
            return 95
          }
          return prev + 5
        })
      }, 100)

      // In a real app, this would be an API call to export data
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setExportProgress(100)

      // Simulate file download
      setTimeout(() => {
        const link = document.createElement("a")
        link.href = "#"
        link.download = "user_data_export.json"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast({
          title: "Data exported",
          description: "Your data has been exported successfully",
        })

        setIsExporting(false)
        setExportProgress(0)
      }, 500)
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      })
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            <span className="bg-gradient-to-r from-cyan-500 to-teal-500 text-transparent bg-clip-text">Settings</span>
          </h1>
          <p className="text-muted-foreground mt-1">Customize your application preferences and account settings</p>
        </div>

        <Button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="grid grid-cols-5 w-full md:w-[600px]">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="language">Language</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the application looks and feels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-4">Theme</h3>
                  <RadioGroup
                    value={settings.appearance.theme}
                    onValueChange={(value) => handleSettingChange("appearance", "theme", value)}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    <div>
                      <RadioGroupItem value="light" id="theme-light" className="peer sr-only" />
                      <Label
                        htmlFor="theme-light"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <Sun className="h-6 w-6 mb-2" />
                        <span>Light</span>
                      </Label>
                    </div>

                    <div>
                      <RadioGroupItem value="dark" id="theme-dark" className="peer sr-only" />
                      <Label
                        htmlFor="theme-dark"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <Moon className="h-6 w-6 mb-2" />
                        <span>Dark</span>
                      </Label>
                    </div>

                    <div>
                      <RadioGroupItem value="system" id="theme-system" className="peer sr-only" />
                      <Label
                        htmlFor="theme-system"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <Laptop className="h-6 w-6 mb-2" />
                        <span>System</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Accessibility</h3>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="reduced-motion">Reduced Motion</Label>
                      <p className="text-sm text-muted-foreground">Minimize animations and transitions</p>
                    </div>
                    <Switch
                      id="reduced-motion"
                      checked={settings.appearance.reducedMotion}
                      onCheckedChange={(checked) => handleSettingChange("appearance", "reducedMotion", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="reduced-transparency">Reduced Transparency</Label>
                      <p className="text-sm text-muted-foreground">Reduce transparency effects</p>
                    </div>
                    <Switch
                      id="reduced-transparency"
                      checked={settings.appearance.reducedTransparency}
                      onCheckedChange={(checked) => handleSettingChange("appearance", "reducedTransparency", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="high-contrast">High Contrast</Label>
                      <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
                    </div>
                    <Switch
                      id="high-contrast"
                      checked={settings.appearance.highContrast}
                      onCheckedChange={(checked) => handleSettingChange("appearance", "highContrast", checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Configure how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Types</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="new-locations">New Locations</Label>
                      <p className="text-sm text-muted-foreground">Notify when new locations are added</p>
                    </div>
                    <Switch
                      id="new-locations"
                      checked={settings.notifications.newLocations}
                      onCheckedChange={(checked) => handleSettingChange("notifications", "newLocations", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="bookmarks">Bookmarks</Label>
                      <p className="text-sm text-muted-foreground">Notify about bookmark activity</p>
                    </div>
                    <Switch
                      id="bookmarks"
                      checked={settings.notifications.bookmarks}
                      onCheckedChange={(checked) => handleSettingChange("notifications", "bookmarks", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="system-updates">System Updates</Label>
                      <p className="text-sm text-muted-foreground">Notify about system updates and new features</p>
                    </div>
                    <Switch
                      id="system-updates"
                      checked={settings.notifications.systemUpdates}
                      onCheckedChange={(checked) => handleSettingChange("notifications", "systemUpdates", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="marketing">Marketing</Label>
                      <p className="text-sm text-muted-foreground">Receive marketing and promotional notifications</p>
                    </div>
                    <Switch
                      id="marketing"
                      checked={settings.notifications.marketing}
                      onCheckedChange={(checked) => handleSettingChange("notifications", "marketing", checked)}
                    />
                  </div>
                </div>

                <Separator />

                <h3 className="text-lg font-medium">Notification Channels</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={settings.notifications.email}
                      onCheckedChange={(checked) => handleSettingChange("notifications", "email", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={settings.notifications.push}
                      onCheckedChange={(checked) => handleSettingChange("notifications", "push", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notification-sounds">Notification Sounds</Label>
                      <p className="text-sm text-muted-foreground">Play sounds for notifications</p>
                    </div>
                    <Switch
                      id="notification-sounds"
                      checked={settings.notifications.sounds}
                      onCheckedChange={(checked) => handleSettingChange("notifications", "sounds", checked)}
                    />
                  </div>

                  {settings.notifications.sounds && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="sound-volume">Sound Volume</Label>
                        <span className="text-sm">{settings.notifications.soundVolume}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <VolumeX className="h-4 w-4 text-muted-foreground" />
                        <Slider
                          id="sound-volume"
                          value={[settings.notifications.soundVolume]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={(value) => handleSettingChange("notifications", "soundVolume", value[0])}
                          className="flex-1"
                        />
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy</CardTitle>
              <CardDescription>Manage your privacy settings and data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Privacy Settings</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="location-history">Location History</Label>
                      <p className="text-sm text-muted-foreground">
                        Save your location history for better recommendations
                      </p>
                    </div>
                    <Switch
                      id="location-history"
                      checked={settings.privacy.locationHistory}
                      onCheckedChange={(checked) => handleSettingChange("privacy", "locationHistory", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="share-activity">Share Activity</Label>
                      <p className="text-sm text-muted-foreground">Share your activity with other users</p>
                    </div>
                    <Switch
                      id="share-activity"
                      checked={settings.privacy.shareActivity}
                      onCheckedChange={(checked) => handleSettingChange("privacy", "shareActivity", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="anonymize-data">Anonymize Data</Label>
                      <p className="text-sm text-muted-foreground">Anonymize your data for analytics purposes</p>
                    </div>
                    <Switch
                      id="anonymize-data"
                      checked={settings.privacy.anonymizeData}
                      onCheckedChange={(checked) => handleSettingChange("privacy", "anonymizeData", checked)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="data-retention">Data Retention</Label>
                  <p className="text-sm text-muted-foreground mb-2">Choose how long we keep your data</p>
                  <Select
                    value={settings.privacy.dataRetention}
                    onValueChange={(value) => handleSettingChange("privacy", "dataRetention", value)}
                  >
                    <SelectTrigger id="data-retention">
                      <SelectValue placeholder="Select data retention period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30days">30 days</SelectItem>
                      <SelectItem value="90days">90 days</SelectItem>
                      <SelectItem value="1year">1 year</SelectItem>
                      <SelectItem value="forever">Forever</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Your Data</h3>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Export all your data in a portable format</p>
                    <Button variant="outline" onClick={handleExportData} disabled={isExporting}>
                      {isExporting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Export Data
                        </>
                      )}
                    </Button>

                    {isExporting && (
                      <div className="mt-2">
                        <Progress value={exportProgress} className="h-1" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {exportProgress < 100 ? "Preparing your data..." : "Download ready!"}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Delete All Data</p>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete all your data from our servers. This action cannot be undone.
                        </p>
                      </div>
                    </div>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete All Data
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="language" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Language & Region</CardTitle>
              <CardDescription>Configure language, region, and unit preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="app-language">Application Language</Label>
                  <Select
                    value={settings.language.appLanguage}
                    onValueChange={(value) => handleSettingChange("language", "appLanguage", value)}
                  >
                    <SelectTrigger id="app-language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="map-language">Map Language</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Choose the language for map labels and place names
                  </p>
                  <Select
                    value={settings.language.mapLanguage}
                    onValueChange={(value) => handleSettingChange("language", "mapLanguage", value)}
                  >
                    <SelectTrigger id="map-language">
                      <SelectValue placeholder="Select map language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                      <SelectItem value="local">Local Names</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Measurement Units</Label>
                  <p className="text-sm text-muted-foreground mb-2">Choose your preferred measurement system</p>
                  <RadioGroup
                    value={settings.language.units}
                    onValueChange={(value) => handleSettingChange("language", "units", value)}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem value="metric" id="units-metric" className="peer sr-only" />
                      <Label
                        htmlFor="units-metric"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <span className="text-lg font-medium mb-1">Metric</span>
                        <span className="text-sm text-muted-foreground">km, meters, °C</span>
                      </Label>
                    </div>

                    <div>
                      <RadioGroupItem value="imperial" id="units-imperial" className="peer sr-only" />
                      <Label
                        htmlFor="units-imperial"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <span className="text-lg font-medium mb-1">Imperial</span>
                        <span className="text-sm text-muted-foreground">miles, feet, °F</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>Manage your account security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="two-factor-auth">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {settings.account.twoFactorAuth ? <CheckCircle className="h-4 w-4 text-green-500" /> : null}
                    <Switch
                      id="two-factor-auth"
                      checked={settings.account.twoFactorAuth}
                      onCheckedChange={(checked) => handleSettingChange("account", "twoFactorAuth", checked)}
                    />
                  </div>
                </div>

                {settings.account.twoFactorAuth && (
                  <div className="ml-6 pl-6 border-l border-border">
                    <p className="text-sm mb-4">Two-factor authentication is enabled for your account.</p>
                    <Button variant="outline" size="sm">
                      <Shield className="mr-2 h-4 w-4" />
                      Manage 2FA Settings
                    </Button>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Automatically log out after a period of inactivity
                  </p>
                  <Select
                    value={settings.account.sessionTimeout}
                    onValueChange={(value) => handleSettingChange("account", "sessionTimeout", value)}
                  >
                    <SelectTrigger id="session-timeout">
                      <SelectValue placeholder="Select timeout period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15min">15 minutes</SelectItem>
                      <SelectItem value="30min">30 minutes</SelectItem>
                      <SelectItem value="1hour">1 hour</SelectItem>
                      <SelectItem value="4hours">4 hours</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="login-notifications">Login Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications for new logins to your account
                    </p>
                  </div>
                  <Switch
                    id="login-notifications"
                    checked={settings.account.loginNotifications}
                    onCheckedChange={(checked) => handleSettingChange("account", "loginNotifications", checked)}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Password</h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input id="current-password" type="password" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input id="confirm-password" type="password" />
                      </div>
                    </div>

                    <Button variant="outline">
                      <Lock className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

