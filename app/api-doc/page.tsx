import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  Braces,
  Database,
  KeyRound,
  MapPinned,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const endpoint = "https://pic2nav.com/api/location-recognition-v2"

const requestChecklist = [
  "Send a multipart form request with the image file in the `image` field.",
  "Authenticate with `Authorization: Bearer YOUR_API_KEY`.",
  "Expect confidence-aware output rather than guaranteed guesses.",
]

const requestFields = [
  { name: "image", type: "file", required: "Required", description: "Image to analyze for visible location evidence." },
  { name: "latitude", type: "number", required: "Optional", description: "Explicit latitude hint when the client already has coordinates." },
  { name: "longitude", type: "number", required: "Optional", description: "Explicit longitude hint paired with latitude." },
  { name: "analyzeLandmarks", type: "boolean", required: "Optional", description: "Request deeper landmark enrichment when relevant." },
  { name: "regionHint", type: "string", required: "Optional", description: "Region hint used to bias route-side search and validation." },
]

const responseHighlights = [
  "A top-level success state and confidence score.",
  "Resolved coordinates and address context when a location is found.",
  "Method provenance such as EXIF, Navisense, Claude-assisted, or landmark search.",
  "Optional enrichment such as weather, elevation, nearby places, and device analysis.",
]

const methodNotes = [
  {
    title: "Direct evidence first",
    body: "The route prioritizes visible-address extraction, provided coordinates, and EXIF GPS before escalating to weaker inference modes.",
  },
  {
    title: "Hybrid recognition pipeline",
    body: "If direct evidence is missing, the stack can route through NaviSense ML, Claude reasoning, and Google Vision before final validation.",
  },
  {
    title: "Fail-closed behavior",
    body: "When evidence stays weak or inconsistent, the API returns a controlled failure instead of locking in a low-quality guess.",
  },
]

const codeSamples = {
  curl: `curl -X POST ${endpoint} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "image=@photo.jpg"`,
  javascript: `const formData = new FormData();
formData.append("image", file);

const response = await fetch("${endpoint}", {
  method: "POST",
  headers: {
    Authorization: "Bearer YOUR_API_KEY",
  },
  body: formData,
});

const data = await response.json();`,
  python: `import requests

headers = {"Authorization": "Bearer YOUR_API_KEY"}
files = {"image": open("photo.jpg", "rb")}

response = requests.post(
    "${endpoint}",
    headers=headers,
    files=files,
)

data = response.json()`,
  response: `{
  "success": true,
  "name": "Detected Location",
  "address": "Example address",
  "location": {
    "latitude": 51.5007,
    "longitude": -0.1246
  },
  "confidence": 0.92,
  "method": "navisense-ml",
  "recognitionId": "rec_123",
  "weather": {
    "temperature": 18.4
  }
}`,
}

