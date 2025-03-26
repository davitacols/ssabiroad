"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Briefcase,
  Link,
  Edit,
  Camera,
  Save,
  X,
  Shield,
  Key,
  Loader2,
  Heart,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"

interface UserProfile {
  id: string
  username: string
  email: string
  fullName: string
  bio: string
  location: string
  website: string
  occupation: string
  joinDate: string
  avatarUrl: string
  plan: string
  stats: {
    locations: number
    bookmarks: number
    scans: number
  }
  recentActivity: {
    type: string
    description: string
    date: string
    icon: string
  }[]
}

export function ProfileComponent() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
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

        // Transform API response to match our UserProfile structure
        const userProfile: UserProfile = {
          id: userData.id || "user123",
          username: userData.username || "explorer42",
          email: userData.email || "explorer@example.com",
          fullName: userData.fullName || userData.name || userData.username || "",
          bio: userData.bio || "No bio available",
          location: userData.location || "Not specified",
          website: userData.website || "",
          occupation: userData.occupation || "Not specified",
          joinDate: userData.joinDate || userData.createdAt || new Date().toISOString(),
          avatarUrl: userData.avatarUrl || userData.avatar || "",
          plan: userData.plan || "Free",
          stats: {
            locations: userData.stats?.locations || 0,
            bookmarks: userData.stats?.bookmarks || 0,
            scans: userData.stats?.scans || 0,
          },
          recentActivity: userData.recentActivity || [
            {
              type: "location",
              description: "Joined Pic2Nav",
              date: userData.joinDate || userData.createdAt || new Date().toISOString(),
              icon: "User",
            },
          ],
        }

        setProfile(userProfile)
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing
      setIsEditing(false)
      setEditedProfile({})
    } else {
      // Start editing with current profile data
      setIsEditing(true)
      setEditedProfile({
        fullName: profile?.fullName || "",
        bio: profile?.bio || "",
        location: profile?.location || "",
        website: profile?.website || "",
        occupation: profile?.occupation || "",
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditedProfile((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)

      // Get the JWT token from localStorage
      const token = localStorage.getItem("token")

      if (!token) {
        throw new Error("No authentication token found")
      }

      // In a real app, this would be an API call to update the profile
      const response = await fetch("/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editedProfile),
      })

      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.status}`)
      }

      // Update local state with edited values
      setProfile((prev) => {
        if (!prev) return null
        return {
          ...prev,
          ...editedProfile,
        }
      })

      setIsEditing(false)

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      })
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      setUploadProgress(0)

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval)
            return 95
          }
          return prev + 5
        })
      }, 100)

      // In a real app, this would be an API call to upload the avatar
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setUploadProgress(100)

      // Create a temporary URL for the uploaded file
      const avatarUrl = URL.createObjectURL(file)

      // Update profile with new avatar URL
      setProfile((prev) => {
        if (!prev) return null
        return {
          ...prev,
          avatarUrl,
        }
      })

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully",
      })
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    )
  }

  const getActivityIcon = (iconName: string) => {
    switch (iconName) {
      case "MapPin":
        return <MapPin className="h-4 w-4" />
      case "Heart":
        return <Heart className="h-4 w-4" />
      case "Camera":
        return <Camera className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            <span className="bg-gradient-to-r from-cyan-500 to-teal-500 text-transparent bg-clip-text">My Profile</span>
          </h1>
          <p className="text-muted-foreground mt-1">Manage your personal information and account settings</p>
        </div>

        <Button
          onClick={handleEditToggle}
          variant={isEditing ? "outline" : "default"}
          className={
            isEditing ? "" : "bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
          }
        >
          {isEditing ? (
            <>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-background">
                    <AvatarImage src={profile.avatarUrl} alt={profile.username} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white">
                      {profile.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  {isEditing && (
                    <div className="absolute -bottom-2 -right-2">
                      <div className="relative">
                        <Button
                          size="icon"
                          variant="default"
                          className="h-8 w-8 rounded-full bg-primary"
                          onClick={() => document.getElementById("avatar-upload")?.click()}
                          disabled={isUploading}
                        >
                          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                        </Button>
                        <input
                          id="avatar-upload"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          disabled={isUploading}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl font-bold">{profile.fullName}</h2>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      @{profile.username}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {profile.plan} Plan
                    </Badge>
                  </div>
                  {!isEditing && <p className="text-muted-foreground text-sm mt-2">{profile.bio}</p>}
                </div>
              </div>
            </CardHeader>

            {isUploading && (
              <div className="px-6">
                <Progress value={uploadProgress} className="h-1" />
                <p className="text-xs text-muted-foreground mt-1 text-center">Uploading profile picture...</p>
              </div>
            )}

            <CardContent className="space-y-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={editedProfile.fullName || ""}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        name="location"
                        value={editedProfile.location || ""}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="occupation">Occupation</Label>
                      <Input
                        id="occupation"
                        name="occupation"
                        value={editedProfile.occupation || ""}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        name="website"
                        value={editedProfile.website || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={editedProfile.bio || ""}
                      onChange={handleInputChange}
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveProfile}
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
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Username:</span>
                        <span className="text-sm font-medium">{profile.username}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Email:</span>
                        <span className="text-sm font-medium">{profile.email}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Joined:</span>
                        <span className="text-sm font-medium">{new Date(profile.joinDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Location:</span>
                        <span className="text-sm font-medium">{profile.location}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Occupation:</span>
                        <span className="text-sm font-medium">{profile.occupation}</span>
                      </div>

                      {profile.website && (
                        <div className="flex items-center gap-2">
                          <Link className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Website:</span>
                          <a
                            href={profile.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            {profile.website.replace(/^https?:\/\//, "")}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-4">Stats</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-cyan-500" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Locations</p>
                            <p className="text-xl font-bold">{profile.stats.locations}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                            <Heart className="h-5 w-5 text-red-500" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Bookmarks</p>
                            <p className="text-xl font-bold">{profile.stats.bookmarks}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                            <Camera className="h-5 w-5 text-green-500" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Scans</p>
                            <p className="text-xl font-bold">{profile.stats.scans}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent actions and interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {profile.recentActivity.map((activity, index) => (
                  <div key={index} className="relative pl-6 pb-8 last:pb-0">
                    <div className="absolute left-0 top-0 h-full w-[1px] bg-border">
                      <div className="absolute top-0 left-[-4px] h-2 w-2 rounded-full bg-primary"></div>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-1 rounded-md bg-primary/10">{getActivityIcon(activity.icon)}</div>
                        <span className="font-medium">{activity.description}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                View All Activity
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Manage your account details and subscription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Current Plan</h3>
                    <p className="text-sm text-muted-foreground">You are currently on the {profile.plan} plan</p>
                  </div>
                  <Button variant="outline">Upgrade Plan</Button>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-2">Account Security</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Password</span>
                      </div>
                      <Button variant="outline" size="sm">
                        Change Password
                      </Button>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Two-Factor Authentication</span>
                      </div>
                      <Button variant="outline" size="sm">
                        Enable
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-2">Danger Zone</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-medium">Delete Account</h4>
                        <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
                      </div>
                      <Button variant="destructive" size="sm">
                        Delete Account
                      </Button>
                    </div>
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

