"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Download, Trash2, Shield, Eye, Settings } from "lucide-react"

export default function DataManagementPage() {
  const [preferences, setPreferences] = useState({
    analytics: false,
    marketing: false,
    functional: true,
    locationHistory: true,
    photoProcessing: true
  })

  const handleExportData = () => {
    alert("Data export will be sent to your email within 24 hours")
  }

  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      alert("Account deletion request submitted. You will receive a confirmation email.")
    }
  }

  const updatePreference = (key: string, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
    localStorage.setItem(`gdpr-${key}`, value.toString())
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900 dark:text-white mb-2">
            Data Management & Privacy
          </h1>
          <p className="text-stone-600 dark:text-stone-400">
            Manage your personal data and privacy preferences in accordance with GDPR
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy Preferences
              </CardTitle>
              <CardDescription>
                Control how your data is used and processed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Analytics & Performance</h4>
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    Help us improve our service by sharing usage analytics
                  </p>
                </div>
                <Switch
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => updatePreference('analytics', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Marketing Communications</h4>
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    Receive personalized content and feature updates
                  </p>
                </div>
                <Switch
                  checked={preferences.marketing}
                  onCheckedChange={(checked) => updatePreference('marketing', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Location History</h4>
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    Save your location searches for quick access
                  </p>
                </div>
                <Switch
                  checked={preferences.locationHistory}
                  onCheckedChange={(checked) => updatePreference('locationHistory', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Your Data Rights
              </CardTitle>
              <CardDescription>
                Access, export, or delete your personal data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                onClick={handleExportData}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export My Data
              </Button>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <Trash2 className="h-5 w-5" />
                Delete Account
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete My Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}