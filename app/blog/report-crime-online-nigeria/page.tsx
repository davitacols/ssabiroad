import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'How to Report Crime Online in Nigeria: Official Guide 2025',
  description: 'Step-by-step guide to reporting crimes to Nigerian Police Force online. Anonymous reporting, emergency contacts 199/911, and safety tips.',
  keywords: ['report crime online nigeria', 'nigerian police force crime report', 'how to report crime in nigeria', 'anonymous crime reporting nigeria'],
}

export default function BlogPost() {
  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0a0a0a]">
      <nav className="sticky top-0 z-50 border-b border-stone-200/50 dark:border-stone-800/50 bg-white/50 dark:bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-12 sm:h-14 md:h-16 w-auto" />
          </Link>
          <Button variant="ghost" className="rounded-full" asChild>
            <Link href="/blog"><ArrowLeft className="mr-2 h-4 w-4" />Blog</Link>
          </Button>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">How to Report Crime Online in Nigeria: Official Guide 2025</h1>
        <div className="text-stone-600 dark:text-stone-400 mb-8">January 2025 • 6 min read</div>

        <div className="prose dark:prose-invert max-w-none space-y-6 text-stone-700 dark:text-stone-300">
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl">
            <h3 className="text-xl font-bold mb-2">Emergency Numbers</h3>
            <p className="text-2xl font-bold">📞 199 or 911</p>
            <p>For immediate emergencies, call Nigerian Police Force emergency lines</p>
          </div>

          <h2 className="text-2xl font-bold mt-8 mb-4">How to Report Crime to Nigerian Police Force Online</h2>
          <p className="text-lg">
            Pic2Nav provides a secure platform to report crimes directly to the Nigerian Police Force with AI-powered location detection.
          </p>

          <h3 className="text-xl font-bold mt-6 mb-3">Step-by-Step Process:</h3>
          <ol className="list-decimal pl-6 space-y-3">
            <li><strong>Visit the Crime Reporting Portal</strong> - Go to Pic2Nav crime reporting page</li>
            <li><strong>Upload Evidence</strong> - Add up to 5 photos or videos of the incident</li>
            <li><strong>AI Location Detection</strong> - Our AI automatically extracts location from your photos</li>
            <li><strong>Describe the Incident</strong> - Provide details about what happened</li>
            <li><strong>Choose Reporting Method</strong> - Report anonymously or provide contact information</li>
            <li><strong>Submit Securely</strong> - Your report is encrypted and sent to cybercrime@npf.gov.ng</li>
          </ol>

          <h2 className="text-2xl font-bold mt-8 mb-4">Anonymous Crime Reporting</h2>
          <p>You can report crimes anonymously in Nigeria through Pic2Nav. Your identity is protected:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>No personal information required</li>
            <li>End-to-end encryption (AES-256)</li>
            <li>Secure file uploads</li>
            <li>Direct submission to Nigerian Police Force</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Types of Crimes You Can Report</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Cybercrime and online fraud</li>
            <li>Theft and robbery</li>
            <li>Assault and violence</li>
            <li>Property damage</li>
            <li>Suspicious activities</li>
            <li>Any criminal activity in Nigeria</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Contact Information</h2>
          <div className="bg-stone-100 dark:bg-stone-800 p-6 rounded-xl space-y-2">
            <p><strong>Nigerian Police Force Cybercrime Unit:</strong></p>
            <p>📧 cybercrime@npf.gov.ng</p>
            <p>📞 Emergency: 199 or 911</p>
            <p>🌐 Coverage: All Nigerian states (Lagos, Abuja, Port Harcourt, Kano, Ibadan, etc.)</p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl mt-8">
            <h3 className="text-xl font-bold mb-3">Report a Crime Now</h3>
            <p className="mb-4">Use Pic2Nav's secure platform to report crimes to Nigerian Police Force with AI location detection.</p>
            <Button className="rounded-full bg-red-600 hover:bg-red-700" asChild>
              <Link href="/report-crime">Report Crime →</Link>
            </Button>
          </div>
        </div>
      </article>
    </div>
  )
}
