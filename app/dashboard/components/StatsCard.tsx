"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LucideIcon } from "lucide-react"

interface StatsCardProps {
  label: string
  value: string
  icon: LucideIcon
  color: string
  bgColor: string
  change: string
  changeColor: string
  loading?: boolean
}

export function StatsCard({ 
  label, 
  value, 
  icon: Icon, 
  color, 
  bgColor, 
  change, 
  changeColor,
  loading = false 
}: StatsCardProps) {
  if (loading) {
    return (
      <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
            <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
            <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{value}</p>
            <div className="flex items-center gap-1 mt-2">
              <Badge variant="secondary" className={`text-xs ${changeColor} bg-transparent border-0 px-0`}>
                {change} this week
              </Badge>
            </div>
          </div>
          <div className={`h-12 w-12 rounded-xl ${bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}