export default function ApiDocPage() {
  return (
    <div className="min-h-screen bg-[#fbfbf8]" style={{ color: "#0f172a" }}>
      <nav className="sticky top-0 z-50 border-b border-slate-900/8 bg-[#fbfbf8]/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-10 w-auto sm:h-11" />
            <div className="hidden sm:block">
              <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: "#334155" }}>
                Pic2Nav
              </p>
              <p className="text-sm font-medium" style={{ color: "#020617" }}>
                API Documentation
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-8 text-sm lg:flex" style={{ color: "#334155" }}>
            <Link href="/api-access" className="font-medium transition hover:text-slate-950">
              API Access
            </Link>
            <Link href="/research" className="font-medium transition hover:text-slate-950">
              Research
            </Link>
            <Link href="/publications" className="font-medium transition hover:text-slate-950">
              Publications
            </Link>
          </div>

          <Button
            variant="outline"
            className="rounded-full !border-slate-900 !bg-white px-4 !text-slate-950 hover:!bg-slate-900 hover:!text-white"
            asChild
          >
            <Link href="/api-access">Manage keys</Link>
          </Button>
        </div>
      </nav>

      <main>
        <section className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[2rem] border border-slate-900/8 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-8">
              <p className="text-xs uppercase tracking-[0.32em]" style={{ color: "#334155" }}>
                API reference
              </p>
              <h1
                className="mt-6 text-balance text-5xl font-semibold leading-[0.95] tracking-[-0.04em] sm:text-6xl lg:text-7xl"
                style={{ color: "#020617" }}
              >
                One route, one request shape, one confidence-aware response contract.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 sm:text-xl" style={{ color: "#334155" }}>
                This page documents the live photo geolocation endpoint used across the product,
                demo, and developer surface. It is intentionally narrow: one endpoint, clear fields,
                and practical output expectations.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button
                  className="group rounded-full !bg-slate-950 px-6 py-6 text-base !text-white hover:!bg-slate-800"
                  asChild
                >
                  <Link href="/api-access">
                    Create or manage keys
                    <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full !border-slate-400 !bg-white px-6 py-6 text-base !text-slate-950 hover:!border-slate-900 hover:!bg-slate-50"
                  asChild
                >
                  <Link href="/camera">Open the live workflow</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-900/8 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-8">
              <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: "#334155" }}>
                Request summary
              </p>
              <div className="mt-5 rounded-[1.4rem] border border-slate-900/8 bg-[#fcfcfa] p-5">
                <p className="text-xs uppercase tracking-[0.22em]" style={{ color: "#334155" }}>
                  Endpoint
                </p>
                <code className="mt-2 block overflow-x-auto text-sm" style={{ color: "#020617" }}>
                  {endpoint}
                </code>
              </div>

              <div className="mt-6 space-y-4">
                {requestChecklist.map((item, index) => (
                  <div key={item} className="flex gap-4 rounded-[1.4rem] border border-slate-900/8 bg-[#fcfcfa] p-4">
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
                      {index === 0 ? <KeyRound className="h-4 w-4" /> : index === 1 ? <Braces className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                    </div>
                    <p className="text-sm leading-7" style={{ color: "#334155" }}>
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-900/8 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <div className="rounded-[1.9rem] border border-slate-900/8 bg-[#fcfcfa] p-6 sm:p-8">
                <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: "#334155" }}>
                  Request fields
                </p>
                <div className="mt-5 space-y-3">
                  {requestFields.map((field) => (
                    <div key={field.name} className="rounded-[1.2rem] border border-slate-900/8 bg-white p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="text-sm font-medium" style={{ color: "#020617" }}>
                          {field.name}
                        </code>
                        <span className="rounded-full border border-slate-300 px-2 py-1 text-xs" style={{ color: "#334155" }}>
                          {field.type}
                        </span>
                        <span className="rounded-full border border-slate-300 px-2 py-1 text-xs" style={{ color: "#334155" }}>
                          {field.required}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-7" style={{ color: "#334155" }}>
                        {field.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.9rem] border border-slate-900/8 bg-[#fcfcfa] p-6 sm:p-8">
                <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: "#334155" }}>
                  Response shape
                </p>
                <div className="mt-5 space-y-3">
                  {responseHighlights.map((item) => (
                    <div key={item} className="flex gap-3 rounded-[1.2rem] border border-slate-900/8 bg-white p-4">
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
                        <Database className="h-4 w-4" />
                      </div>
                      <p className="text-sm leading-7" style={{ color: "#334155" }}>
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.32em]" style={{ color: "#334155" }}>
              Example requests
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl" style={{ color: "#020617" }}>
              Copy a request shape that matches how the live route is actually called.
            </h2>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            {Object.entries(codeSamples).map(([label, code]) => (
              <div key={label} className="overflow-hidden rounded-[1.75rem] border border-slate-900/8 bg-white">
                <div className="border-b border-slate-900/8 px-5 py-4">
                  <p className="text-sm font-medium capitalize" style={{ color: "#020617" }}>
                    {label === "response" ? "Example response" : `${label} example`}
                  </p>
                </div>
                <pre className="overflow-x-auto bg-[#020617] px-5 py-5 text-sm leading-7 text-slate-100">
                  <code>{code}</code>
                </pre>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-900/8 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="mb-10 max-w-3xl">
              <p className="text-xs uppercase tracking-[0.32em]" style={{ color: "#334155" }}>
                Route behavior
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl" style={{ color: "#020617" }}>
                The API is a live system surface, not a thin wrapper around one model call.
              </h2>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {methodNotes.map((note) => (
                <div key={note.title} className="rounded-[1.75rem] border border-slate-900/8 bg-[#fcfcfa] p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <h3 className="mt-5 text-2xl font-medium tracking-[-0.03em]" style={{ color: "#020617" }}>
                    {note.title}
                  </h3>
                  <p className="mt-3 text-base leading-7" style={{ color: "#334155" }}>
                    {note.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
