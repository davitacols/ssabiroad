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
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    setApiKeys([
      {
        id: "1",
        name: "Production API",
        key: "pk_live_1234567890abcdef",
        created: "2024-01-15",
        lastUsed: "2 hours ago",
        requests: 1250,
        limit: 10000
      }
    ])
  }

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({ title: "Name required", description: "Please enter a name for your API key", variant: "destructive" })
      return
    }
    setIsCreating(true)
    setTimeout(() => {
      const newKey: ApiKey = {
        id: Date.now().toString(),
        name: newKeyName,
        key: `pk_live_${Math.random().toString(36).substring(2, 15)}`,
        created: new Date().toISOString().split('T')[0],
        lastUsed: "Never",
        requests: 0,
        limit: 10000
      }
      setApiKeys([...apiKeys, newKey])
      setNewKeyName("")
      setIsCreating(false)
      toast({ title: "API key created", description: "Your new API key has been generated" })
    }, 1000)
  }

  const deleteApiKey = (id: string) => {
    setApiKeys(apiKeys.filter(k => k.id !== id))
    toast({ title: "API key deleted" })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Copied to clipboard" })
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <nav className="sticky top-0 z-50 border-b-2 border-black dark:border-white bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-32 sm:h-40 md:h-48 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/docs" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white font-medium">Docs</Link>
            <Button className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-semibold" asChild>
              <Link href="/camera">Try Now</Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white mb-2">API Reference</h1>
          <p className="text-gray-600 dark:text-gray-400">Integrate location recognition into your applications</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-black border-2 border-black dark:border-white rounded p-4">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faBolt} className="w-5 h-5 text-black dark:text-white" />
              <div>
                <p className="text-2xl font-bold text-black dark:text-white">10K</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Requests/month</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-black border-2 border-black dark:border-white rounded p-4">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faShield} className="w-5 h-5 text-black dark:text-white" />
              <div>
                <p className="text-2xl font-bold text-black dark:text-white">99.9%</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Uptime</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-black border-2 border-black dark:border-white rounded p-4">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faChartBar} className="w-5 h-5 text-black dark:text-white" />
              <div>
                <p className="text-2xl font-bold text-black dark:text-white">{apiKeys.reduce((sum, k) => sum + k.requests, 0)}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total requests</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-black border-2 border-black dark:border-white rounded">
              <div className="px-6 py-4 border-b-2 border-black dark:border-white">
                <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                  <FontAwesomeIcon icon={faKey} className="w-5 h-5" />
                  API Keys
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage your API keys for authentication</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="API key name (e.g., Production)"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && createApiKey()}
                    className="border-2 border-black dark:border-white"
                  />
                  <Button onClick={createApiKey} disabled={isCreating} className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-semibold">
                    <FontAwesomeIcon icon={faPlus} className="w-4 h-4 mr-2" />
                    Create
                  </Button>
                </div>

                <div className="space-y-3">
                  {apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="p-4 border-2 border-black dark:border-white rounded bg-white dark:bg-black">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-black dark:text-white">{apiKey.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Created {apiKey.created}</p>
                        </div>
                        <Button onClick={() => deleteApiKey(apiKey.id)} variant="ghost" size="sm" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">
                          <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <code className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded text-sm font-mono border-2 border-black dark:border-white">
                          {showKey[apiKey.id] ? apiKey.key : '••••••••••••••••'}
                        </code>
                        <Button onClick={() => setShowKey({ ...showKey, [apiKey.id]: !showKey[apiKey.id] })} variant="outline" size="sm" className="border-2 border-black dark:border-white">
                          <FontAwesomeIcon icon={showKey[apiKey.id] ? faEyeSlash : faEye} className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => copyToClipboard(apiKey.key)} variant="outline" size="sm" className="border-2 border-black dark:border-white">
                          <FontAwesomeIcon icon={faCopy} className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Last used: {apiKey.lastUsed}</span>
                        <span className="text-black dark:text-white font-semibold">{apiKey.requests.toLocaleString()} / {apiKey.limit.toLocaleString()}</span>
                      </div>
                      
                      <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded overflow-hidden border border-black dark:border-white">
                        <div className="h-full bg-black dark:bg-white" style={{ width: `${(apiKey.requests / apiKey.limit) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-black border-2 border-black dark:border-white rounded">
              <div className="px-6 py-4 border-b-2 border-black dark:border-white">
                <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                  <FontAwesomeIcon icon={faCode} className="w-5 h-5" />
                  Quick Start
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-black dark:text-white">cURL</p>
                    <Button onClick={() => copyToClipboard(`curl -X POST https://pic2nav.app/api/location-recognition-v2 \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "image=@photo.jpg"`)} variant="ghost" size="sm" className="text-xs">
                      <FontAwesomeIcon icon={faCopy} className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <pre className="p-4 bg-black text-white dark:bg-white dark:text-black rounded text-xs overflow-x-auto border-2 border-black dark:border-white font-mono">
{`curl -X POST https://pic2nav.app/api/location-recognition-v2 \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "image=@photo.jpg"`}
                  </pre>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-black dark:text-white">JavaScript</p>
                    <Button onClick={() => copyToClipboard(`const formData = new FormData();
formData.append('image', file);

const response = await fetch('https://pic2nav.app/api/location-recognition-v2', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' },
  body: formData
});

const data = await response.json();`)} variant="ghost" size="sm" className="text-xs">
                      <FontAwesomeIcon icon={faCopy} className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <pre className="p-4 bg-black text-white dark:bg-white dark:text-black rounded text-xs overflow-x-auto border-2 border-black dark:border-white font-mono">
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
                    <p className="text-sm font-semibold text-black dark:text-white">Python</p>
                    <Button onClick={() => copyToClipboard(`import requests

headers = {'Authorization': 'Bearer YOUR_API_KEY'}
files = {'image': open('photo.jpg', 'rb')}

response = requests.post(
    'https://pic2nav.app/api/location-recognition-v2',
    headers=headers,
    files=files
)

data = response.json()`)} variant="ghost" size="sm" className="text-xs">
                      <FontAwesomeIcon icon={faCopy} className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <pre className="p-4 bg-black text-white dark:bg-white dark:text-black rounded text-xs overflow-x-auto border-2 border-black dark:border-white font-mono">
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
            <div className="bg-white dark:bg-black border-2 border-black dark:border-white rounded">
              <div className="px-6 py-4 border-b-2 border-black dark:border-white">
                <h2 className="text-lg font-bold text-black dark:text-white">Documentation</h2>
              </div>
              <div className="p-6 space-y-2">
                <Link href="/api-doc" className="flex items-center gap-3 p-3 rounded hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">
                  <FontAwesomeIcon icon={faBook} className="w-4 h-4" />
                  <span className="text-sm font-medium">API Reference</span>
                </Link>
                <Link href="/docs" className="flex items-center gap-3 p-3 rounded hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">
                  <FontAwesomeIcon icon={faShield} className="w-4 h-4" />
                  <span className="text-sm font-medium">Authentication</span>
                </Link>
                <Link href="/docs" className="flex items-center gap-3 p-3 rounded hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">
                  <FontAwesomeIcon icon={faGauge} className="w-4 h-4" />
                  <span className="text-sm font-medium">Rate Limits</span>
                </Link>
              </div>
            </div>

            <div className="bg-white dark:bg-black border-2 border-black dark:border-white rounded">
              <div className="px-6 py-4 border-b-2 border-black dark:border-white">
                <h2 className="text-lg font-bold text-black dark:text-white">Need More?</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Upgrade for higher limits</p>
              </div>
              <div className="p-6">
                <ul className="space-y-2 text-sm mb-4">
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />
                    100K requests/month
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />
                    Priority support
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />
                    Custom rate limits
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />
                    Webhook notifications
                  </li>
                </ul>
                <Button className="w-full bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-semibold">
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
