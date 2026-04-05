import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  Camera,
  Database,
  Globe2,
  Layers3,
  MapPinned,
  Microscope,
  Route,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const snapshotStats = [
  { value: "399", label: "stored recognitions in the live system" },
  { value: "88.73%", label: "positive rate across feedback-bearing records" },
  { value: "99", label: "vectors in the deployed baseline index" },
  { value: "14", label: "unique places in the current place-grouped held-out split" },
]

const researchTracks = [
  {
    icon: Route,
    title: "Hybrid inference routing",
    text: "The product is designed around evidence hierarchy: direct signals first, broader reasoning only when the image actually needs it.",
  },
  {
    icon: Database,
    title: "Feedback-driven retrieval memory",
    text: "Recognitions, confirmations, and corrections are persisted so the system can improve as an operational memory, not just a static model.",
  },
  {
    icon: Layers3,
    title: "Backbone experiments",
    text: "We test stronger vision backbones against the production CLIP baseline using deterministic place-grouped held-out evaluation.",
  },
]

const systemLayers = [
  {
    label: "Direct evidence",
    title: "EXIF GPS and visible-address shortcuts",
    text: "The route checks deterministic signals first so the stack can return precise results without unnecessary model escalation.",
  },
  {
    label: "Retrieval and priors",
    title: "NaviSense V3",
    text: "The ML service combines image embeddings, retrieval memory, and geospatial priors to narrow candidates before route-side validation.",
  },
  {
    label: "Scene reasoning",
    title: "Claude and Google Vision",
    text: "When evidence is partial or messy, OCR, landmark hints, phone numbers, and scene-country reasoning become part of the decision path.",
  },
]

const evaluationCards = [
  {
    label: "Production baseline",
    title: "CLIP ViT-B/32",
    body: "The current deployed baseline is still the safer production default, but the direct geolocation head remains weak in absolute terms.",
    metrics: [
      "Geolocation avg error: 1374.29 km",
      "NaviSense V3 avg error: 36.14 km",
      "Within 10 km: 25%",
      "Vectors in index: 99",
    ],
  },
  {
    label: "Experiment service",
    title: "StreetCLIP",
    body: "The first controlled backbone comparison shows a clear gain on the retrieval-driven path, even though the canonical corpus is still small.",
    metrics: [
      "Geolocation avg error: 1190.10 km",
      "NaviSense V3 avg error: 5.96 km",
      "Within 10 km: 100%",
      "Vectors in index: 45",
    ],
  },
]

const evidenceNotes = [
  "The strongest current production path is still hybrid orchestration rather than a solved end-to-end geolocation regressor.",
  "Claude-assisted address resolution currently outperforms direct ML acceptance in user-confirmed feedback-bearing production cases.",
  "The held-out comparison is more honest than the earlier tiny diagnostic slice, but it is still directional rather than benchmark-grade proof.",
]

const publicationLinks = [
  {
    title: "Working paper",
    description: "A systems paper framing Pic2Nav as a deployable hybrid photo geolocation stack.",
    href: "/blog",
    cta: "Read publication notes",
  },
  {
    title: "Datasets and corpora",
    description: "The project is moving toward stronger canonical evaluation and better place-grouped testing discipline.",
    href: "/datasets",
    cta: "Explore datasets",
  },
  {
    title: "API and product surface",
    description: "The research stack stays close to the actual interface rather than living separately from the product.",
    href: "/api-access",
    cta: "View API access",
  },
]

