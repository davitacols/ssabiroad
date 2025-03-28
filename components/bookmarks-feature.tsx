"use client"

import { useState, useEffect } from "react"
import { Heart, ArrowUpDown, Info, Trash2, FileText, MapPin, Loader2, AlertCircle, PlusCircle, LayoutDashboard, LayoutGrid, X } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ImageIcon } from 'lucide-react'

// Define a type for bookmarks
interface BookmarkType {
  id: string
  locationId: string
  name: string
  address: string
  category: string
  createdAt: string
  notes?: string
  imageUrl?: string
  collection?: string
}

export default function BookmarksFeature() {
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBookmark, setSelectedBookmark] = useState<BookmarkType | null>(null)
  const [showBookmarkDetails, setShowBookmarkDetails] = useState(false)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [sortField, setSortField] = useState<string>("createdAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [editingBookmark, setEditingBookmark] = useState<BookmarkType | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editNotes, setEditNotes] = useState<string>("")
  const [collections, setCollections] = useState<string[]>(["Favorites", "Want to Visit", "Visited", "Work", "Personal"])
  const [selectedCollection, setSelectedCollection] = useState<string>("all")
  const [showCreateCollection, setShowCreateCollection] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState<string>("")

  // Fetch bookmarks from the API
  const fetchBookmarks = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/bookmarks")

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.bookmarks) {
        setBookmarks(data.bookmarks)
      } else {
        // For demo purposes, generate some mock bookmarks
        const mockBookmarks = [
          {
            id: "1",
            locationId: "loc1",
            name: "Empire State Building",
            address: "350 Fifth Avenue, New York, NY 10118",
            category: "Landmark",
            createdAt: new Date().toISOString(),
            notes: "Visited during summer vacation 2023. Amazing views from the observation deck!",
            imageUrl: "/placeholder.svg?height=200&width=300&text=Empire%20State%20Building",
            collection: "Favorites"
          },
          {
            id: "2",
            locationId: "loc2",
            name: "Central Park",
            address: "New York, NY",
            category: "Park",
            createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
            notes: "Great place for morning jogs and picnics",
            imageUrl: "/placeholder.svg?height=200&width=300&text=Central%20Park",
            collection: "Favorites"
          },
          {
            id: "3",
            locationId: "loc3",
            name: "Statue of Liberty",
            address: "Liberty Island, New York, NY",
            category: "Landmark",
            createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
            notes: "Need to book ferry tickets in advance",
            imageUrl: "/placeholder.svg?height=200&width=300&text=Statue%20of%20Liberty",
            collection: "Want to Visit"
          },
          {
            id: "4",
            locationId: "loc4",
            name: "Brooklyn Bridge",
            address: "Brooklyn Bridge, New York, NY 10038",
            category: "Landmark",
            createdAt: new Date(Date.now() - 86400000 * 15).toISOString(), // 15 days ago
            notes: "Best at sunset for photography",
            imageUrl: "/placeholder.svg?height=200&width=300&text=Brooklyn%20Bridge",
            collection: "Visited"
          },
          {
            id: "5",
            locationId: "loc5",
            name: "Times Square",
            address: "Manhattan, NY 10036",
            category: "Point of Interest",
            createdAt: new Date(Date.now() - 86400000 * 20).toISOString(), // 20 days ago
            notes: "Very crowded but worth seeing at night with all the lights",
            imageUrl: "/placeholder.svg?height=200&width=300&text=Times%20Square",
            collection: "Visited"
          },
          {
            id: "6",
            locationId: "loc6",
            name: "Google NYC",
            address: "111 8th Ave, New York, NY 10011",
            category: "Business",
            createdAt: new Date(Date.now() - 86400000 * 25).toISOString(), // 25 days ago
            notes: "Meeting with the product team scheduled for next month",
            imageUrl: "/placeholder.svg?height=200&width=300&text=Google%20NYC",
            collection: "Work"
          }
        ]
        
        setBookmarks(mockBookmarks)
      }
    } catch (err) {
      console.error("Failed to fetch bookmarks:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch bookmarks")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch bookmarks on component mount
  useEffect(() => {
    fetchBookmarks()
  }, [])

  // Handle bookmark deletion
  const handleDeleteBookmark = async (id: string) => {
    try {
      const response = await fetch(`/api/bookmarks/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      // Remove the bookmark from the state
      setBookmarks(bookmarks.filter((bookmark) => bookmark.id !== id))
      toast({
        title: "Bookmark deleted",
        description: "The bookmark has been successfully deleted.",
      })
    } catch (err) {
      console.error("Failed to delete bookmark:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete bookmark",
        variant: "destructive",
      })
    }
  }

  // Handle bookmark edit
  const handleEditBookmark = (bookmark: BookmarkType) => {
    setEditingBookmark(bookmark)
    setEditNotes(bookmark.notes || "")
    setShowEditDialog(true)
  }

  // Save edited bookmark
  const saveEditedBookmark = async () => {
    if (!editingBookmark) return

    try {
      const response = await fetch(`/api/bookmarks/${editingBookmark.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes: editNotes,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      // Update the bookmark in the state
      setBookmarks(
        bookmarks.map((bookmark) =>
          bookmark.id === editingBookmark.id ? { ...bookmark, notes: editNotes } : bookmark
        )
      )

      setShowEditDialog(false)
      setEditingBookmark(null)

      toast({
        title: "Bookmark updated",
        description: "Your notes have been saved.",
      })
    } catch (err) {
      console.error("Failed to update bookmark:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update bookmark",
        variant: "destructive",
      })
    }
  }

  // View bookmark details
  const handleViewDetails = (bookmark: BookmarkType) => {
    setSelectedBookmark(bookmark)
    setShowBookmarkDetails(true)
  }

  // Create new collection
  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return

    setCollections([...collections, newCollectionName.trim()])
    setSelectedCollection(newCollectionName.trim())
    setShowCreateCollection(false)
    setNewCollectionName("")

    toast({
      title: "Collection created",
      description: `"${newCollectionName.trim()}" has been added to your collections.`,
    })
  }

  // Filter and sort bookmarks
  const filteredAndSortedBookmarks = bookmarks
    .filter((bookmark) => {
      // Apply category filter
      if (selectedCategory !== "all" && bookmark.category !== selectedCategory) {
        return false
      }

      // Apply collection filter
      if (selectedCollection !== "all" && bookmark.collection !== selectedCollection) {
        return false
      }

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          bookmark.name.toLowerCase().includes(query) ||
          bookmark.address.toLowerCase().includes(query) ||
          bookmark.category.toLowerCase().includes(query) ||
          (bookmark.notes && bookmark.notes.toLowerCase().includes(query))
        )
      }

      return true
    })
    .sort((a, b) => {
      // Apply sorting
      let comparison = 0

      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "category":
          comparison = a.category.localeCompare(b.category)
          break
        case "createdAt":
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

  // Toggle sort direction
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Get unique categories for filter
  const categories = ["all", ...new Set(bookmarks.map((bookmark) => bookmark.category))]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Bookmarks</h2>
          <p className="text-muted-foreground">Manage your favorite locations</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-48 md:w-64"
          />

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-36 md:w-40">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex rounded-md border border-input overflow-hidden">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-9 w-9 rounded-none ${view === "list" ? "bg-muted" : ""}`}
                    onClick={() => setView("list")}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>List View</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-9 w-9 rounded-none ${view === "grid" ? "bg-muted" : ""}`}
                    onClick={() => setView("grid")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Grid View</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Collections */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Collections</h3>
          <Button variant="ghost" size="sm" onClick={() => setShowCreateCollection(true)}>
            <PlusCircle className="h-4 w-4 mr-1" />
            New Collection
          </Button>
        </div>
        <ScrollArea orientation="horizontal" className="w-full pb-2">
          <div className="flex space-x-2 min-w-full">
            <Button
              variant={selectedCollection === "all" ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => setSelectedCollection("all")}
            >
              All Bookmarks
            </Button>
            {collections.map((collection) => (
              <Button
                key={collection}
                variant={selectedCollection === collection ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => setSelectedCollection(collection)}
              >
                {collection}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-4" />
              <h3 className="text-lg font-medium mb-2">Error Loading Bookmarks</h3>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={fetchBookmarks} className="mt-4">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredAndSortedBookmarks.length === 0 ? (
        <Card className="rounded-xl shadow-md">
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center text-center">
              <Heart className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Bookmarks Found</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory !== "all" || selectedCollection !== "all"
                  ? "No bookmarks match your search criteria. Try adjusting your filters."
                  : "You haven't saved any bookmarks yet. Use the heart icon to bookmark locations."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : view === "list" ? (
        <Card className="border border-border/40 shadow-md rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[250px]">
                  <Button variant="ghost" className="p-0 font-medium" onClick={() => toggleSort("name")}>
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" className="p-0 font-medium" onClick={() => toggleSort("category")}>
                    Category
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="hidden md:table-cell">Address</TableHead>
                <TableHead className="hidden md:table-cell">Collection</TableHead>
                <TableHead className="hidden md:table-cell">
                  <Button variant="ghost" className="p-0 font-medium" onClick={() => toggleSort("createdAt")}>
                    Date Added
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filteredAndSortedBookmarks.map((bookmark, index) => (
                  <motion.tr
                    key={bookmark.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.03 }}
                    className="group"
                  >
                    <TableCell className="font-medium">{bookmark.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{bookmark.category}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell truncate max-w-[200px]">
                      {bookmark.address}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {bookmark.collection && (
                        <Badge variant="secondary">{bookmark.collection}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(bookmark.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditBookmark(bookmark)}
                          title="Edit notes"
                          className="opacity-70 group-hover:opacity-100 transition-opacity"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(bookmark)}
                          title="View details"
                          className="opacity-70 group-hover:opacity-100 transition-opacity"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteBookmark(bookmark.id)}
                          title="Delete bookmark"
                          className="opacity-70 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedBookmarks.map((bookmark, index) => (
            <motion.div
              key={bookmark.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden h-full flex flex-col group hover:shadow-lg transition-shadow rounded-xl">
                <div className="relative h-40 bg-muted">
                  <img
                    src={bookmark.imageUrl || `/placeholder.svg?height=160&width=320&text=${encodeURIComponent(bookmark.name)}`}
                    alt={bookmark.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="font-medium text-white truncate">{bookmark.name}</h3>
                    <p className="text-xs text-white/80 truncate">{bookmark.address}</p>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 bg-black/30 hover:bg-black/50 text-white border-none opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleViewDetails(bookmark)}
                    >
                      <Info className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 bg-black/30 hover:bg-black/50 text-white border-none opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleEditBookmark(bookmark)}
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 bg-black/30 hover:bg-black/50 text-white border-none opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteBookmark(bookmark.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {bookmark.collection && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="bg-black/30 text-white">
                        {bookmark.collection}
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="flex-1 p-3">
                  <div className="flex justify-between items-center mb-2">
                    <Badge variant="outline" className="text-xs">
                      {bookmark.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(bookmark.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {bookmark.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-3 mt-2">
                      {bookmark.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Bookmark Details Dialog */}
      <Dialog open={showBookmarkDetails} onOpenChange={setShowBookmarkDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedBookmark && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedBookmark.name}
                  {selectedBookmark.collection && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedBookmark.collection}
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription>{selectedBookmark.address}</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  {selectedBookmark.imageUrl ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-lg overflow-hidden border h-48"
                    >
                      <img
                        src={selectedBookmark.imageUrl || "/placeholder.svg"}
                        alt={selectedBookmark.name}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  ) : (
                    <div className="rounded-lg overflow-hidden border h-48 bg-muted flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Category</h4>
                    <Badge variant="outline">{selectedBookmark.category}</Badge>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-1">Date Added</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedBookmark.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {selectedBookmark.notes && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Notes</h4>
                      <p className="text-sm text-muted-foreground">{selectedBookmark.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="flex flex-wrap justify-between gap-2 mt-4">
                <Button variant="outline" onClick={() => handleEditBookmark(selectedBookmark)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Edit Notes
                </Button>

                <Button variant="outline" onClick={() => handleDeleteBookmark(selectedBookmark.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Bookmark
                </Button>

                <Button asChild className="bg-primary hover:bg-primary/90">
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedBookmark.address)}`} target="_blank" rel="noopener noreferrer">
                    <MapPin className="mr-2 h-4 w-4" />
                    View on Map
                  </a>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Bookmark Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          {editingBookmark && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Bookmark</DialogTitle>
                <DialogDescription>Update your notes for {editingBookmark.name}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full min-h-[100px] p-2 rounded-md border border-input bg-background"
                    placeholder="Add your personal notes about this location..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="collection">Collection</Label>
                  <Select
                    value={editingBookmark.collection || ""}
                    onValueChange={(value) => {
                      setEditingBookmark({
                        ...editingBookmark,
                        collection: value,
                      })
                    }}
                  >
                    <SelectTrigger id="collection">
                      <SelectValue placeholder="Select a collection" />
                    </SelectTrigger>
                    <SelectContent>
                      {collections.map((collection) => (
                        <SelectItem key={collection} value={collection}>
                          {collection}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={saveEditedBookmark}>Save Changes</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Collection Dialog */}
      <Dialog open={showCreateCollection} onOpenChange={setShowCreateCollection}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
            <DialogDescription>
              Collections help you organize your bookmarks into groups.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="collection-name">Collection Name</Label>
              <Input
                id="collection-name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="e.g., Travel Wishlist, Work Places, etc."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCollection(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCollection} disabled={!newCollectionName.trim()}>
              Create Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
