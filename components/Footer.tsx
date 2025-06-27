import Link from 'next/link'
import { Github } from 'lucide-react'
import { ModeToggle } from '@/components/mode-toggle'

export function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-8">
            <span className="text-sm text-gray-500 dark:text-gray-400">© 2025 SabiRoad</span>
            <Link href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
              Privacy
            </Link>
            <Link href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
              Terms
            </Link>
            <Link href="/help-center" className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
              Help Center
            </Link>
            <Link href="/feedback" className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
              Feedback
            </Link>
            <Link href="/about" className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
              About
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
              <Github className="w-6 h-6" />
            </Link>
            <ModeToggle />
          </div>
        </div>
      </div>
    </footer>
  )
}
