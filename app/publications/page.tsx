import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  Database,
  FileText,
  FlaskConical,
  Globe2,
  MapPinned,
  Microscope,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const publicationStreams = [
  {
    icon: FileText,
    eyebrow: "Working paper",
    title: "Pic2Nav as a production research system",
    text: "A systems narrative around the hybrid route: direct evidence, retrieval, scene reasoning, confidence gates, and feedback-driven learning.",
    href: "/research",
    cta: "Read the research page",
  },
  {
    icon: FlaskConical,
    eyebrow: "Evaluation notes",
    title: "Backbone and held-out comparison updates",
    text: "Method notes around CLIP, StreetCLIP, deterministic place-grouped validation, and the difference between route utility and model-only scores.",
    href: "/research",
    cta: "View evaluation notes",
  },
  {
    icon: Database,
    eyebrow: "Data notes",
    title: "Public-data collection and training import discipline",
    text: "How reviewed public data, city-balanced batches, and canonical training imports fit into the larger NaviSense research loop.",
    href: "/datasets",
    cta: "Explore datasets",
  },
]

const publicationNotes = [
  {
    date: "April 2026",
    title: "Held-out evaluation became deterministic and place-grouped",
    body: "We shifted away from tiny convenience slices and toward a cleaner held-out comparison so backbone changes can be judged on the same partition.",
  },
  {
    date: "April 2026",
    title: "Nigeria-first public-data import path was added",
    body: "The dataset builder and reviewed-manifest importer separate collection from canonical training, which keeps public data auditable before it touches the model memory.",
  },
  {
    date: "April 2026",
    title: "Public-data promotion is now gated",
    body: "Approved rows now need image evidence, specific labels, city-level context, and a minimum balanced batch before they are allowed into training.",
  },
  {
    date: "Ongoing",
    title: "Publication notes stay tied to the product surface",
    body: "The goal is to publish what the live system is actually doing, not a separate research story detached from the camera workflow and API surface.",
  },
]

const outputLinks = [
  {
    title: "Research page",
    description: "System architecture, live measurements, backbone experiments, and route-level framing.",
    href: "/research",
  },
  {
    title: "Blog archive",
    description: "Stories, product updates, and the broader writing archive that still lives outside the publication notes layer.",
    href: "/blog",
  },
  {
    title: "API access",
    description: "The developer-facing surface for the same pipeline described in the paper and evaluation notes.",
    href: "/api-access",
  },
]

