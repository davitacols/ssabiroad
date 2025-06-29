import { StatsDisplay } from "@/components/dashboard/stats-display"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Detailed insights into your location recognition activity
          </p>
        </div>
        
        <StatsDisplay />
        
        <Card>
          <CardHeader>
            <CardTitle>Usage Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Most Active Times</h3>
                <p className="text-sm text-muted-foreground">Peak usage typically occurs during business hours</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Recognition Accuracy</h3>
                <p className="text-sm text-muted-foreground">V2 GPS Enhanced mode shows higher accuracy rates</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}