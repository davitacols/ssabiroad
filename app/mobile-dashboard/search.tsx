import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Search } from "lucide-react";

interface SearchFeatureProps {
  locations: SavedLocation[];
}

const MobileSearchFeature: React.FC<SearchFeatureProps> = ({ locations }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLocations = locations.filter((loc) =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search locations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 rounded-xl h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
        />
      </div>

      {filteredLocations.length > 0 ? (
        filteredLocations.map((location) => (
          <Card key={location.id} className="border-slate-200 dark:border-slate-700 shadow-sm rounded-xl overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-indigo-500" />
                <div>
                  <h4 className="font-medium text-base">{location.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{location.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <p className="text-slate-500 dark:text-slate-400">No locations found.</p>
      )}
    </div>
  );
};

export default MobileSearchFeature;