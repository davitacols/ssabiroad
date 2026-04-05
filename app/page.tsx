"use client"

import { useEffect, useState } from "react"
import Head from "next/head"
import Link from "next/link"
import { ArrowRight, BookOpen, Camera, Globe2, MapPin, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NewsletterSignup } from "@/components/newsletter-signup"
import { InteractiveGlobe } from "@/components/ui/interactive-globe"
import { seoConfig } from "@/lib/seo-config"

interface BlogPost {
  id: string | number
  slug: string
  title: string
  excerpt: string
  coverImage?: string
}

const proofPoints = [
  { value: "Hybrid stack", label: "Metadata, OCR, retrieval, and reasoning in one route" },
  { value: "Fail closed", label: "The system abstains when the evidence is weak" },
  { value: "Learning loop", label: "Corrections become future retrieval and training memory" },
]

const capabilities = [
  {
    icon: Camera,
    title: "Capture and review",
    text: "Move from upload or live camera into a single recognition workflow with confidence-aware output.",
  },
  {
    icon: Search,
    title: "Verify messy evidence",
    text: "Use visible text, landmarks, and weak scene clues without pretending every image is clean and easy.",
  },
  {
    icon: BookOpen,
    title: "Publish the system",
    text: "Keep papers, experiments, and product updates close to the actual stack instead of treating them as separate worlds.",
  },
]

const researchNotes = [
  "Direct signals such as EXIF GPS and visible addresses are prioritized before broader inference.",
  "NaviSense, Claude, and Google Vision are routed together when evidence is partial or noisy.",
  "Every accepted result is shaped by confidence gating, geographic validation, and operator review.",
]

