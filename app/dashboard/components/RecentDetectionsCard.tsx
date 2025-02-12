import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building, ChevronRight, ListFilter } from "lucide-react"

interface Detection {
  id: number
  building: string
  time: string
  confidence: number
  imageUrl?: string
}

interface RecentDetectionsCardProps {
  detections: Detection[]
}

export default function RecentDetectionsCard({ detections }: RecentDetectionsCardProps) {
  return (
    <Card className="bg-white/50 backdrop-blur-xl border-0 shadow-lg dark:bg-gray-900/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Detections</CardTitle>
          <Button variant="ghost" size="icon">
            <ListFilter className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {detections?.length > 0 ? (
            detections.map((detection) => (
              <div
                key={detection.id}
                className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
              >
                {detection.imageUrl ? (
                  <img
                    src={detection.imageUrl || "/placeholder.svg"}
                    alt={detection.building}
                    className="w-12 h-12 rounded-lg object-cover mr-3"
                  />
                ) : (
                  <Building className="w-8 h-8 text-blue-600 mr-3" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{detection.building}</p>
                  <p className="text-sm text-gray-500">{detection.time}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-600">{(detection.confidence * 100).toFixed(0)}%</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">No recent detections</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

