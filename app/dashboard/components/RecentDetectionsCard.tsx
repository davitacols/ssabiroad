import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, ChevronRight, ListFilter } from "lucide-react";

interface Detection {
  id: number;
  building: string;
  time: string;
  confidence: number;
  imageUrl?: string;
}

interface RecentDetectionsCardProps {
  detections: Detection[];
}

export default function RecentDetectionsCard({ detections }: RecentDetectionsCardProps) {
  return (
    <Card className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg rounded-xl">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-lg font-bold">Recent Detections</CardTitle>
        <Button variant="ghost" size="icon">
          <ListFilter className="w-5 h-5" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {detections?.length > 0 ? (
            detections.map((detection) => (
              <div
                key={detection.id}
                className="flex items-center p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors cursor-pointer"
              >
                {detection.imageUrl ? (
                  <img
                    src={detection.imageUrl || "/placeholder.svg"}
                    alt={detection.building}
                    className="w-12 h-12 rounded-lg object-cover mr-3"
                  />
                ) : (
                  <Building className="w-8 h-8 text-white mr-3" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-white">{detection.building}</p>
                  <p className="text-sm text-gray-200">{detection.time}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{(detection.confidence * 100).toFixed(0)}%</span>
                  <ChevronRight className="w-5 h-5 text-gray-200" />
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-200">No recent detections</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
