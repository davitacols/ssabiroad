import { StatsDisplay } from "@/components/dashboard/stats-display"
import { AnalyticsOverview } from "@/components/dashboard/analytics-overview"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, Activity } from "lucide-react"

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive insights and metrics from your location recognition platform
          </p>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Platform Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnalyticsOverview />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Location Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatsDisplay />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}