export default function ResearchPage() {
  return (
    <div className="min-h-screen bg-[#fbfbf8]" style={{ color: "#0f172a" }}>
      <nav className="sticky top-0 z-50 border-b border-slate-900/8 bg-[#fbfbf8]/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-9 w-auto sm:h-10" />
            <div className="hidden sm:block">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-700">Pic2Nav</p>
              <p className="text-sm font-medium text-slate-950">Research</p>
            </div>
          </Link>

          <div className="hidden items-center gap-8 text-sm text-slate-700 lg:flex">
            <Link href="/research" className="font-medium text-slate-950">
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
        <section className="mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 sm:pb-24 sm:pt-20">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-3xl rounded-[2rem] border border-slate-900/8 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-8">
              <p className="text-xs uppercase tracking-[0.32em] text-slate-700">Research overview</p>
              <h1
                className="mt-6 text-balance text-5xl font-semibold leading-[0.95] tracking-[-0.04em] sm:text-6xl lg:text-7xl"
                style={{ color: "#020617" }}
              >
                A research program built around the product, not around a slide deck.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
                Pic2Nav studies photo geolocation as a real systems problem: messy evidence,
                route-level validation, retrieval memory, and feedback loops that improve the stack
                over time.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button
                  className="group rounded-full !bg-slate-950 px-6 py-6 text-base !text-white hover:!bg-slate-800"
                  asChild
                >
                  <Link href="/camera">
                    Try the live workflow
                    <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full !border-slate-400 !bg-white px-6 py-6 text-base !text-slate-950 hover:!border-slate-900 hover:!bg-slate-50"
                  asChild
                >
                  <Link href="/blog">Read publication notes</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-900/8 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-8">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-700">Current snapshot</p>
              <h2 className="mt-3 text-3xl font-medium tracking-[-0.03em] text-slate-950">
                Measured from the live system on April 1, 2026
              </h2>
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                {snapshotStats.map((stat) => (
                  <div key={stat.label} className="rounded-[1.4rem] border border-slate-900/8 bg-[#fcfcfa] p-5">
                    <p className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">{stat.value}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-900/8 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.32em] text-slate-700">Research tracks</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
                Three things we are actually working on.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-700">
                The research page should describe the current system honestly: what is strong,
                what is experimental, and where the product and model stack currently meet.
              </p>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {researchTracks.map((track) => (
                <div key={track.title} className="rounded-[1.75rem] border border-slate-900/8 bg-[#fcfcfa] p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-900/10 text-slate-900">
                    <track.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-2xl font-medium tracking-[-0.03em] text-slate-950">
                    {track.title}
                  </h3>
                  <p className="mt-3 text-base leading-7 text-slate-700">{track.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.32em] text-slate-700">System program</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
              The stack is organized around evidence, not hype.
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {systemLayers.map((layer) => (
              <div key={layer.title} className="rounded-[1.75rem] border border-slate-900/8 bg-white p-6">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-700">{layer.label}</p>
                <h3 className="mt-4 text-2xl font-medium tracking-[-0.03em] text-slate-950">
                  {layer.title}
                </h3>
                <p className="mt-3 text-base leading-7 text-slate-700">{layer.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-900/8 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.32em] text-slate-700">Backbone evaluation</p>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
                  StreetCLIP is the first experiment that clearly moved the retrieval path.
                </h2>
                <p className="mt-5 text-lg leading-8 text-slate-700">
                  We now have a deterministic place-grouped held-out evaluation from 38 canonical
                  records spanning 14 unique places. That split is still small, but it is much more
                  honest than the earlier tiny diagnostic slice.
                </p>

                <div className="mt-8 space-y-4">
                  {evidenceNotes.map((note) => (
                    <div key={note} className="flex gap-4 rounded-[1.5rem] border border-slate-900/8 bg-[#fcfcfa] p-5">
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
                        <Microscope className="h-4 w-4" />
                      </div>
                      <p className="text-base leading-7 text-slate-700">{note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-5">
                {evaluationCards.map((card) => (
                  <div key={card.title} className="rounded-[1.75rem] border border-slate-900/8 bg-white p-6">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-slate-700">{card.label}</p>
                    <h3 className="mt-3 text-3xl font-medium tracking-[-0.03em] text-slate-950">
                      {card.title}
                    </h3>
                    <p className="mt-3 text-base leading-7 text-slate-700">{card.body}</p>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {card.metrics.map((metric) => (
                        <div key={metric} className="rounded-2xl border border-slate-900/8 bg-[#fcfcfa] px-4 py-3 text-sm leading-6 text-slate-800">
                          {metric}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.32em] text-slate-700">Outputs</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
              Publications, datasets, and the product surface stay connected.
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {publicationLinks.map((item, index) => (
              <div key={item.title} className="rounded-[1.75rem] border border-slate-900/8 bg-white p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-900/10 text-slate-900">
                  {index === 0 ? <BookOpen className="h-5 w-5" /> : index === 1 ? <Database className="h-5 w-5" /> : <Globe2 className="h-5 w-5" />}
                </div>
                <h3 className="mt-5 text-2xl font-medium tracking-[-0.03em] text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-base leading-7 text-slate-700">{item.description}</p>
                <Button
                  variant="outline"
                  className="mt-6 rounded-full !border-slate-400 !bg-white !text-slate-950 hover:!border-slate-900 hover:!bg-slate-50"
                  asChild
                >
                  <Link href={item.href}>{item.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-900/8 bg-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1fr_0.95fr]">
            <div className="rounded-[2rem] border border-slate-900/8 bg-[#fcfcfa] p-8 sm:p-10">
              <p className="text-xs uppercase tracking-[0.32em] text-slate-700">Next step</p>
              <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
                Test the research stack on real images.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
                The cleanest way to understand Pic2Nav is still to use it: upload an image, inspect
                the evidence path, and review how the system handles confidence and failure.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  className="group rounded-full !bg-slate-950 px-6 py-6 text-base !text-white hover:!bg-slate-800"
                  asChild
                >
                  <Link href="/camera">
                    Open demo
                    <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full !border-slate-400 !bg-white px-6 py-6 text-base !text-slate-950 hover:!border-slate-900 hover:!bg-slate-50"
                  asChild
                >
                  <Link href="/api-access">Explore API access</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-900/8 bg-white p-8 sm:p-10">
              <p className="text-xs uppercase tracking-[0.32em] text-slate-700">Current stance</p>
              <h3 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
                Honest about what is solved, and what is not.
              </h3>
              <p className="mt-4 text-base leading-7 text-slate-700">
                The research page now reflects the actual paper and live measurements: strong
                hybrid orchestration, improving retrieval, and a geolocation head that still needs
                better data and stronger evaluation.
              </p>
              <div className="mt-6 rounded-[1.5rem] border border-slate-900/8 bg-[#fcfcfa] p-5">
                <p className="text-sm leading-7 text-slate-800">
                  Pic2Nav is best understood as a deployable geolocation stack for messy real-world
                  photographs, not as a single solved benchmark model.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
