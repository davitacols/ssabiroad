"use client"

import { StatsDisplay } from "./stats-display"
import { RecentLocations } from "./recent-locations"

export function DashboardOverview() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your location recognition activity
        </p>
      </div>
      
      <StatsDisplay />
      
      <RecentLocations />
    </div>
  )
}