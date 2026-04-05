"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Activity,
  ArrowRight,
  BookOpen,
  Braces,
  Copy,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface RawApiKey {
  id: string
  name: string
  key: string
  createdAt: string
  lastUsed?: string | null
  requests: number
  limit: number
}

interface ApiKeyView {
  id: string
  name: string
  key: string
  createdLabel: string
  lastUsedLabel: string
  requests: number
  limit: number
}

type Language = "curl" | "javascript" | "python"
type BannerState = {
  type: "success" | "error" | "info"
  message: string
} | null

const API_ENDPOINT = "https://pic2nav.com/api/location-recognition-v2"

const codeSnippets: Record<Language, { label: string; code: string }> = {
  curl: {
    label: "cURL",
    code: `curl -X POST ${API_ENDPOINT} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "image=@photo.jpg"`,
  },
  javascript: {
    label: "JavaScript",
    code: `const formData = new FormData();
formData.append("image", file);

const response = await fetch("${API_ENDPOINT}", {
  method: "POST",
  headers: {
    Authorization: "Bearer YOUR_API_KEY",
  },
  body: formData,
});

const data = await response.json();`,
  },
  python: {
    label: "Python",
    code: `import requests

headers = {"Authorization": "Bearer YOUR_API_KEY"}
files = {"image": open("photo.jpg", "rb")}

response = requests.post(
    "${API_ENDPOINT}",
    headers=headers,
    files=files,
)

data = response.json()`,
  },
}

const docLinks = [
  {
    title: "API reference",
    description: "Endpoints, payload shape, and response fields.",
    href: "/api-doc",
  },
  {
    title: "Authentication",
    description: "How keys are issued and how to secure requests.",
    href: "/docs",
  },
  {
    title: "Research context",
    description: "Read how the product and geolocation stack fit together.",
    href: "/research",
  },
]

function decodeJwtUserId(token: string): string | null {
  try {
    const payload = token.split(".")[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=")
    const decoded = JSON.parse(atob(padded))
    return decoded.userId ?? null
  } catch {
    return null
  }
}

function getUserIdFromCookie(): string | null {
  if (typeof document === "undefined") return null
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1]
  if (!token) return null
  return decodeJwtUserId(token)
}

function formatApiKey(apiKey: RawApiKey): ApiKeyView {
  return {
    id: apiKey.id,
    name: apiKey.name,
    key: apiKey.key,
    createdLabel: new Date(apiKey.createdAt).toLocaleDateString(),
    lastUsedLabel: apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleString() : "Never",
    requests: apiKey.requests,
    limit: apiKey.limit,
  }
}

function maskApiKey(key: string) {
  if (key.length <= 16) return key
  return `${key.slice(0, 10)}••••••••••${key.slice(-6)}`
}

