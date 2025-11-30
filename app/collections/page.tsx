'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LoadingButton } from '@/components/ui/loading-button'
import { Folder, MapPin } from 'lucide-react'

export default function CollectionsPage() {
  const [collections, setCollections] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const token = document.cookie.split('; ').find(row => row.startsWith('token='))
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUser({ id: payload.userId })
      
      fetch(`/api/collections?userId=${payload.userId}`)
        .then(res => res.json())
        .then(data => {
          setCollections(data.collections || {})
          setLoading(false)
        })
        .catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Sign in to view collections</h2>
          <LoadingButton href="/login">Sign In</LoadingButton>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Collections</h1>
          <LoadingButton href="/">Back to Home</LoadingButton>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : Object.keys(collections).length === 0 ? (
          <div className="text-center py-12 text-stone-600">No collections yet</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(collections).map(([category, items]: [string, any]) => (
              <div key={category} className="border border-stone-200 dark:border-stone-800 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <Folder className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-semibold">{category}</h2>
                </div>
                <p className="text-stone-600 dark:text-stone-400 mb-4">{items.length} locations</p>
                <div className="space-y-2">
                  {items.slice(0, 3).map((item: any) => (
                    <Link key={item.id} href={item.url || '#'} className="flex items-center gap-2 text-sm hover:text-blue-600">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{item.title || 'Untitled'}</span>
                    </Link>
                  ))}
                </div>
                {items.length > 3 && (
                  <p className="text-xs text-stone-500 mt-3">+{items.length - 3} more</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
