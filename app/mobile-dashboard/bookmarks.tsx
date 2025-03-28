import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Trash2, Info } from "lucide-react";

interface BookmarksFeatureProps {
  bookmarks: SavedLocation[];
  onRemoveBookmark: (id: string) => void;
}

const MobileBookmarksFeature: React.FC<BookmarksFeatureProps> = ({ bookmarks, onRemoveBookmark }) => {
  return (
    <div className="space-y-4">
      {bookmarks.length > 0 ? (
        bookmarks.map((bookmark) => (
          <Card key={bookmark.id} className="border-slate-200 dark:border-slate-700 shadow-sm rounded-xl overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-indigo-500" />
                  <div>
                    <h4 className="font-medium text-base">{bookmark.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{bookmark.address}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => onRemoveBookmark(bookmark.id)}>
                    <Trash2 className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Info className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <p className="text-slate-500 dark:text-slate-400">No bookmarks found.</p>
      )}
    </div>
  );
};

export default MobileBookmarksFeature;