export default function ApiAccessPage() {
  const [apiKeys, setApiKeys] = useState<ApiKeyView[]>([])
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({})
  const [newKeyName, setNewKeyName] = useState("")
  const [activeLanguage, setActiveLanguage] = useState<Language>("curl")
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [banner, setBanner] = useState<BannerState>(null)

  const totalRequests = useMemo(
    () => apiKeys.reduce((sum, apiKey) => sum + apiKey.requests, 0),
    [apiKeys]
  )

  const totalCapacity = useMemo(
    () => apiKeys.reduce((sum, apiKey) => sum + apiKey.limit, 0),
    [apiKeys]
  )

  const usageRate = useMemo(() => {
    if (!totalCapacity) return 0
    return Math.min(100, (totalRequests / totalCapacity) * 100)
  }, [totalCapacity, totalRequests])

  useEffect(() => {
    const userId = getUserIdFromCookie()
    if (!userId) {
      window.location.assign("/login")
      return
    }

    void fetchApiKeys(userId)
  }, [])

  async function fetchApiKeys(userId: string) {
    setIsLoading(true)
    setBanner(null)

    try {
      const response = await fetch("/api/api-keys", {
        headers: { "x-user-id": userId },
      })

      if (response.status === 404) {
        setBanner({ type: "error", message: "User account was not found. Please sign up first." })
        window.location.assign("/signup")
        return
      }

      if (!response.ok) {
        setBanner({ type: "error", message: "Failed to load API keys." })
        return
      }

      const data: RawApiKey[] = await response.json()
      setApiKeys(data.map(formatApiKey))
    } catch {
      setBanner({ type: "error", message: "Unable to load API keys right now." })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreateApiKey() {
    const trimmedName = newKeyName.trim()
    if (!trimmedName) {
      setBanner({ type: "error", message: "Enter a name before creating a key." })
      return
    }

    const userId = getUserIdFromCookie()
    if (!userId) {
      window.location.assign("/login")
      return
    }

    setIsCreating(true)
    setBanner(null)

    try {
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ name: trimmedName }),
      })

      if (response.status === 404) {
        setBanner({ type: "error", message: "User account was not found. Please sign up first." })
        window.location.assign("/signup")
        return
      }

      const payload = await response.json()

      if (!response.ok) {
        setBanner({ type: "error", message: payload.error || "Failed to create API key." })
        return
      }

      setBanner({ type: "success", message: `API key "${trimmedName}" created.` })
      setNewKeyName("")
      await fetchApiKeys(userId)
    } catch {
      setBanner({ type: "error", message: "Unable to create API key right now." })
    } finally {
      setIsCreating(false)
    }
  }

  async function handleDeleteApiKey(id: string) {
    const confirmed = window.confirm("Delete this API key?")
    if (!confirmed) return

    const userId = getUserIdFromCookie()
    if (!userId) {
      window.location.assign("/login")
      return
    }

    setPendingDeleteId(id)
    setBanner(null)

    try {
      const response = await fetch(`/api/api-keys?id=${id}`, {
        method: "DELETE",
        headers: { "x-user-id": userId },
      })

      if (!response.ok) {
        setBanner({ type: "error", message: "Failed to delete API key." })
        return
      }

      setBanner({ type: "success", message: "API key deleted." })
      await fetchApiKeys(userId)
    } catch {
      setBanner({ type: "error", message: "Unable to delete API key right now." })
    } finally {
      setPendingDeleteId(null)
    }
  }

  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      setBanner({ type: "success", message: `${label} copied to clipboard.` })
    } catch {
      setBanner({ type: "error", message: `Couldn't copy ${label.toLowerCase()}.` })
    }
  }

  return (
    <div className="min-h-screen bg-[#fbfbf8]" style={{ color: "#0f172a" }}>
      <nav className="sticky top-0 z-50 border-b border-slate-900/8 bg-[#fbfbf8]/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-10 w-auto sm:h-11" />
            <div className="hidden sm:block">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-700">Pic2Nav</p>
              <p className="text-sm font-medium text-slate-950">API Access</p>
            </div>
          </Link>

          <div className="hidden items-center gap-8 text-sm text-slate-700 lg:flex">
            <Link href="/research" className="font-medium transition hover:text-slate-950">
              Research
            </Link>
            <Link href="/api-doc" className="font-medium transition hover:text-slate-950">
              Docs
            </Link>
            <Link href="/blog" className="font-medium transition hover:text-slate-950">
              Publications
            </Link>
          </div>

          <Button
            variant="outline"
            className="rounded-full !border-slate-900 !bg-white px-4 !text-slate-950 hover:!bg-slate-900 hover:!text-white"
            asChild
          >
            <Link href="/camera">Open demo</Link>
          </Button>
        </div>
      </nav>

      <main>
        <section className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
          <div className="grid gap-10 lg:grid-cols-[1.04fr_0.96fr]">
            <div className="max-w-3xl rounded-[2rem] border border-slate-900/8 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-8">
              <p className="text-xs uppercase tracking-[0.32em] text-slate-700">Developer access</p>
              <h1
                className="mt-6 text-balance text-5xl font-semibold leading-[0.95] tracking-[-0.04em] sm:text-6xl lg:text-7xl"
                style={{ color: "#020617" }}
              >
                Use Pic2Nav as an API, not just as a demo.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
                Generate and manage API keys, inspect usage, and integrate the photo geolocation
                pipeline into your own applications with a clean request flow and current docs.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button
                  className="group rounded-full !bg-slate-950 px-6 py-6 text-base !text-white hover:!bg-slate-800"
                  asChild
                >
                  <Link href="/api-doc">
                    Read the docs
                    <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full !border-slate-400 !bg-white px-6 py-6 text-base !text-slate-950 hover:!border-slate-900 hover:!bg-slate-50"
                  asChild
                >
                  <Link href="/camera">Test the live workflow</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-900/8 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-8">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-700">Usage snapshot</p>
              <h2 className="mt-3 text-3xl font-medium tracking-[-0.03em] text-slate-950">
                Built for product teams, internal tools, and research workflows.
              </h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.4rem] border border-slate-900/8 bg-[#fcfcfa] p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-900/10 text-slate-900">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-slate-950">{apiKeys.length}</p>
                      <p className="text-sm text-slate-700">active API keys</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-[1.4rem] border border-slate-900/8 bg-[#fcfcfa] p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-900/10 text-slate-900">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-slate-950">{totalRequests.toLocaleString()}</p>
                      <p className="text-sm text-slate-700">total requests</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-[1.4rem] border border-slate-900/8 bg-[#fcfcfa] p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-900/10 text-slate-900">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-slate-950">
                        {totalCapacity ? totalCapacity.toLocaleString() : "10,000"}
                      </p>
                      <p className="text-sm text-slate-700">combined monthly capacity</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-[1.4rem] border border-slate-900/8 bg-[#fcfcfa] p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-900/10 text-slate-900">
                      <Database className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-slate-950">{usageRate.toFixed(0)}%</p>
                      <p className="text-sm text-slate-700">current usage rate</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[1.4rem] border border-slate-900/8 bg-[#fcfcfa] p-5">
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span>Capacity in use</span>
                  <span>{usageRate.toFixed(1)}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-slate-950"
                    style={{ width: `${Math.max(usageRate, apiKeys.length ? 2 : 0)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-900/8 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
            {banner ? (
              <div
                className={`mb-8 rounded-[1.4rem] border px-5 py-4 text-sm ${
                  banner.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : banner.type === "error"
                      ? "border-red-200 bg-red-50 text-red-900"
                      : "border-slate-200 bg-slate-50 text-slate-900"
                }`}
              >
                {banner.message}
              </div>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
              <div className="rounded-[1.9rem] border border-slate-900/8 bg-[#fcfcfa] p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-slate-700">API keys</p>
                    <h2 className="mt-3 text-3xl font-medium tracking-[-0.03em] text-slate-950">
                      Manage authentication and usage.
                    </h2>
                    <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700">
                      Create separate keys for production, staging, or experiments. Keys are shown
                      once here and can be copied directly into your environment.
                    </p>
                  </div>
                  <div className="hidden h-11 w-11 items-center justify-center rounded-full border border-slate-900/10 text-slate-900 sm:flex">
                    <LockKeyhole className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Input
                    placeholder="New key name, for example Production"
                    value={newKeyName}
                    onChange={(event) => setNewKeyName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !isCreating) {
                        void handleCreateApiKey()
                      }
                    }}
                    disabled={isCreating}
                    className="h-12 rounded-full !border-slate-300 !bg-white px-4 !text-slate-950 placeholder:!text-slate-500"
                  />
                  <Button
                    onClick={() => void handleCreateApiKey()}
                    disabled={isCreating}
                    className="rounded-full !bg-slate-950 px-5 !text-white hover:!bg-slate-800"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {isCreating ? "Creating..." : "Create key"}
                  </Button>
                </div>

                <div className="mt-8 space-y-4">
                  {isLoading ? (
                    <div className="rounded-[1.5rem] border border-slate-900/8 bg-white p-6 text-sm text-slate-700">
                      Loading your API keys...
                    </div>
                  ) : apiKeys.length > 0 ? (
                    apiKeys.map((apiKey) => {
                      const usagePercent = Math.min(100, (apiKey.requests / apiKey.limit) * 100)

                      return (
                        <div key={apiKey.id} className="rounded-[1.5rem] border border-slate-900/8 bg-white p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-lg font-medium text-slate-950">{apiKey.name}</p>
                              <p className="mt-1 text-sm text-slate-700">Created {apiKey.createdLabel}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => void handleDeleteApiKey(apiKey.id)}
                              disabled={pendingDeleteId === apiKey.id}
                              className="rounded-full !border-slate-300 !bg-white !text-slate-950 hover:!bg-slate-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                            <code className="flex-1 overflow-x-auto rounded-[1rem] border border-slate-900/8 bg-[#f7f7f4] px-4 py-3 text-sm text-slate-900">
                              {visibleKeys[apiKey.id] ? apiKey.key : maskApiKey(apiKey.key)}
                            </code>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() =>
                                  setVisibleKeys((current) => ({
                                    ...current,
                                    [apiKey.id]: !current[apiKey.id],
                                  }))
                                }
                                className="rounded-full !border-slate-300 !bg-white !text-slate-950 hover:!bg-slate-50"
                              >
                                {visibleKeys[apiKey.id] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => void copyToClipboard(apiKey.key, "API key")}
                                className="rounded-full !border-slate-300 !bg-white !text-slate-950 hover:!bg-slate-50"
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Copy
                              </Button>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-col gap-2 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
                            <span>Last used: {apiKey.lastUsedLabel}</span>
                            <span className="font-medium text-slate-950">
                              {apiKey.requests.toLocaleString()} / {apiKey.limit.toLocaleString()}
                            </span>
                          </div>

                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-slate-950"
                              style={{ width: `${Math.max(usagePercent, apiKey.requests ? 2 : 0)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-8 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-slate-900/10 text-slate-900">
                        <KeyRound className="h-5 w-5" />
                      </div>
                      <p className="mt-4 text-lg font-medium text-slate-950">No API keys yet</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        Create your first key to authenticate requests from your app, scripts, or
                        internal tools.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[1.9rem] border border-slate-900/8 bg-white p-6 sm:p-8">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-700">Quick start</p>
                  <h2 className="mt-3 text-3xl font-medium tracking-[-0.03em] text-slate-950">
                    Send an image and receive a structured geolocation result.
                  </h2>

                  <div className="mt-6 rounded-[1.3rem] border border-slate-900/8 bg-[#fcfcfa] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-700">Endpoint</p>
                    <code className="mt-2 block overflow-x-auto text-sm text-slate-900">
                      {API_ENDPOINT}
                    </code>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {(Object.keys(codeSnippets) as Language[]).map((language) => (
                      <button
                        key={language}
                        type="button"
                        onClick={() => setActiveLanguage(language)}
                        className={`rounded-full px-4 py-2 text-sm transition ${
                          activeLanguage === language
                            ? "bg-slate-950 text-white"
                            : "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        {codeSnippets[language].label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-slate-900/8 bg-slate-950">
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-slate-200">
                        <Braces className="h-4 w-4" />
                        {codeSnippets[activeLanguage].label}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => void copyToClipboard(codeSnippets[activeLanguage].code, `${codeSnippets[activeLanguage].label} snippet`)}
                        className="rounded-full !border-white/20 !bg-white/5 !text-white hover:!bg-white hover:!text-slate-950"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                    <pre className="overflow-x-auto px-4 py-4 text-sm leading-7 text-slate-100">
                      <code>{codeSnippets[activeLanguage].code}</code>
                    </pre>
                  </div>
                </div>

                <div className="rounded-[1.9rem] border border-slate-900/8 bg-white p-6 sm:p-8">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-700">Documentation</p>
                  <div className="mt-5 space-y-3">
                    {docLinks.map((link) => (
                      <Link
                        key={link.title}
                        href={link.href}
                        className="block rounded-[1.3rem] border border-slate-900/8 bg-[#fcfcfa] p-4 transition hover:border-slate-900/18"
                      >
                        <p className="text-base font-medium text-slate-950">{link.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">{link.description}</p>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.9rem] border border-slate-900/8 bg-[#fcfcfa] p-6 sm:p-8">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-700">What you get</p>
                  <div className="mt-5 space-y-4">
                    <div className="flex gap-3">
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
                        <MapPinned className="h-4 w-4" />
                      </div>
                      <p className="text-sm leading-7 text-slate-700">
                        The same production route used in the product demo: direct signals first,
                        then retrieval, reasoning, and route-level validation.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <p className="text-sm leading-7 text-slate-700">
                        Confidence-aware output designed to fail closed when the evidence is too weak.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <p className="text-sm leading-7 text-slate-700">
                        A research-backed system surface, not just a thin wrapper around one model call.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