export default function HomePage() {
  const [posts, setPosts] = useState<BlogPost[]>([])

  useEffect(() => {
    fetch("/api/blog?page=1&limit=3")
      .then((response) => response.json())
      .then((data) => setPosts(data.posts || []))
      .catch(() => setPosts([]))
  }, [])

  const structuredDataArray = [
    seoConfig.webApplicationSchema,
    seoConfig.organizationSchema,
    seoConfig.faqSchema,
  ]

  return (
    <>
      <Head>
        <link rel="canonical" href="https://pic2nav.com" />
      </Head>

      {structuredDataArray.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <div className="min-h-screen bg-[#fbfbf8]" style={{ color: "#0f172a" }}>
        <nav className="sticky top-0 z-50 border-b border-slate-900/8 bg-[#fbfbf8]/92 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <Link href="/" className="flex items-center gap-3">
              <img src="/pic2nav.png" alt="Pic2Nav" className="h-9 w-auto sm:h-10" />
              <div className="hidden sm:block">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-700">Pic2Nav</p>
                <p className="text-sm font-medium text-slate-950">Visual geolocation research platform</p>
              </div>
            </Link>

            <div className="hidden items-center gap-8 text-sm text-slate-700 lg:flex">
              <Link href="/research" className="font-medium transition hover:text-slate-950">
                Research
              </Link>
              <Link href="/blog" className="font-medium transition hover:text-slate-950">
                Publications
              </Link>
              <Link href="/datasets" className="font-medium transition hover:text-slate-950">
                Datasets
              </Link>
              <Link href="/api-access" className="font-medium transition hover:text-slate-950">
                API Access
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
          <section className="mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 sm:pb-28 sm:pt-20">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <div className="max-w-3xl rounded-[2rem] border border-slate-900/8 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-8">
                <p className="text-xs uppercase tracking-[0.32em] text-slate-700">
                  Product meets research
                </p>
                <h1
                  className="mt-6 text-balance text-5xl font-semibold leading-[0.95] tracking-[-0.04em] sm:text-6xl lg:text-7xl"
                  style={{ color: "#020617" }}
                >
                  Photo geolocation for real-world evidence.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
                  Pic2Nav is a modern geolocation stack that combines metadata recovery, OCR,
                  retrieval, validation, and feedback-driven learning to turn photographs into
                  reviewable location signals.
                </p>

                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <Button
                    className="group rounded-full !bg-slate-950 px-6 py-6 text-base !text-white hover:!bg-slate-800"
                    asChild
                  >
                    <Link href="/camera">
                      Try the demo
                      <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full !border-slate-400 !bg-white px-6 py-6 text-base !text-slate-950 hover:!border-slate-900 hover:!bg-slate-50"
                    asChild
                  >
                    <Link href="/research">Read the research</Link>
                  </Button>
                </div>

                <div className="mt-12 grid gap-6 border-t border-slate-900/10 pt-8 sm:grid-cols-3">
                  {proofPoints.map((point) => (
                    <div key={point.label}>
                      <p className="text-sm font-medium text-slate-950">{point.value}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-800">{point.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-900/10 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.05)] sm:p-6">
                <div className="flex items-center justify-between border-b border-slate-900/8 pb-4" style={{ color: "#0f172a" }}>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-slate-700">
                      Recognition surface
                    </p>
                    <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em] text-slate-950">
                      A product interface built around evidence
                    </h2>
                  </div>
                  <div className="hidden h-11 w-11 items-center justify-center rounded-full border border-slate-900/10 text-slate-900 sm:flex">
                    <Globe2 className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-900/8 bg-slate-950">
                  <div className="relative h-[300px]">
                    <InteractiveGlobe />
                    <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-[1.25rem] border border-white/10 bg-slate-950/75 p-4 text-white backdrop-blur">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-white">
                        Pipeline
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-100">
                        Direct signals are checked first. Broader reasoning only comes in when the
                        image needs it.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-900/8 p-4">
                    <p className="text-[11px] uppercase tracking-[0.26em] text-slate-700">1</p>
                    <p className="mt-2 text-sm leading-6 text-slate-800">Recover direct evidence where possible.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-900/8 p-4">
                    <p className="text-[11px] uppercase tracking-[0.26em] text-slate-700">2</p>
                    <p className="mt-2 text-sm leading-6 text-slate-800">Route through retrieval, OCR, and scene reasoning.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-900/8 p-4">
                    <p className="text-[11px] uppercase tracking-[0.26em] text-slate-700">3</p>
                    <p className="mt-2 text-sm leading-6 text-slate-800">Return only validated, reviewable location output.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="border-y border-slate-900/8 bg-white">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20" style={{ color: "#0f172a" }}>
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.32em] text-slate-700">What Pic2Nav is</p>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
                  A restrained interface for a complicated system.
                </h2>
                <p className="mt-4 text-lg leading-8 text-slate-700">
                  The product is designed to feel simple on the surface while staying honest about
                  uncertainty, validation, and messy image evidence underneath.
                </p>
              </div>

              <div className="mt-12 grid gap-5 lg:grid-cols-3">
                {capabilities.map((item) => (
                  <div key={item.title} className="rounded-[1.75rem] border border-slate-900/8 bg-[#fcfcfa] p-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-900/10 text-slate-900">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-2xl font-medium tracking-[-0.03em] text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-base leading-7 text-slate-700">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]" style={{ color: "#0f172a" }}>
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.32em] text-slate-700">Research posture</p>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
                  Built like software, written like research.
                </h2>
                <p className="mt-5 text-lg leading-8 text-slate-700">
                  Pic2Nav is not presented as a single magical model. It is a hybrid production
                  system with routing logic, confidence rules, and a feedback loop that makes the
                  stack sharper over time.
                </p>
              </div>

              <div className="space-y-4">
                {researchNotes.map((note) => (
                  <div key={note} className="flex gap-4 rounded-[1.5rem] border border-slate-900/8 bg-white p-5">
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <p className="text-base leading-7 text-slate-700">{note}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="border-t border-slate-900/8 bg-white">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24" style={{ color: "#0f172a" }}>
              <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-700">Latest publications</p>
                  <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
                    Notes from the system as it evolves.
                  </h2>
                </div>
                <Button
                  variant="outline"
                  className="w-fit rounded-full !border-slate-400 !bg-white !text-slate-950 hover:!border-slate-900 hover:!bg-slate-50"
                  asChild
                >
                  <Link href="/blog">Browse all posts</Link>
                </Button>
              </div>

              {posts.length > 0 ? (
                <div className="grid gap-5 lg:grid-cols-3">
                  {posts.map((post) => (
                    <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                      <article className="h-full overflow-hidden rounded-[1.75rem] border border-slate-900/8 bg-[#fcfcfa] transition hover:border-slate-900/18">
                        {post.coverImage && (
                          <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                            <img
                              src={post.coverImage}
                              alt={post.title}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                            />
                          </div>
                        )}
                        <div className="p-6">
                          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-700">Publication</p>
                          <h3 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-slate-950">
                            {post.title}
                          </h3>
                          <p className="mt-3 text-base leading-7 text-slate-700">{post.excerpt}</p>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.75rem] border border-slate-900/8 bg-[#fcfcfa] p-10 text-center">
                  <p className="text-lg text-slate-700">No publications are live yet.</p>
                  <Button
                    variant="outline"
                    className="mt-6 rounded-full !border-slate-400 !bg-white !text-slate-950 hover:!border-slate-900 hover:!bg-slate-50"
                    asChild
                  >
                    <Link href="/blog">View the archive</Link>
                  </Button>
                </div>
              )}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
              <div
                className="rounded-[2rem] border p-8 sm:p-10"
                style={{
                  backgroundColor: "#020617",
                  borderColor: "rgba(255,255,255,0.12)",
                  color: "#ffffff",
                }}
              >
                <p
                  className="text-xs uppercase tracking-[0.32em]"
                  style={{ color: "#ffffff" }}
                >
                  Start with the product
                </p>
                <h2
                  className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl"
                  style={{ color: "#ffffff" }}
                >
                  Open the camera workflow and test the stack on real images.
                </h2>
                <p
                  className="mt-5 max-w-2xl text-lg leading-8"
                  style={{ color: "rgba(255,255,255,0.82)" }}
                >
                  Upload, capture, or verify a location in the same interface used to connect image
                  evidence, confidence, map context, and feedback.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    className="group rounded-full px-6 py-6 text-base"
                    style={{
                      backgroundColor: "#ffffff",
                      color: "#020617",
                    }}
                    asChild
                  >
                    <Link href="/camera">
                      Open demo
                      <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full px-6 py-6 text-base"
                    style={{
                      borderColor: "rgba(255,255,255,0.72)",
                      backgroundColor: "rgba(255,255,255,0.08)",
                      color: "#ffffff",
                    }}
                    asChild
                  >
                    <Link href="/api-access">Explore API access</Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-900/8 bg-white p-8 sm:p-10">
                <p className="text-xs uppercase tracking-[0.32em] text-slate-700">Newsletter</p>
                <h3 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
                  Follow product releases and research updates.
                </h3>
                <p className="mt-4 text-base leading-7 text-slate-700">
                  Get publication links, model updates, and major system changes without having to
                  watch the repo full-time.
                </p>
                <div className="mt-6">
                  <NewsletterSignup />
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-slate-900/8 bg-white px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 md:grid-cols-4">
              <div style={{ color: "#0f172a" }}>
                <div className="flex items-center gap-3">
                  <img src="/pic2nav.png" alt="Pic2Nav" className="h-9 w-auto" />
                  <span className="text-lg font-medium text-slate-950">Pic2Nav</span>
                </div>
                <p className="mt-4 max-w-xs text-sm leading-6 text-slate-700">
                  Geospatial intelligence from photographs, designed for recognition, review, and
                  continuous refinement.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium uppercase tracking-[0.24em] text-slate-700">Product</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-700">
                  <li><Link href="/camera" className="transition hover:text-slate-950">Demo</Link></li>
                  <li><Link href="/api-access" className="transition hover:text-slate-950">API Access</Link></li>
                  <li><Link href="/datasets" className="transition hover:text-slate-950">Datasets</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium uppercase tracking-[0.24em] text-slate-700">Research</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-700">
                  <li><Link href="/blog" className="transition hover:text-slate-950">Publications</Link></li>
                  <li><Link href="/research" className="transition hover:text-slate-950">Research Notes</Link></li>
                  <li><Link href="/docs" className="transition hover:text-slate-950">Documentation</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium uppercase tracking-[0.24em] text-slate-700">Legal</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-700">
                  <li><Link href="/privacy" className="transition hover:text-slate-950">Privacy</Link></li>
                  <li><Link href="/terms" className="transition hover:text-slate-950">Terms</Link></li>
                  <li><Link href="/cookies" className="transition hover:text-slate-950">Cookies</Link></li>
                </ul>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3 border-t border-slate-900/8 pt-6 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
              <p>Copyright {new Date().getFullYear()} Pic2Nav. All rights reserved.</p>
              <p>Built for visual geolocation, field verification, and feedback-driven model improvement.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
