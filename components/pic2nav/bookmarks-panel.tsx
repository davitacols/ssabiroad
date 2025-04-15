"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BookMarked, Star, Calendar, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface Bookmark {
  id: string
  name: string
  address: string
  category?: string
  date: string
  notes?: string
  mapUrl?: string
  location?: {
    latitude: number
    longitude: number
  }
  photos?: string[]
  rating?: number
}

export function BookmarksPanel({ onLocationSelect, className = "" }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])

  // Load bookmarks from localStorage on component mount
  useEffect(() => {
    const storedBookmarks = localStorage.getItem("bookmarks")
    if (storedBookmarks) {
      try {
        setBookmarks(JSON.parse(storedBookmarks))
      } catch (e) {
        console.error("Failed to parse stored bookmarks", e)
      }
    } else {
      // Set some demo bookmarks if none exist
      const demoBookmarks = [
        {
          id: "1",
          name: "Central Park",
          address: "New York, NY 10022",
          category: "Park",
          date: "2023-10-15",
          notes: "Beautiful in autumn",
          rating: 4.8,
          location: { latitude: 40.7812, longitude: -73.9665 },
        },
        {
          id: "2",
          name: "Empire State Building",
          address: "20 W 34th St, New York",
          category: "Landmark",
          date: "2023-09-22",
          rating: 4.7,
          location: { latitude: 40.7484, longitude: -73.9857 },
        },
      ]
      setBookmarks(demoBookmarks)
      localStorage.setItem("bookmarks", JSON.stringify(demoBookmarks))
    }
  }, [])

  const removeBookmark = (id: string) => {
    const updatedBookmarks = bookmarks.filter((bookmark) => bookmark.id !== id)
    setBookmarks(updatedBookmarks)
    localStorage.setItem("bookmarks", JSON.stringify(updatedBookmarks))
  }

  return (
    <Card className={`border border-slate-200 dark:border-slate-700 shadow-md rounded-xl overflow-hidden ${className}`}>
      <CardHeader className="pb-2 bg-slate-50 dark:bg-slate-800/50">
        <CardTitle className="text-lg flex items-center">
          <BookMarked className="mr-2 h-4 w-4 text-teal-500" />
          Bookmarks
        </CardTitle>
        <CardDescription>Your saved locations</CardDescription>
      </CardHeader>

      <CardContent className="p-3">
        {bookmarks.length > 0 ? (
          <ScrollArea className="max-h-[350px] pr-3">
            <div className="space-y-3">
              {bookmarks.map((bookmark, index) => (
                <motion.div
                  key={bookmark.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative group"
                >
                  <div className="flex-1 cursor-pointer" onClick={() => onLocationSelect(bookmark)}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{bookmark.name}</h4>
                      {bookmark.rating && (
                        <div className="flex items-center">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400 mr-0.5" />
                          <span className="text-xs">{bookmark.rating}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{bookmark.address}</p>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{bookmark.date}</span>
                      </div>

                      {bookmark.category && (
                        <Badge variant="outline" className="text-xs">
                          {bookmark.category}
                        </Badge>
                      )}
                    </div>

                    {bookmark.notes && (
                      <p className="text-xs italic text-slate-500 dark:text-slate-400 mt-2 border-t border-slate-100 dark:border-slate-700 pt-2">
                        {bookmark.notes}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => removeBookmark(bookmark.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
                    title="Remove bookmark"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="py-8 text-center">
            <BookMarked className="h-10 w-10 mx-auto text-slate-400 dark:text-slate-500 mb-3" />
            <p className="text-sm text-slate-600 dark:text-slate-300">No bookmarks yet</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Save locations to access them quickly</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

