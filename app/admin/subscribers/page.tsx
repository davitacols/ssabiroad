'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function SubscribersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/subscribers')
      .then(res => res.json())
      .then(data => {
        setUsers(data.users || [])
        setLoading(false)
      })
  }, [])

  const downloadCSV = () => {
    const csv = ['Email,Name,Subscribed Date\n', ...users.map(u => 
      `${u.email},${u.name || ''},${new Date(u.createdAt).toLocaleDateString()}`
    )].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `subscribers-${Date.now()}.csv`
    a.click()
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Newsletter Subscribers</h1>
            <p className="text-stone-600">Total: {users.length}</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={downloadCSV}>Download CSV</Button>
            <Button variant="outline" asChild><Link href="/">Home</Link></Button>
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-stone-100 dark:bg-stone-900">
                <tr>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Subscribed</th>
                  <th className="text-left p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-t">
                    <td className="p-4">{user.email}</td>
                    <td className="p-4">{user.name || '-'}</td>
                    <td className="p-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        {user.emailNotifications ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
