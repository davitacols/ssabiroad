import Link from 'next/link'
import { Github } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-8">
            <span className="text-sm text-gray-500">© 2025 SabiRoad</span>
            <Link href="#" className="text-sm text-gray-500 hover:text-indigo-600">
              Privacy
            </Link>
            <Link href="#" className="text-sm text-gray-500 hover:text-indigo-600">
              Terms
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-gray-400 hover:text-indigo-600">
              <Github className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
