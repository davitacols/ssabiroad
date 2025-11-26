"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faEye, faEyeSlash, faKey, faTrash, faPlus, faCode, faBolt, faShield, faChartBar, faBook, faGauge } from '@fortawesome/free-solid-svg-icons'
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface ApiKey {
  id: string
  name: string
  key: string
  created: string
  lastUsed: string
  requests: number
  limit: number
}

export default function ApiAccessPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [showKey, setShowKey] = useState<{ [key: string]: boolean }>({})
  const [newKeyName, setNewKeyName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]
    if (!token) {
      window.location.href = '/login'
      return
    }
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    // Get user ID from JWT token
    const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]
    if (!token) return
    
    const payload = JSON.parse(atob(token.split('.')[1]))
    const res = await fetch('/api/api-keys', {
      headers: { 'x-user-id': payload.userId }
    })
    if (res.ok) {
      const keys = await res.json()
      setApiKeys(keys.map((k: any) => ({
        ...k,
        created: new Date(k.createdAt).toLocaleDateString(),
        lastUsed: k.lastUsed ? new Date(k.lastUsed).toLocaleString() : 'Never'
      })))
    }
  }

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      alert('Please enter a name')
      return
    }
    
    setIsCreating(true)
    
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]
      if (!token) {
        window.location.href = '/login'
        return
      }
      
      const payload = JSON.parse(atob(token.split('.')[1]))
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': payload.userId },
        body: JSON.stringify({ name: newKeyName })
      })
      
      if (res.ok) {
        setNewKeyName("")
        alert('API key created!')
        fetchApiKeys()
      } else if (res.status === 404) {
        alert('User not found. Please sign up first.')
        window.location.href = '/signup'
      } else {
        const data = await res.json()
        alert('Error: ' + (data.error || 'Failed to create API key'))
      }
    } catch (error) {
      alert('Error: ' + error.message)
    }
    
    setIsCreating(false)
  }

  const deleteApiKey = async (id: string) => {
    const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]
    if (!token) return
    
    const payload = JSON.parse(atob(token.split('.')[1]))
    const res = await fetch(`/api/api-keys?id=${id}`, {
      method: 'DELETE',
      headers: { 'x-user-id': payload.userId }
    })
    if (res.ok) {
      toast({ title: "API key deleted" })
      fetchApiKeys()
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Copied to clipboard" })
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-black">
      <nav className="sticky top-0 z-50 border-b border-stone-200/50 dark:border-stone-800/50 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-12 sm:h-14 md:h-16 w-auto object-contain drop-shadow-lg" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/docs" className="text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white">Docs</Link>
            <Button className="rounded-full bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 dark:text-stone-900 text-white" asChild>
              <Link href="/camera">Try Now</Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-stone-900 dark:text-white mb-2">API Reference</h1>
          <p className="text-stone-600 dark:text-stone-400">Integrate location recognition into your applications</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faBolt} className="w-5 h-5 text-stone-900 dark:text-white" />
              <div>
                <p className="text-2xl font-bold text-stone-900 dark:text-white">10K</p>
                <p className="text-xs text-stone-600 dark:text-stone-400">Requests/month</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faShield} className="w-5 h-5 text-stone-900 dark:text-white" />
              <div>
                <p className="text-2xl font-bold text-stone-900 dark:text-white">99.9%</p>
                <p className="text-xs text-stone-600 dark:text-stone-400">Uptime</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faChartBar} className="w-5 h-5 text-stone-900 dark:text-white" />
              <div>
                <p className="text-2xl font-bold text-stone-900 dark:text-white">{apiKeys.reduce((sum, k) => sum + k.requests, 0)}</p>
                <p className="text-xs text-stone-600 dark:text-stone-400">Total requests</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl">
              <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800">
                <h2 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
                  <FontAwesomeIcon icon={faKey} className="w-5 h-5" />
                  API Keys
                </h2>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">Manage your API keys for authentication</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="API key name (e.g., Production)"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isCreating && createApiKey()}
                    className="border border-stone-300 dark:border-stone-700 rounded-lg"
                    disabled={isCreating}
                  />
                  <Button 
                    onClick={createApiKey}
                    disabled={isCreating}
                    className="rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-black"
                  >
                    <FontAwesomeIcon icon={faPlus} className="w-4 h-4 mr-2" />
                    {isCreating ? 'Creating...' : 'Create'}
                  </Button>
                </div>

                <div className="space-y-3">
                  {apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="p-4 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-stone-900 dark:text-white">{apiKey.name}</h3>
                          <p className="text-xs text-stone-500 dark:text-stone-400">Created {apiKey.created}</p>
                        </div>
                        <Button onClick={() => deleteApiKey(apiKey.id)} variant="ghost" size="sm" className="text-stone-900 dark:text-white hover:bg-stone-100 dark:hover:bg-stone-800">
                          <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <code className="flex-1 px-3 py-2 bg-stone-50 dark:bg-stone-950 rounded text-sm font-mono border border-stone-300 dark:border-stone-700">
                          {showKey[apiKey.id] ? apiKey.key : '••••••••••••••••'}
                        </code>
                        <Button onClick={() => setShowKey({ ...showKey, [apiKey.id]: !showKey[apiKey.id] })} variant="outline" size="sm" className="border border-stone-300 dark:border-stone-700 rounded-lg">
                          <FontAwesomeIcon icon={showKey[apiKey.id] ? faEyeSlash : faEye} className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => copyToClipboard(apiKey.key)} variant="outline" size="sm" className="border border-stone-300 dark:border-stone-700 rounded-lg">
                          <FontAwesomeIcon icon={faCopy} className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-stone-600 dark:text-stone-400">Last used: {apiKey.lastUsed}</span>
                        <span className="text-stone-900 dark:text-white font-semibold">{apiKey.requests.toLocaleString()} / {apiKey.limit.toLocaleString()}</span>
                      </div>
                      
                      <div className="h-2 bg-stone-200 dark:bg-stone-800 rounded overflow-hidden">
                        <div className="h-full bg-stone-900 dark:bg-white" style={{ width: `${(apiKey.requests / apiKey.limit) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl">
              <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800">
                <h2 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
                  <FontAwesomeIcon icon={faCode} className="w-5 h-5" />
                  Quick Start
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-stone-900 dark:text-white">cURL</p>
                    <Button onClick={() => copyToClipboard(`curl -X POST https://pic2nav.app/api/location-recognition-v2 \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -F "image=@photo.jpg"`)} variant="ghost" size="sm" className="text-xs">
                      <FontAwesomeIcon icon={faCopy} className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <pre className="p-4 bg-stone-900 text-white dark:bg-stone-950 dark:text-white rounded-lg text-xs overflow-x-auto border border-stone-300 dark:border-stone-700 font-mono">
{`curl -X POST https://pic2nav.app/api/location-recognition-v2 \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "image=@photo.jpg"`}
                  </pre>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-stone-900 dark:text-white">JavaScript</p>
                    <Button onClick={() => copyToClipboard(`const formData = new FormData();\nformData.append('image', file);\n\nconst response = await fetch('https://pic2nav.app/api/location-recognition-v2', {\n  method: 'POST',\n  headers: { 'Authorization': 'Bearer YOUR_API_KEY' },\n  body: formData\n});\n\nconst data = await response.json();`)} variant="ghost" size="sm" className="text-xs">
                      <FontAwesomeIcon icon={faCopy} className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <pre className="p-4 bg-stone-900 text-white dark:bg-stone-950 dark:text-white rounded-lg text-xs overflow-x-auto border border-stone-300 dark:border-stone-700 font-mono">
{`const formData = new FormData();
formData.append('image', file);

const response = await fetch('https://pic2nav.app/api/location-recognition-v2', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' },
  body: formData
});

const data = await response.json();`}
                  </pre>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-stone-900 dark:text-white">Python</p>
                    <Button onClick={() => copyToClipboard(`import requests\n\nheaders = {'Authorization': 'Bearer YOUR_API_KEY'}\nfiles = {'image': open('photo.jpg', 'rb')}\n\nresponse = requests.post(\n    'https://pic2nav.app/api/location-recognition-v2',\n    headers=headers,\n    files=files\n)\n\ndata = response.json()`)} variant="ghost" size="sm" className="text-xs">
                      <FontAwesomeIcon icon={faCopy} className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <pre className="p-4 bg-stone-900 text-white dark:bg-stone-950 dark:text-white rounded-lg text-xs overflow-x-auto border border-stone-300 dark:border-stone-700 font-mono">
{`import requests

headers = {'Authorization': 'Bearer YOUR_API_KEY'}
files = {'image': open('photo.jpg', 'rb')}

response = requests.post(
    'https://pic2nav.app/api/location-recognition-v2',
    headers=headers,
    files=files
)

data = response.json()`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl">
              <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800">
                <h2 className="text-lg font-bold text-stone-900 dark:text-white">Documentation</h2>
              </div>
              <div className="p-6 space-y-2">
                <Link href="/api-doc" className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white">
                  <FontAwesomeIcon icon={faBook} className="w-4 h-4" />
                  <span className="text-sm font-medium">API Reference</span>
                </Link>
                <Link href="/docs" className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white">
                  <FontAwesomeIcon icon={faShield} className="w-4 h-4" />
                  <span className="text-sm font-medium">Authentication</span>
                </Link>
                <Link href="/docs" className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white">
                  <FontAwesomeIcon icon={faGauge} className="w-4 h-4" />
                  <span className="text-sm font-medium">Rate Limits</span>
                </Link>
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl">
              <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800">
                <h2 className="text-lg font-bold text-stone-900 dark:text-white">Need More?</h2>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">Upgrade for higher limits</p>
              </div>
              <div className="p-6">
                <ul className="space-y-2 text-sm mb-4">
                  <li className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-900 dark:bg-white" />
                    100K requests/month
                  </li>
                  <li className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-900 dark:bg-white" />
                    Priority support
                  </li>
                  <li className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-900 dark:bg-white" />
                    Custom rate limits
                  </li>
                  <li className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-900 dark:bg-white" />
                    Webhook notifications
                  </li>
                </ul>
                <Button className="w-full rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-black">
                  Upgrade Plan
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