export default function PublicationsPage() {
  return (
    <div className="min-h-screen bg-[#fbfbf8]" style={{ color: "#0f172a" }}>
      <nav className="sticky top-0 z-50 border-b border-slate-900/8 bg-[#fbfbf8]/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-9 w-auto sm:h-10" />
            <div className="hidden sm:block">
              <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: "#334155" }}>
                Pic2Nav
              </p>
              <p className="text-sm font-medium" style={{ color: "#020617" }}>
                Publication Notes
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-8 text-sm lg:flex" style={{ color: "#334155" }}>
            <Link href="/research" className="font-medium transition hover:text-slate-950">
              Research
            </Link>
            <Link href="/publications" className="font-medium" style={{ color: "#020617" }}>
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
        <section className="mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 sm:pb-24 sm:pt-20">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-3xl rounded-[2rem] border border-slate-900/8 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-8">
              <p className="text-xs uppercase tracking-[0.32em]" style={{ color: "#334155" }}>
                Publication notes
              </p>
              <h1
                className="mt-6 text-balance text-5xl font-semibold leading-[0.95] tracking-[-0.04em] sm:text-6xl lg:text-7xl"
                style={{ color: "#020617" }}
              >
                Writing that stays close to the deployed system.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 sm:text-xl" style={{ color: "#334155" }}>
                This page is the bridge between the working paper, the live route, and the product
                surfaces people actually use. It collects the notes that matter when the system
                changes.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button
                  className="group rounded-full !bg-slate-950 px-6 py-6 text-base !text-white hover:!bg-slate-800"
                  asChild
                >
                  <Link href="/research">
                    Read the research
                    <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full !border-slate-400 !bg-white px-6 py-6 text-base !text-slate-950 hover:!border-slate-900 hover:!bg-slate-50"
                  asChild
                >
                  <Link href="/blog">Browse the archive</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-900/8 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-8">
              <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: "#334155" }}>
                What belongs here
              </p>
              <div className="mt-5 space-y-4">
                <div className="flex gap-4 rounded-[1.5rem] border border-slate-900/8 bg-[#fcfcfa] p-5">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <p className="text-base leading-7" style={{ color: "#334155" }}>
                    Paper-facing summaries of the hybrid route, not just product screenshots and
                    feature announcements.
                  </p>
                </div>
                <div className="flex gap-4 rounded-[1.5rem] border border-slate-900/8 bg-[#fcfcfa] p-5">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
                    <Microscope className="h-4 w-4" />
                  </div>
                  <p className="text-base leading-7" style={{ color: "#334155" }}>
                    Honest evaluation notes that explain what improved, what regressed, and where
                    the data or model stack still needs work.
                  </p>
                </div>
                <div className="flex gap-4 rounded-[1.5rem] border border-slate-900/8 bg-[#fcfcfa] p-5">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
                    <MapPinned className="h-4 w-4" />
                  </div>
                  <p className="text-base leading-7" style={{ color: "#334155" }}>
                    Route-level notes that stay tied to the camera workflow, validation logic, and
                    feedback loop used in the product.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-900/8 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.32em]" style={{ color: "#334155" }}>
                Publication streams
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl" style={{ color: "#020617" }}>
                Three threads that now move together.
              </h2>
              <p className="mt-4 text-lg leading-8" style={{ color: "#334155" }}>
                The paper, the evaluation program, and the public-data training work should be
                legible in one place instead of being scattered across unrelated pages.
              </p>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {publicationStreams.map((stream) => (
                <div key={stream.title} className="rounded-[1.75rem] border border-slate-900/8 bg-[#fcfcfa] p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-900/10 text-slate-900">
                    <stream.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-5 text-[11px] uppercase tracking-[0.28em]" style={{ color: "#334155" }}>
                    {stream.eyebrow}
                  </p>
                  <h3 className="mt-3 text-2xl font-medium tracking-[-0.03em]" style={{ color: "#020617" }}>
                    {stream.title}
                  </h3>
                  <p className="mt-3 text-base leading-7" style={{ color: "#334155" }}>
                    {stream.text}
                  </p>
                  <Button
                    className="mt-6 rounded-full border px-5 py-2.5 text-sm font-medium shadow-sm transition"
                    style={{
                      backgroundColor: "#ffffff",
                      color: "#020617",
                      borderColor: "rgba(15,23,42,0.22)",
                    }}
                    asChild
                  >
                    <Link href={stream.href}>{stream.cta}</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.32em]" style={{ color: "#334155" }}>
              Recent notes
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl" style={{ color: "#020617" }}>
              The publication layer should read like a real research notebook.
            </h2>
          </div>

          <div className="grid gap-4">
            {publicationNotes.map((note) => (
              <article key={note.title} className="rounded-[1.6rem] border border-slate-900/8 bg-white p-6 sm:p-7">
                <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: "#334155" }}>
                  {note.date}
                </p>
                <h3 className="mt-3 text-2xl font-medium tracking-[-0.03em]" style={{ color: "#020617" }}>
                  {note.title}
                </h3>
                <p className="mt-3 max-w-3xl text-base leading-7" style={{ color: "#334155" }}>
                  {note.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-900/8 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="mb-10 max-w-3xl">
              <p className="text-xs uppercase tracking-[0.32em]" style={{ color: "#334155" }}>
                Linked surfaces
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl" style={{ color: "#020617" }}>
                Publication notes are one layer of the larger system.
              </h2>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {outputLinks.map((item, index) => (
                <div key={item.title} className="rounded-[1.75rem] border border-slate-900/8 bg-[#fcfcfa] p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-900/10 text-slate-900">
                    {index === 0 ? (
                      <BookOpen className="h-5 w-5" />
                    ) : index === 1 ? (
                      <Globe2 className="h-5 w-5" />
                    ) : (
                      <Database className="h-5 w-5" />
                    )}
                  </div>
                  <h3 className="mt-5 text-2xl font-medium tracking-[-0.03em]" style={{ color: "#020617" }}>
                    {item.title}
                  </h3>
                  <p className="mt-3 text-base leading-7" style={{ color: "#334155" }}>
                    {item.description}
                  </p>
                  <Button
                    className="mt-6 rounded-full border px-5 py-2.5 text-sm font-medium shadow-sm transition"
                    style={{
                      backgroundColor: "#ffffff",
                      color: "#020617",
                      borderColor: "rgba(15,23,42,0.22)",
                    }}
                    asChild
                  >
                    <Link href={item.href}>Open</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div
            className="rounded-[2rem] border p-8 sm:p-10"
            style={{
              backgroundColor: "#020617",
              borderColor: "rgba(255,255,255,0.12)",
              color: "#ffffff",
            }}
          >
            <p className="text-xs uppercase tracking-[0.32em]" style={{ color: "#ffffff" }}>
              Keep it grounded
            </p>
            <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl" style={{ color: "#ffffff" }}>
              The best publication note is still a tested workflow.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8" style={{ color: "rgba(255,255,255,0.82)" }}>
              Use the camera flow, inspect the route, and then write from the actual system behavior
              rather than from memory. That is the bar for the publication layer too.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                className="group rounded-full px-6 py-6 text-base"
                style={{
                  backgroundColor: "#ffffff",
                  color: "#020617",
                  border: "1px solid rgba(255,255,255,0.14)",
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
                  backgroundColor: "rgba(255,255,255,0.04)",
                  color: "#ffffff",
                  borderColor: "rgba(255,255,255,0.3)",
                }}
                asChild
              >
                <Link href="/api-access">Explore API access</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
