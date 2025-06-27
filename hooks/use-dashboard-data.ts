"use client"

import { useState, useEffect, useCallback } from 'react'

interface DashboardStats {
  totalDetections: number
  totalLocations: number
  totalBookmarks: number
  recentDetections: number
  successRate: number
  weeklyGrowth: number
}

interface ActivityData {
  day: string
  detections: number
}

interface UseDashboardDataReturn {
  stats: DashboardStats | null
  activityData: ActivityData[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  refresh: () => Promise<void>
}

export function useDashboardData(): UseDashboardDataReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activityData, setActivityData] = useState<ActivityData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true)
        setError(null)
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

      const [statsRes, activityRes] = await Promise.all([
        fetch('/api/dashboard/stats', { signal: controller.signal }),
        fetch('/api/dashboard/activity', { signal: controller.signal })
      ])

      clearTimeout(timeoutId)

      if (!statsRes.ok || !activityRes.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const [statsData, activityData] = await Promise.all([
        statsRes.json(),
        activityRes.json()
      ])

      setStats(statsData)
      setActivityData(activityData)
      setLastUpdated(new Date())
      setError(null)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setError('Request timed out. Please try again.')
      } else {
        setError(error instanceof Error ? error.message : 'Failed to load dashboard data')
      }
      console.error('Dashboard data fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchData(true)
    }, 5 * 60 * 1000)

    // Refresh on window focus
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchData(true)
      }
    }

    document.addEventListener('visibilitychange', handleFocus)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleFocus)
    }
  }, [fetchData])

  return {
    stats,
    activityData,
    loading,
    error,
    lastUpdated,
    refresh: () => fetchData()
  }
}